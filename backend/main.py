
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app import models
from app.database import Base, engine
from app.routers import websites,stats
from app.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    start_scheduler()

    try:
        yield
    finally:
        stop_scheduler()


app = FastAPI(
    title="UpTrack API",
    description="Website uptime monitoring and incident management.",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(websites.router)
app.include_router(stats.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to UpTrack API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected",
    }
