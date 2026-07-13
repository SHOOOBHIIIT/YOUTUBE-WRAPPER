import io
import json
import zipfile
import pytest

from app.services.zip_handler import (
    find_and_extract_watch_history,
    ZipBombError,
    WatchHistoryNotFoundError,
    MalformedJsonError,
    InvalidWatchHistoryError,
    ZipValidationError,
    ZIP_BOMB_THRESHOLD_BYTES,
    STREAM_CHUNK_SIZE,
)


def make_zip(files: dict[str, bytes]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path, content in files.items():
            zf.writestr(path, content)
    return buf.getvalue()


def valid_watch_history(n: int = 3) -> list[dict]:
    return [
        {
            "header": "YouTube",
            "title": f"Watched Video {i}",
            "titleUrl": f"https://www.youtube.com/watch?v=videoId{i}",
            "time": "2024-01-01T00:00:00.000Z",
        }
        for i in range(n)
    ]


class TestHappyPath:
    def test_finds_watch_history_at_root(self):
        data = valid_watch_history()
        z = make_zip({"watch-history.json": json.dumps(data).encode()})
        result = find_and_extract_watch_history(z)
        assert len(result) == 3

    def test_finds_watch_history_in_nested_folder(self):
        data = valid_watch_history(5)
        z = make_zip({
            "Takeout/YouTube and YouTube Music/history/watch-history.json":
                json.dumps(data).encode()
        })
        result = find_and_extract_watch_history(z)
        assert len(result) == 5

    def test_finds_watch_history_case_insensitive(self):
        data = valid_watch_history(2)
        z = make_zip({"some/folder/Watch-History.JSON": json.dumps(data).encode()})
        result = find_and_extract_watch_history(z)
        assert len(result) == 2

    def test_deeply_nested_path(self):
        data = valid_watch_history(1)
        z = make_zip({"a/b/c/d/e/watch-history.json": json.dumps(data).encode()})
        result = find_and_extract_watch_history(z)
        assert len(result) == 1


class TestZipBombProtection:
    def test_rejects_large_uncompressed_content(self):
        oversized = b"A" * (ZIP_BOMB_THRESHOLD_BYTES + 1)
        z = make_zip({"watch-history.json": oversized})
        with pytest.raises(ZipBombError):
            find_and_extract_watch_history(z)

    def test_accepts_content_just_under_threshold(self):
        data = valid_watch_history(10)
        z = make_zip({"watch-history.json": json.dumps(data).encode()})
        result = find_and_extract_watch_history(z)
        assert len(result) == 10


class TestWatchHistoryNotFound:
    def test_raises_when_no_watch_history_json(self):
        z = make_zip({"some-other-file.json": b'{"not": "history"}'})
        with pytest.raises(WatchHistoryNotFoundError):
            find_and_extract_watch_history(z)

    def test_raises_for_wrong_filename(self):
        data = valid_watch_history()
        z = make_zip({"watch_history.json": json.dumps(data).encode()})
        with pytest.raises(WatchHistoryNotFoundError):
            find_and_extract_watch_history(z)


class TestJsonValidation:
    def test_raises_for_malformed_json(self):
        z = make_zip({"watch-history.json": b'[{"title": "Video", BROKEN'})
        with pytest.raises(MalformedJsonError):
            find_and_extract_watch_history(z)

    def test_raises_for_json_object_not_list(self):
        z = make_zip({"watch-history.json": b'{"not": "a list"}'})
        with pytest.raises(InvalidWatchHistoryError):
            find_and_extract_watch_history(z)

    def test_raises_for_empty_list(self):
        z = make_zip({"watch-history.json": b'[]'})
        with pytest.raises(InvalidWatchHistoryError):
            find_and_extract_watch_history(z)

    def test_raises_for_list_of_non_objects(self):
        z = make_zip({"watch-history.json": b'["not", "watch", "events"]'})
        with pytest.raises(InvalidWatchHistoryError):
            find_and_extract_watch_history(z)


class TestBadZipFile:
    def test_raises_for_non_zip_bytes(self):
        with pytest.raises(ZipValidationError):
            find_and_extract_watch_history(b"this is not a zip file at all")

    def test_raises_for_empty_bytes(self):
        with pytest.raises(ZipValidationError):
            find_and_extract_watch_history(b"")
