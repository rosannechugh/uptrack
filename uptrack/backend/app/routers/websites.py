from app.scheduler import schedule_website, scheduler
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CheckResult, Incident,Website
from app.monitor import check_website
from app.schemas import (
    CheckResultResponse,
    IncidentResponse,
    WebsiteCreate,
    WebsiteResponse,
)

router = APIRouter(
    prefix="/websites",
    tags=["Websites"],
)


@router.post(
    "/",
    response_model=WebsiteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_website(
    website_data: WebsiteCreate,
    db: Session = Depends(get_db),
):
    website = Website(
        name=website_data.name,
        url=str(website_data.url),
        check_interval_seconds=website_data.check_interval_seconds,
    )

    db.add(website)
    db.commit()
    db.refresh(website)

    schedule_website(website)

    return website


@router.get("/", response_model=list[WebsiteResponse])
def get_websites(db: Session = Depends(get_db)):
    return (
        db.query(Website)
        .order_by(Website.id.desc())
        .all()
    )


@router.get("/{website_id}", response_model=WebsiteResponse)
def get_website(
    website_id: int,
    db: Session = Depends(get_db),
):
    website = db.get(Website, website_id)

    if website is None:
        raise HTTPException(
            status_code=404,
            detail="Website not found",
        )

    return website


@router.post(
    "/{website_id}/check",
    response_model=CheckResultResponse,
)
def run_website_check(
    website_id: int,
    db: Session = Depends(get_db),
):
    website = db.get(Website, website_id)

    if website is None:
        raise HTTPException(
            status_code=404,
            detail="Website not found",
        )

    return check_website(db, website)


@router.get(
    "/{website_id}/checks",
    response_model=list[CheckResultResponse],
)
def get_check_history(
    website_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    website = db.get(Website, website_id)

    if website is None:
        raise HTTPException(
            status_code=404,
            detail="Website not found",
        )

    return (
        db.query(CheckResult)
        .filter(CheckResult.website_id == website_id)
        .order_by(CheckResult.checked_at.desc())
        .limit(limit)
        .all()
    )


@router.delete("/{website_id}")
def delete_website(
    website_id: int,
    db: Session = Depends(get_db),
):
    website = db.get(Website, website_id)

    if website is None:
        raise HTTPException(
            status_code=404,
            detail="Website not found",
        )
    if scheduler.running:
        scheduler.remove_job(f"website_{website.id}")
    db.delete(website)
    db.commit()

    return {"message": "Website deleted successfully"}

@router.get(
    "/{website_id}/incidents",
    response_model=list[IncidentResponse],
)
def get_website_incidents(
    website_id: int,
    db: Session = Depends(get_db),
):
    website = db.get(Website, website_id)

    if website is None:
        raise HTTPException(
            status_code=404,
            detail="Website not found",
        )

    return (
        db.query(Incident)
        .filter(Incident.website_id == website_id)
        .order_by(Incident.started_at.desc())
        .all()
    )
