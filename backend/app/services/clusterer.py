"""Clustering pipeline for genre breakdown and taste drift computation."""

import hashlib
import logging
import re
import time
from collections import Counter

import numpy as np

logger = logging.getLogger(__name__)

CLUSTERING_MIN_VIDEOS = 100
K_MAX = 8
SMALL_CLUSTER_PCT = 0.02
RANDOM_STATE = 42  # dont change this unless u know what ur doing
MODEL_NAME = "all-MiniLM-L6-v2"
# 384 dims for this model, dont ask me why
HF_API_URL = f"https://api-inference.huggingface.co/models/sentence-transformers/{MODEL_NAME}"
HF_BATCH_SIZE = 100  # hf gets mad if u send more than this at once

YOUTUBE_CATEGORY_MAP = {
    "1": "Film & Animation",
    "2": "Autos & Vehicles",
    "10": "Music",
    "15": "Pets & Animals",
    "17": "Sports",
    "18": "Short Movies",
    "19": "Travel & Events",
    "20": "Gaming",
    "21": "Videoblogging",
    "22": "People & Blogs",
    "23": "Comedy",
    "24": "Entertainment",
    "25": "News & Politics",
    "26": "Howto & Style",
    "27": "Education",
    "28": "Science & Technology",
    "29": "Nonprofits & Activism",
}


def _title_hash(title_text: str) -> str:
    return hashlib.sha256(title_text.encode()).hexdigest()


def _build_embed_text(title: str, category_id: str | None) -> str:
    # combining title + category gives better clusters than just title alone
    cat_name = YOUTUBE_CATEGORY_MAP.get(category_id or "", "") if category_id else ""
    if cat_name:
        return f"{title} [{cat_name}]"
    return title


def _load_embeddings(video_ids: list[str], title_map: dict[str, str],
                     category_map: dict[str, str], db) -> tuple[np.ndarray, list[str]]:
    from app.models.cache import VideoMetadataCache
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    eligible = [(vid, title_map[vid]) for vid in video_ids if vid in title_map and title_map[vid]]
    # skip vids with no title, they mess up the embedding
    if not eligible:
        return np.empty((0, 384)), []

    valid_ids = [v for v, _ in eligible]
    embed_texts = [_build_embed_text(t, category_map.get(v)) for v, t in eligible]
    hashes = [_title_hash(t) for t in embed_texts]

    records = db.query(VideoMetadataCache).filter(
        VideoMetadataCache.video_id.in_(valid_ids)
    ).all()
    cached = {r.video_id: r for r in records}

    embeddings = [None] * len(valid_ids)
    to_compute_indices = []

    for i, (vid, text, h) in enumerate(zip(valid_ids, embed_texts, hashes)):
        row = cached.get(vid)
        if row and row.embedding and row.title_hash == h:
            embeddings[i] = np.array(row.embedding, dtype=np.float32)
        else:
            to_compute_indices.append(i)

    if to_compute_indices:
        logger.info(f"Computing embeddings for {len(to_compute_indices)} uncached videos via HF API...")
        texts_to_embed = [embed_texts[i] for i in to_compute_indices]

        import httpx
        from app.config import settings

        headers = {"Authorization": f"Bearer {settings.hf_api_token}"}
        all_embeddings = []

        for batch_start in range(0, len(texts_to_embed), HF_BATCH_SIZE):
            batch = texts_to_embed[batch_start:batch_start + HF_BATCH_SIZE]
            for attempt in range(3):
                # hf returns 503 while the model wakes up (cold start ~5-15s)
                # backoff so we dont spam their servers like a clown
                try:
                    resp = httpx.post(
                        HF_API_URL,
                        headers=headers,
                        json={"inputs": batch},
                        timeout=120
                    )
                    resp.raise_for_status()
                    batch_embs = np.array(resp.json(), dtype=np.float32)
                    all_embeddings.append(batch_embs)
                    break
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 503 and attempt < 2:
                        wait = 5 * (2 ** attempt)
                        logger.warning(f"HF API 503 (model loading), retrying in {wait}s...")
                        time.sleep(wait)
                        continue
                    logger.error(f"HF API HTTP error: {e.response.status_code} - {e.response.text[:200]}")
                    raise
                except (httpx.TimeoutException, httpx.ConnectError) as e:
                    if attempt < 2:
                        wait = 5 * (2 ** attempt)
                        logger.warning(f"HF API connection error, retrying in {wait}s...")
                        time.sleep(wait)
                        continue
                    raise

        if len(all_embeddings) > 1:
            computed = np.vstack(all_embeddings)
        else:
            computed = all_embeddings[0]

        upsert_rows = []
        for j, i in enumerate(to_compute_indices):
            vid = valid_ids[i]
            embeddings[i] = computed[j]
            upsert_rows.append({
                "video_id": vid,
                "embedding": computed[j].tolist(),
                "title_hash": hashes[i],
                "is_available": (cached[vid].is_available if vid in cached else True),
            })

        # free the big numpy array as soon as we're done with it
        del computed

        stmt = pg_insert(VideoMetadataCache).values(upsert_rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=["video_id"],
            set_={
                "embedding": stmt.excluded.embedding,
                "title_hash": stmt.excluded.title_hash,
            }
        )
        db.execute(stmt)
        db.commit()
        logger.info("Embedding cache updated.")

    paired = [(vid, emb) for vid, emb in zip(valid_ids, embeddings) if emb is not None]
    if not paired:
        return np.empty((0, 384)), []

    final_ids, final_embs = zip(*paired)
    return np.stack(final_embs), list(final_ids)


