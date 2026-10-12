
from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal
from app.models import Website
from app.monitor import check_website


scheduler = BackgroundScheduler(timezone="UTC")


def run_scheduled_check(website_id: int):
    db = SessionLocal()

    try:
        website = db.get(Website, website_id)

        if website is None or not website.is_active:
            return

        check_website(db, website)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def schedule_website(website: Website):
    if not scheduler.running or not website.is_active:
        return

    scheduler.add_job(
        run_scheduled_check,
        trigger="interval",
        seconds=website.check_interval_seconds,
        args=[website.id],
        id=f"website_{website.id}",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )


def start_scheduler():
    if not scheduler.running:
        scheduler.start()

    db = SessionLocal()

    try:
        websites = (
            db.query(Website)
            .filter(Website.is_active.is_(True))
            .all()
        )

        for website in websites:
            schedule_website(website)

    finally:
        db.close()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
