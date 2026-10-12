
from datetime import datetime, timezone
from time import perf_counter

import httpx
from sqlalchemy.orm import Session

from app.models import CheckResult, Incident, Website


FAILURE_THRESHOLD = 2


def check_website(
    db: Session,
    website: Website,
) -> CheckResult:
    start_time = perf_counter()
    is_up = False
    status_code = None
    error_message = None

    try:
        with httpx.Client(
            timeout=10.0,
            follow_redirects=True,
            headers={"User-Agent": "UpTrackMonitor/1.0"},
        ) as client:
            response = client.get(website.url)

        status_code = response.status_code
        is_up = 200 <= status_code < 400

        if not is_up:
            error_message = f"HTTP {status_code}"

    except httpx.RequestError as exc:
        error_message = f"{type(exc).__name__}: {exc}"

    response_time_ms = round(
        (perf_counter() - start_time) * 1000, 2
    )

    result = CheckResult(
        website_id=website.id,
        is_up=is_up,
        status_code=status_code,
        response_time_ms=response_time_ms,
        error_message=error_message,
        checked_at=datetime.now(timezone.utc),
    )

    db.add(result)
    db.commit()
    db.refresh(result)

    open_incident = (
        db.query(Incident)
        .filter(
            Incident.website_id == website.id,
            Incident.status == "open",
        )
        .first()
    )

    if is_up:
        if open_incident:
            open_incident.status = "resolved"
            open_incident.resolved_at = datetime.now(timezone.utc)
            db.commit()
        return result

    if open_incident:
        return result

    recent_checks = (
        db.query(CheckResult)
        .filter(CheckResult.website_id == website.id)
        .order_by(CheckResult.checked_at.desc(), CheckResult.id.desc())
        .limit(FAILURE_THRESHOLD)
        .all()
    )

    if (
        len(recent_checks) >= FAILURE_THRESHOLD
        and all(not check.is_up for check in recent_checks)
    ):
        incident = Incident(
            website_id=website.id,
            status="open",
            description=(
                f"Website is unavailable. Latest error: "
                f"{error_message or 'Unknown error'}"
            ),
        )
        db.add(incident)
        db.commit()

    return result
