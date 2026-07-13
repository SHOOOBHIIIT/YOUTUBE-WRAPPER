from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api_deps import get_upload_owned_by_user, get_upload_owned_by_user_optional
from app.models.upload import UploadedHistory, UploadStatus
from app.models.result import WrappedResult

router = APIRouter()

@router.get("/user/{user_id}")
async def get_user_wrapped_results(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns all successful Wrapped results for a given user, ordered by generation date.
    """
    results = db.query(WrappedResult).filter_by(user_id=user_id).order_by(WrappedResult.generated_at.desc()).all()
    
    return [
        {
            "upload_id": r.upload_id,
            "generated_at": r.generated_at.isoformat(),
            "top_channel": r.top_channels[0]["channel_name"] if r.top_channels else "Unknown",
            "video_count": sum(h["count"] for h in r.temporal_heatmap) if r.temporal_heatmap else 0
        }
        for r in results
    ]

@router.get("/{upload_id}")
async def get_wrapped_result(
    upload_id: str,
    db: Session = Depends(get_db),
    # Optional dependency since demo doesn't need auth
    upload_record = Depends(get_upload_owned_by_user_optional)
):
    """
    Returns the computed Wrapped analysis results for a given upload.
    Only accessible by the owner of the upload.
    """
    if upload_id == "demo":
        from datetime import datetime, timezone
        return {
            "upload_id": "demo",
            "top_channels": [
                {"channel_name": "Kurzgesagt – In a Nutshell", "watch_time_minutes": 1420, "video_count": 115},
                {"channel_name": "Marques Brownlee", "watch_time_minutes": 980, "video_count": 85},
                {"channel_name": "Veritasium", "watch_time_minutes": 860, "video_count": 64},
                {"channel_name": "MrBeast", "watch_time_minutes": 540, "video_count": 32},
                {"channel_name": "Fireship", "watch_time_minutes": 420, "video_count": 89}
            ],
            "binge_sessions": {
                "top_by_count": [],
                "top_by_duration": [
                    {
                        "start_time": "2023-11-15T23:00:00Z",
                        "end_time": "2023-11-16T03:30:00Z",
                        "total_duration_seconds": 16200,
                        "video_count": 18,
                        "top_channel": "Kurzgesagt – In a Nutshell"
                    }
                ]
            },
            "temporal_heatmap": [
                {"hour": 23, "day_of_week": 5, "count": 156},
                {"hour": 0, "day_of_week": 6, "count": 189},
                {"hour": 1, "day_of_week": 6, "count": 120},
                {"hour": 22, "day_of_week": 4, "count": 95},
                {"hour": 20, "day_of_week": 0, "count": 88}
            ],
            "genre_breakdown": [
                {"label": "Science & Education", "video_count": 340, "pct": 45.0, "representative_titles": []},
                {"label": "Tech & Gadgets", "video_count": 280, "pct": 30.0, "representative_titles": []},
                {"label": "Software Development", "video_count": 150, "pct": 15.0, "representative_titles": []},
                {"label": "Entertainment", "video_count": 90, "pct": 10.0, "representative_titles": []}
            ],
            "taste_drift": [
                {
                    "month": "2023-01",
                    "video_count": 120,
                    "clusters": {"Science & Education": 50.0, "Tech & Gadgets": 30.0, "Software Development": 20.0}
                },
                {
                    "month": "2023-02",
                    "video_count": 150,
                    "clusters": {"Science & Education": 40.0, "Tech & Gadgets": 40.0, "Software Development": 20.0}
                },
                {
                    "month": "2023-03",
                    "video_count": 200,
                    "clusters": {"Science & Education": 30.0, "Tech & Gadgets": 20.0, "Software Development": 30.0, "Entertainment": 20.0}
                }
            ],
            "clustering_skipped_reason": None,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

    # For non-demo, upload_record is required
    upload = upload_record
    if not upload:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    if upload.status != "complete":
        raise HTTPException(
            status_code=400, 
            detail=f"Upload is not complete. Current status: {upload.status}"
        )
        
    result = db.query(WrappedResult).filter_by(upload_id=upload_id).first()
    
    if not result:
        # It's complete but no result exists? Might be an M1 or M2 legacy upload.
        raise HTTPException(status_code=404, detail="Analysis results not found for this upload.")
        
    return {
        "upload_id": result.upload_id,
        "top_channels": result.top_channels,
        "binge_sessions": result.binge_sessions,
        "temporal_heatmap": result.temporal_heatmap,
        "genre_breakdown": result.genre_breakdown,
        "taste_drift": result.taste_drift,
        "clustering_skipped_reason": result.clustering_skipped_reason if hasattr(result, "clustering_skipped_reason") else None,
        "generated_at": result.generated_at.isoformat()
    }

@router.delete("/{upload_id}")
async def delete_wrapped_result(
    upload_id: str,
    upload: UploadedHistory = Depends(get_upload_owned_by_user),
    db: Session = Depends(get_db)
):
    """
    Deletes the Wrapped result and its associated uploaded history record.
    Only accessible by the owner of the upload.
    """
    # Delete the result (if exists)
    result = db.query(WrappedResult).filter_by(upload_id=upload_id).first()
    if result:
        db.delete(result)
        
    # Delete the uploaded history
    db.delete(upload)
    db.commit()
    
    return {"message": "Wrapped result deleted successfully."}
