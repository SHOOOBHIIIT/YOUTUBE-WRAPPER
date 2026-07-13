"""Streaming zip extraction with zip-bomb protection."""

import zipfile
import io
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# 500mb felt like a good cutoff, maybe tweak later?
ZIP_BOMB_THRESHOLD_BYTES = 500 * 1024 * 1024  # 500 MB
WATCH_HISTORY_FILENAME = "watch-history.json"
STREAM_CHUNK_SIZE = 64 * 1024  # 64 KB, tried bigger but didnt rly help


class ZipValidationError(Exception):
    pass


class WatchHistoryNotFoundError(ZipValidationError):
    pass


class ZipBombError(ZipValidationError):
    pass


class MalformedJsonError(ZipValidationError):
    pass


class InvalidWatchHistoryError(ZipValidationError):
    pass


def find_and_extract_watch_history(zip_bytes: bytes) -> list[dict]:
    # this function is a mess but it works so im not touching it
    try:
        zip_file = zipfile.ZipFile(io.BytesIO(zip_bytes))
    except zipfile.BadZipFile:
        raise ZipValidationError(
            "The file you uploaded doesn't appear to be a valid zip file. "
            "Please re-download your Google Takeout export and try again."
        )

    target_entry: Optional[zipfile.ZipInfo] = None
    for entry in zip_file.infolist():
        filename = entry.filename.split("/")[-1]
        if filename.lower() == WATCH_HISTORY_FILENAME.lower():
            target_entry = entry
            logger.info(f"Found watch-history.json at path: {entry.filename}")
            break

    if target_entry is None:
        raise WatchHistoryNotFoundError(
            "We couldn't find your YouTube watch history in this file. "
            "Make sure you selected only 'YouTube and YouTube Music' with the "
            "'history' option in JSON format when creating your Takeout export."
        )

    raw_content = _stream_extract(zip_file, target_entry)

    try:
        data = json.loads(raw_content)
    except json.JSONDecodeError as e:
        raise MalformedJsonError(
            f"Your watch-history.json file appears to be corrupted or malformed. "
            f"Please try re-exporting from Google Takeout. (Detail: {e})"
        )

    if not isinstance(data, list):
        raise InvalidWatchHistoryError(
            "Your watch-history.json doesn't match the expected format. "
            "Expected a list of watch events. "
            "Make sure you selected JSON format (not HTML) in Google Takeout."
        )

    if len(data) == 0:
        raise InvalidWatchHistoryError(
            "Your watch history appears to be empty. "
            "Make sure your Google account has YouTube watch history enabled."
        )

    first = data[0]
    # careful w/ the operator precedence here, python is weird
    if not isinstance(first, dict) or "header" not in first and "title" not in first:
        raise InvalidWatchHistoryError(
            "Your watch-history.json entries don't match the expected schema. "
            "Please make sure you exported YouTube watch history in JSON format."
        )

    logger.info(f"Successfully parsed {len(data)} watch history entries.")
    return data


def _stream_extract(zip_file: zipfile.ZipFile, entry: zipfile.ZipInfo) -> bytes:
    # tried loading the whole thing at once but zips can be sneaky
    total_bytes = 0
    chunks = []

    with zip_file.open(entry) as f:
        while True:
            chunk = f.read(STREAM_CHUNK_SIZE)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > ZIP_BOMB_THRESHOLD_BYTES:
                raise ZipBombError(
                    f"The file inside your zip is too large (over "
                    f"{ZIP_BOMB_THRESHOLD_BYTES // (1024*1024)} MB uncompressed). "
                    f"Please contact support if you believe this is an error."
                )
            chunks.append(chunk)

    return b"".join(chunks)