def _label_from_categories(video_ids: list[str], category_map: dict[str, str]) -> str | None:
    cats = [YOUTUBE_CATEGORY_MAP.get(category_map.get(v, ""), "") for v in video_ids]
    cats = [c for c in cats if c]
    if not cats:
        return None
    coverage = len(cats) / len(video_ids)
    if coverage < 0.5:
        return None
    top = [name for name, _ in Counter(cats).most_common(2)]  # take top 2, more than that gets confusing
    return " \u00b7 ".join(top) if top else None


_STOPWORDS = {"the", "a", "an", "is", "in", "of", "to", "and", "for", "with",
               "on", "at", "by", "it", "my", "we", "this", "that", "how", "why",
               "what", "i", "you", "he", "she", "they", "be", "was", "are", "has",
               "had", "but", "not", "your", "our", "did", "do", "ft", "official",
               "video", "ep", "episode", "part", "full", "season", "series"}
# pretty sure this list is incomplete but good enuf for now


def _label_from_titles(titles: list[str]) -> str:
    words = []
    for t in titles:
        tokens = re.findall(r"[a-zA-Z]+", t.lower())
        words.extend(t for t in tokens if t not in _STOPWORDS and len(t) > 3)
    if not words:
        return "Mixed Content"
    top = [w.title() for w, _ in Counter(words).most_common(2)]
    return " \u00b7 ".join(top) if top else "Mixed Content"


def _assign_label(video_ids: list[str], representative_titles: list[str],
                  category_map: dict[str, str]) -> str:
    label = _label_from_categories(video_ids, category_map)
    if label:
        return label
    return _label_from_titles(representative_titles)


