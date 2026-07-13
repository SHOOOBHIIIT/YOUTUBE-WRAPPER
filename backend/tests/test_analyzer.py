import pytest
from app.services.analyzer import run_core_analysis

def test_analyzer_empty_input():
    result = run_core_analysis([], {}, "America/New_York")
    assert result["top_channels"] == []
    assert result["temporal_heatmap"] == []
    assert result["binge_sessions"]["top_by_count"] == []

def test_analyzer_basic_logic():
    parsed_events = [
        {"video_id": "v1", "channel_name": "C1", "timestamp": "2023-01-01T12:00:00Z"},
        {"video_id": "v2", "channel_name": "C1", "timestamp": "2023-01-01T12:05:00Z"},
        {"video_id": "v3", "channel_name": "C2", "timestamp": "2023-01-01T12:10:00Z"}
    ]
    metadata_cache = {
        "v1": {"duration_seconds": 2000},
        "v2": {"duration_seconds": 2000},
        "v3": {"duration_seconds": 100}
    }

    result = run_core_analysis(parsed_events, metadata_cache, "UTC")

    assert len(result["top_channels"]) == 2
    assert result["top_channels"][0]["channel_name"] == "C1"
    assert result["top_channels"][0]["video_count"] == 2

    assert len(result["binge_sessions"]["top_by_count"]) == 0

def test_binge_detection():
    parsed_events = [
        {"video_id": f"v{i}", "channel_name": "BingeBoy", "timestamp": f"2023-01-01T12:0{i}:00Z"}
        for i in range(1, 7)
    ]
    metadata_cache = {
        f"v{i}": {"duration_seconds": 700} for i in range(1, 7)
    }
    result = run_core_analysis(parsed_events, metadata_cache, "UTC")

    assert len(result["binge_sessions"]["top_by_count"]) == 1
    session = result["binge_sessions"]["top_by_count"][0]
    assert session["video_count"] == 6
    assert session["total_duration_seconds"] == 4200
    assert session["top_channel"] == "BingeBoy"
