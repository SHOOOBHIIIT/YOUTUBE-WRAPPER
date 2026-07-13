import logging
import httpx
import isodate
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from app.config import settings
from app.models.cache import VideoMetadataCache
from app.models.upload import UploadedHistory

logger = logging.getLogger(__name__)

class QuotaExceededError(Exception):
    pass  # youtube api quota is like 10k units/day, runs out fast

YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/videos"
NORMAL_TTL_DAYS = 30
TOMBSTONE_TTL_DAYS = 90  # tombstones live longer b/c deleted videos come back sometimes

async def enrich_videos(video_ids: set[str], db: Session, upload_id: str = None) -> dict:
    if not video_ids:
        return {}

    now = datetime.now(timezone.utc)

    cached_records = db.query(VideoMetadataCache).filter(
        VideoMetadataCache.video_id.in_(video_ids)
    ).all()

    valid_cache = {}
    stale_ids = set()

    for record in cached_records:
        fetched_at = record.fetched_at
        if fetched_at.tzinfo is None:
            fetched_at = fetched_at.replace(tzinfo=timezone.utc)

        age_days = (now - fetched_at).days

        if record.is_available:
            if age_days < NORMAL_TTL_DAYS:
                valid_cache[record.video_id] = record
            else:
                stale_ids.add(record.video_id)
        else:
            if age_days < TOMBSTONE_TTL_DAYS:
                valid_cache[record.video_id] = record
            else:
                stale_ids.add(record.video_id)

    missing_ids = video_ids - set(valid_cache.keys()) - stale_ids
    ids_to_fetch = list(missing_ids | stale_ids)

    if not ids_to_fetch:
        return valid_cache

    api_key = settings.youtube_api_key
    if not api_key:
        logger.warning("No YouTube API key provided. Skipping enrichment.")
        return valid_cache

    async with httpx.AsyncClient() as client:
        # TODO: maybe use aiohttp instead? httpx was giving me issues before
        for i in range(0, len(ids_to_fetch), 50):  # youtube only lets 50 ids per request
            batch = ids_to_fetch[i:i+50]

            if upload_id:
                upload = db.query(UploadedHistory).filter_by(id=upload_id).first()
                if upload:
                    upload.updated_at = datetime.now(timezone.utc)
                    db.commit()

            try:
                response = await client.get(
                    YOUTUBE_API_URL,
                    params={
                        "part": "snippet,contentDetails",
                        "id": ",".join(batch),
                        "key": api_key
                    }
                )
            except httpx.RequestError as e:
                logger.error(f"HTTP request to YouTube API failed: {e}")
                continue

            if response.status_code == 403:
                data = response.json()
                reason = data.get("error", {}).get("errors", [{}])[0].get("reason")
                # youtube returns nested error objects, gotta dig into them
                if reason in ["quotaExceeded", "dailyLimitExceeded"]:
                    logger.error("YouTube API Quota Exceeded.")
                    raise QuotaExceededError("YouTube API Quota Exceeded.")
                else:
                    logger.error(f"YouTube API 403 Error: {data}")
                    continue
            elif response.status_code != 200:
                logger.error(f"YouTube API Error {response.status_code}: {response.text}")
                continue

            data = response.json()
            items = data.get("items", [])

            fetched_ids = set()
            records_to_upsert = []

            for item in items:
                v_id = item["id"]
                fetched_ids.add(v_id)

                snippet = item.get("snippet", {})
                content_details = item.get("contentDetails", {})

                category_id = snippet.get("categoryId")
                tags = snippet.get("tags", [])
                duration_str = content_details.get("duration", "PT0S")

                duration_seconds = 0
                try:
                    duration_seconds = int(isodate.parse_duration(duration_str).total_seconds())
                except Exception:
                    pass  # isodate can throw random errors, just default to 0

                records_to_upsert.append({
                    "video_id": v_id,
                    "is_available": True,
                    "category": category_id,
                    "duration_seconds": duration_seconds,
                    "tags": ",".join(tags) if tags else None,  # tags come back as a list, join them for storage
                    "fetched_at": datetime.now(timezone.utc)
                })

            # tombstones for videos that disappeared from the API response
            missing_in_response = set(batch) - fetched_ids
            for v_id in missing_in_response:
                records_to_upsert.append({
                    "video_id": v_id,
                    "is_available": False,
                    "category": None,
                    "duration_seconds": None,
                    "tags": None,
                    "fetched_at": datetime.now(timezone.utc)
                })

            if records_to_upsert:
                stmt = insert(VideoMetadataCache).values(records_to_upsert)

                update_dict = {
                    "is_available": stmt.excluded.is_available,
                    "category": stmt.excluded.category,
                    "duration_seconds": stmt.excluded.duration_seconds,
                    "tags": stmt.excluded.tags,
                    "fetched_at": stmt.excluded.fetched_at,
                }

                stmt = stmt.on_conflict_do_update(
                    index_elements=['video_id'],
                    set_=update_dict
                )

                db.execute(stmt)
                db.commit()

                for r in records_to_upsert:
                    valid_cache[r["video_id"]] = VideoMetadataCache(**r)

    return valid_cache