def run_clustering_pipeline(
    parsed_events: list[dict],
    category_map: dict[str, str],
    db
) -> tuple[list | None, list | None, str | None]:
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score
    # import inside function b/c sklearn is slow to load and we might skip clustering entirely

    title_map: dict[str, str] = {}
    video_to_timestamps: dict[str, list] = {}

    for ev in parsed_events:
        vid = ev.get("video_id")
        if not vid:
            continue
        if vid not in title_map:
            title_map[vid] = ev.get("title", "")
        ts = ev.get("timestamp")
        if ts:
            video_to_timestamps.setdefault(vid, []).append(ts)

    enriched_ids = [vid for vid in title_map if vid in category_map]

    if len(enriched_ids) < CLUSTERING_MIN_VIDEOS:
        reason = (
            f"Clustering requires at least {CLUSTERING_MIN_VIDEOS} enriched videos "
            f"(found {len(enriched_ids)}). Genre breakdown is unavailable."
        )
        logger.info(reason)
        return None, None, reason

    matrix, valid_ids = _load_embeddings(enriched_ids, title_map, category_map, db)

    if len(valid_ids) < CLUSTERING_MIN_VIDEOS:
        reason = f"Insufficient embeddable videos ({len(valid_ids)}) for clustering."
        return None, None, reason

    # log the params just in case something looks off
    logger.info(f"Running K-Means (k\u2264{K_MAX}, random_state={RANDOM_STATE}) on {len(valid_ids)} videos...")

    k = min(K_MAX, len(valid_ids))
    kmeans = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init="auto")
    labels = kmeans.fit_predict(matrix)

    # silhouette score is useful for debugging, keep an eye on this in logs
    if len(set(labels)) > 1:
        sil = silhouette_score(matrix, labels, sample_size=min(2000, len(labels)))
        logger.info(f"Silhouette score: {sil:.4f}")

    total = len(valid_ids)
    cluster_counts = Counter(labels.tolist())
    small_clusters = {c for c, cnt in cluster_counts.items() if cnt / total < SMALL_CLUSTER_PCT}
    # merge tiny clusters into "Other" so we dont get like 1-video categories
    OTHER_LABEL = "Other"

    clusters: dict[int, dict] = {}

    for idx, vid in enumerate(valid_ids):
        raw_label = int(labels[idx])
        if raw_label in small_clusters:
            raw_label = -1
        clusters.setdefault(raw_label, {"video_ids": [], "distances": []})
        centroid = kmeans.cluster_centers_[int(labels[idx])] if raw_label != -1 else None
        dist = float(np.linalg.norm(matrix[idx] - centroid)) if centroid is not None else 0.0
        clusters[raw_label]["video_ids"].append(vid)
        clusters[raw_label]["distances"].append(dist)

    genre_breakdown = []
    label_to_cluster_id: dict[str, int] = {}

    for raw_id, data in clusters.items():
        vids = data["video_ids"]
        dists = data["distances"]

        if raw_id == -1:
            display_label = OTHER_LABEL
        else:
            sorted_pairs = sorted(zip(dists, vids))
            representative_titles = [title_map.get(v, "") for _, v in sorted_pairs[:5]]
            display_label = _assign_label(vids, representative_titles, category_map)
            # handle label collisions — keep appending (2), (3), etc until unique
            # the old code only checked once which broke when 3+ clusters had the same name
            existing = {e["label"] for e in genre_breakdown}
            if display_label in existing:
                counter = 2
                while f"{display_label} ({counter})" in existing:
                    counter += 1
                display_label = f"{display_label} ({counter})"

        entry = {
            "label": display_label,
            "video_count": len(vids),
            "pct": round(len(vids) / total * 100, 1),
            "representative_titles": [title_map.get(v, "") for v in vids[:5]],
        }
        genre_breakdown.append(entry)
        label_to_cluster_id[display_label] = raw_id

    genre_breakdown.sort(key=lambda x: x["video_count"], reverse=True)

    vid_to_label: dict[str, str] = {}
    for raw_id, data in clusters.items():
        label = next((e["label"] for e in genre_breakdown if label_to_cluster_id[e["label"]] == raw_id), OTHER_LABEL)
        for vid in data["video_ids"]:
            vid_to_label[vid] = label

    # done with the heavy stuff, free memory
    del matrix
    del clusters

    from collections import defaultdict
    monthly: dict[str, list[str]] = defaultdict(list)
    for ev in parsed_events:
        vid = ev.get("video_id")
        ts = ev.get("timestamp")
        if not vid or not ts or vid not in vid_to_label:
            continue
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            month_key = dt.strftime("%Y-%m")
            monthly[month_key].append(vid_to_label[vid])
        except Exception:
            continue

    taste_drift = []
    for month in sorted(monthly.keys()):
        label_list = monthly[month]
        count = len(label_list)
        dist = Counter(label_list)
        # round percentages to 1 decimal, frontend doesnt need more precision
        taste_drift.append({
            "month": month,
            "video_count": count,
            "clusters": {lbl: round(cnt / count * 100, 1) for lbl, cnt in dist.items()}
        })

    logger.info(
        f"Clustering complete. {len(genre_breakdown)} clusters "
        f"({len([e for e in genre_breakdown if e['label'] != OTHER_LABEL])} named + "
        f"{'1 Other' if any(e['label'] == OTHER_LABEL for e in genre_breakdown) else '0 Other'}). "
        f"Taste drift across {len(taste_drift)} months."
    )

    return genre_breakdown, taste_drift, None
