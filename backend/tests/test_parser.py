import pytest
from datetime import datetime, timezone
from app.services.parser import parse_watch_history

def test_parse_watch_history_happy_path():
    raw_data = [
        {
            "title": "Watched Cool Video",
            "titleUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "time": "2023-01-01T12:00:00.000Z",
            "subtitles": [{"name": "Rick Astley"}]
        }
    ]
    events = parse_watch_history(raw_data)
    assert len(events) == 1
    assert events[0].video_id == "dQw4w9WgXcQ"
    assert events[0].title == "Cool Video"
    assert events[0].channel_name == "Rick Astley"
    assert events[0].timestamp == datetime(2023, 1, 1, 12, 0, tzinfo=timezone.utc)

def test_parse_deleted_video():
    raw_data = [
        {
            "title": "Watched a video that has been removed",
            "time": "2023-01-01T12:00:00.000Z"
        }
    ]
    events = parse_watch_history(raw_data)
    assert len(events) == 1
    assert events[0].video_id is None
    assert events[0].title == "a video that has been removed"
    assert events[0].channel_name is None

def test_skip_missing_time():
    raw_data = [
        {
            "title": "Watched some ad",
        }
    ]
    events = parse_watch_history(raw_data)
    assert len(events) == 0
