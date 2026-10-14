
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CheckResult, Incident, Website

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])


@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    websites = (
        db.query(Website)
        .filter(Website.is_active.is_(True))
        .all()
    )

    up_count = 0
    down_count = 0
    unknown_count = 0

    for website in websites:
        latest = (
            db.query(CheckResult)
            .filter(CheckResult.website_id == website.id)
            .order_by(
                CheckResult.checked_at.desc(),
                CheckResult.id.desc(),
            )
            .first()
        )

        if latest is None:
            unknown_count += 1
        elif latest.is_up:
            up_count += 1
        else:
            down_count += 1

    open_incidents = (
        db.query(Incident)
        .filter(Incident.status == "open")
        .count()
    )

    since = datetime.now(timezone.utc) - timedelta(hours=24)

    average_response_time = (
        db.query(CheckResult.response_time_ms)
        .filter(
            CheckResult.checked_at >= since,
            CheckResult.response_time_ms.isnot(None),
        )
        .all()
    )

    times = [row[0] for row in average_response_time]

    return {
        "total_websites": len(websites),
        "websites_up": up_count,
        "websites_down": down_count,
        "websites_unknown": unknown_count,
        "open_incidents": open_incidents,
        "average_response_time_ms": (
            round(sum(times) / len(times), 2) if times else None
        ),
    }


@router.get("/uptime")
def get_uptime(
    hours: int = Query(default=24, ge=1, le=720),
    db: Session = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    results = (
        db.query(CheckResult)
        .filter(CheckResult.checked_at >= since)
        .all()
    )

    total_checks = len(results)
    successful_checks = sum(1 for result in results if result.is_up)

    uptime_percentage = (
        round(successful_checks / total_checks * 100, 2)
        if total_checks
        else None
    )

    return {
        "period_hours": hours,
        "total_checks": total_checks,
        "successful_checks": successful_checks,
        "failed_checks": total_checks - successful_checks,
        "uptime_percentage": uptime_percentage,
    }


@router.get("/response-times")
def get_response_times(
    hours: int = Query(default=24, ge=1, le=720),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    results = (
        db.query(CheckResult, Website.name)
        .join(Website, Website.id == CheckResult.website_id)
        .filter(CheckResult.checked_at >= since)
        .order_by(CheckResult.checked_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "period_hours": hours,
        "results": [
            {
                "website_id": result.website_id,
                "website_name": website_name,
                "checked_at": result.checked_at,
                "response_time_ms": result.response_time_ms,
                "is_up": result.is_up,
                "status_code": result.status_code,
            }
            for result, website_name in results
        ],
    }
