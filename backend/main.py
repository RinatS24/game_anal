from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, SessionLocal
import models
from routers import auth_router, games_router, analytics_router, users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.Game).count() == 0:
            db.close()
            import seed
            seed.seed()
    finally:
        try:
            db.close()
        except Exception:
            pass
    yield


app = FastAPI(
    title="ИС анализа рынка компьютерных игр",
    description="GameAnalysis — REST API сервера",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(games_router.router)
app.include_router(analytics_router.router)
app.include_router(users_router.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}