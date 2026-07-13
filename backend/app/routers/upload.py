import uuid
import logging
import asyncio
import concurrent.futures
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.upload import UploadedHistory, UploadStatus
from app.models.result import WrappedResult
from app.services.zip_handler import (
    find_and_extract_watch_history,
    ZipValidationError,
    WatchHistoryNotFoundError,
    ZipBombError,
    MalformedJsonError,
    InvalidWatchHistoryError,
)
from app.schemas.upload import UploadResponse
from app.services.parser import parse_watch_history
from app.services.youtube_api import enrich_videos, QuotaExceededError
from app.services.analyzer import run_core_analysis
from app.services.clusterer import run_clustering_pipeline

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_ZIP_SIZE_BYTES = 200 * 1024 * 1024  # 200mb should be more than enuf for youtube history


async def process_upload_task(upload_id: str, entries: list[dict], timezone_str: str):
    # this runs in the background, dont block the upload response
    db = SessionLocal()
    try:
        upload_record = db.query(UploadedHistory).get(upload_id)
        if not upload_record:
            return

        try:
            parsed_events = parse_watch_history(entries)
            upload_record.parsed_events = [e.model_dump(mode='json') for e in parsed_events]
        # store parsed events right away so we dont lose them if enrichment fails
            upload_record.raw_entry_count = len(parsed_events)
            db.commit()
        except Exception as e:
            logger.exception("Failed to parse watch history")
            _mark_failed(db, upload_record, "Failed to parse watch history.")
            return

        video_ids = {e.video_id for e in parsed_events if e.video_id}
        # some events dont have video_id (like ads or removed vids)
        try:
            metadata_cache = await enrich_videos(video_ids, db, upload_id=upload_id)
        except QuotaExceededError:
            _mark_failed(db, upload_record, "YouTube API quota exceeded, try again tomorrow.")
            return
        except Exception as e:
            logger.exception("Enrichment failed")
            _mark_failed(db, upload_record, "Failed to enrich data from YouTube API.")
            return

        try:
            logger.info("Starting analysis pipeline...")
            analysis_results = run_core_analysis(
                parsed_events=[e.model_dump() for e in parsed_events],
                metadata_cache=metadata_cache,
                timezone_str=timezone_str
            )

            wrapped_result = WrappedResult(
                id=str(uuid.uuid4()),
                user_id=upload_record.user_id,
                upload_id=upload_id,
                top_channels=analysis_results.get("top_channels"),
                temporal_heatmap=analysis_results.get("temporal_heatmap"),
                binge_sessions=analysis_results.get("binge_sessions")
            )
            db.add(wrapped_result)
            db.commit()

        except Exception as e:
            logger.exception("Analysis pipeline failed")
            _mark_failed(db, upload_record, "Failed to analyze watch history data.")
            return

        try:
            logger.info("Starting clustering pipeline...")
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(
                    run_clustering_pipeline,
                    parsed_events=[e.model_dump() for e in parsed_events],
                    metadata_cache=metadata_cache,
                    db=db
                )
                genre_breakdown, taste_drift, skipped_reason = future.result(timeout=300)
            wrapped_result.genre_breakdown = genre_breakdown
            wrapped_result.taste_drift = taste_drift
            wrapped_result.clustering_skipped_reason = skipped_reason
            db.commit()
        except concurrent.futures.TimeoutError:
            logger.warning("Clustering pipeline timed out after 5 minutes")
            wrapped_result.clustering_skipped_reason = "Clustering timed out — genre breakdown unavailable."
            db.commit()
        except Exception as e:
            logger.exception("Clustering pipeline failed")
            wrapped_result.clustering_skipped_reason = "Clustering failed due to an internal error."
            db.commit()
            # partial results are still usefull, dont fail the whole thing

        upload_record.status = UploadStatus.COMPLETE
        db.commit()
    finally:
        db.close()


@router.post("/upload", response_model=UploadResponse)
async def upload_watch_history(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Form(...),
    timezone: str = Form("UTC"),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a .zip file. This should be the zip file "
                   "downloaded directly from Google Takeout."
        )

    zip_bytes = await file.read()
    if len(zip_bytes) > MAX_ZIP_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Your zip file is too large ({len(zip_bytes) // (1024*1024)} MB). "
                   f"Maximum allowed is {MAX_ZIP_SIZE_BYTES // (1024*1024)} MB. "
                   f"Try exporting only YouTube history (not all Google data)."
        )

    upload_id = str(uuid.uuid4())

    upload_record = UploadedHistory(
        id=upload_id,
        user_id=user_id,
        timezone=timezone,
        status=UploadStatus.PROCESSING,
    )
    db.add(upload_record)
    db.commit()

    try:
        entries = find_and_extract_watch_history(zip_bytes)
    except Exception as e:
        logger.warning(f"Zip extraction failed: {str(e)}")
        _mark_failed(db, upload_record, str(e))
        status_code = 400 if isinstance(e, (ZipValidationError, ZipBombError)) else 422
        # 400 for bad zip, 422 for other validation errors
        raise HTTPException(status_code=status_code, detail=str(e))

    background_tasks.add_task(process_upload_task, upload_id, entries, timezone)

    return UploadResponse(
        upload_id=upload_id,
        entry_count=len(entries),
        status=UploadStatus.PROCESSING,
        message="Upload received and is processing in the background.",
    )


def _mark_failed(db: Session, record: UploadedHistory, error_msg: str):
    record.status = UploadStatus.FAILED
    record.error_message = error_msg[:500]
    db.commit()
