import pytest
import numpy as np
from unittest.mock import MagicMock, patch
from app.services.clusterer import (
    run_clustering_pipeline,
    _title_hash,
    _label_from_titles,
    _label_from_categories,
    CLUSTERING_MIN_VIDEOS,
)


def _make_events(n: int, prefix: str = "Video", channel: str = "Channel") -> list[dict]:
    return [
        {
            "video_id": f"vid_{i}",
            "title": f"{prefix} {i}",
            "channel_name": channel,
            "timestamp": "2024-01-15T10:00:00Z",
        }
        for i in range(n)
    ]


def _make_cache(video_ids: list[str], category: str = "17") -> dict:
    class FakeRecord:
        def __init__(self):
            self.category = category
            self.is_available = True
            self.embedding = None
            self.title_hash = None
    return {vid: FakeRecord() for vid in video_ids}


def _fake_embeddings(n: int, dims: int = 384, seed: int = 0) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return rng.random((n, dims), dtype=np.float32)


def test_title_hash_deterministic():
    h1 = _title_hash("Hello World")
    h2 = _title_hash("Hello World")
    assert h1 == h2

def test_title_hash_different_texts():
    assert _title_hash("A") != _title_hash("B")

def test_label_from_titles_basic():
    titles = ["Python Tutorial Beginner", "Python Programming Advanced", "Python Code Example"]
    label = _label_from_titles(titles)
    assert "Python" in label

def test_label_from_titles_empty():
    label = _label_from_titles([])
    assert label == "Mixed Content"

def test_label_from_categories_sparse():
    category_map = {f"vid_{i}": "999" for i in range(10)}
    video_ids = [f"vid_{i}" for i in range(10)]
    result = _label_from_categories(video_ids, category_map)
    assert result is None

def test_label_from_categories_sufficient():
    category_map = {f"vid_{i}": "17" for i in range(10)}
    video_ids = [f"vid_{i}" for i in range(10)]
    result = _label_from_categories(video_ids, category_map)
    assert result == "Sports"


def test_empty_input_returns_none():
    db = MagicMock()
    g, t, reason = run_clustering_pipeline([], {}, db)
    assert g is None
    assert t is None
    assert reason is not None
    assert "Clustering requires" in reason

def test_below_minimum_returns_none():
    n = CLUSTERING_MIN_VIDEOS - 1
    events = _make_events(n)
    cache = _make_cache([f"vid_{i}" for i in range(n)])
    db = MagicMock()
    g, t, reason = run_clustering_pipeline(events, cache, db)
    assert g is None
    assert reason is not None

@patch("app.services.clusterer._load_embeddings")
def test_happy_path_returns_clusters(mock_load):
    n = 300
    events = _make_events(n)
    for i, ev in enumerate(events):
        month = (i % 3) + 1
        ev["timestamp"] = f"2024-{month:02d}-15T10:00:00Z"
    cache = _make_cache([f"vid_{i}" for i in range(n)])

    ids = [f"vid_{i}" for i in range(n)]
    mock_load.return_value = (_fake_embeddings(n), ids)

    db = MagicMock()
    g, t, reason = run_clustering_pipeline(events, cache, db)

    assert reason is None
    assert isinstance(g, list)
    assert len(g) > 0
    assert isinstance(t, list)
    assert len(t) == 3
    for entry in t:
        assert "video_count" in entry
        assert "clusters" in entry
        for key in entry["clusters"]:
            assert isinstance(key, str)

@patch("app.services.clusterer._load_embeddings")
def test_near_duplicate_titles_dont_collapse_to_one_cluster(mock_load):
    n = 200
    events = [{"video_id": f"vid_{i}", "title": "The Cat Sat on the Mat",
                "channel_name": "C", "timestamp": "2024-01-15T10:00:00Z"} for i in range(n)]
    cache = _make_cache([f"vid_{i}" for i in range(n)])
    ids = [f"vid_{i}" for i in range(n)]
    mock_load.return_value = (_fake_embeddings(n, seed=1), ids)

    db = MagicMock()
    g, t, reason = run_clustering_pipeline(events, cache, db)
    assert reason is None
    assert len(g) > 1

@patch("app.services.clusterer._load_embeddings")
def test_maximally_diverse_titles_no_singleton_clusters(mock_load):
    n = 200
    events = _make_events(n, prefix="Unique Topic")
    cache = _make_cache([f"vid_{i}" for i in range(n)])
    ids = [f"vid_{i}" for i in range(n)]

    rng = np.random.default_rng(2)
    embeddings = rng.standard_normal((n, 384)).astype(np.float32)
    embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
    mock_load.return_value = (embeddings, ids)

    db = MagicMock()
    g, t, reason = run_clustering_pipeline(events, cache, db)
    assert reason is None
    total = sum(e["video_count"] for e in g)
    for cluster in g:
        if cluster["label"] != "Other":
            assert cluster["video_count"] >= 2
