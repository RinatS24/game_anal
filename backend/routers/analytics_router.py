from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=schemas.DashboardSummary)
def dashboard(db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    total_games = db.query(func.count(models.Game.id)).scalar() or 0
    total_sales = float(db.query(func.coalesce(func.sum(models.Game.sales_millions), 0)).scalar() or 0)
    avg_rating = float(db.query(func.coalesce(func.avg(models.Game.rating), 0)).scalar() or 0)
    total_online = int(db.query(func.coalesce(func.sum(models.Game.online_players), 0)).scalar() or 0)
    total_reviews = int(db.query(func.coalesce(func.sum(models.Game.reviews_count), 0)).scalar() or 0)

    genre_rows = (
        db.query(
            models.Genre.name,
            func.count(models.Game.id),
            func.coalesce(func.sum(models.Game.sales_millions), 0),
            func.coalesce(func.avg(models.Game.rating), 0),
        )
        .join(models.Game, models.Game.genre_id == models.Genre.id)
        .group_by(models.Genre.name)
        .all()
    )
    genres = [
        schemas.GenreStat(genre=r[0], count=r[1], total_sales=round(float(r[2]), 2), avg_rating=round(float(r[3]), 2))
        for r in genre_rows
    ]

    plat_rows = (
        db.query(
            models.Platform.name,
            func.count(models.Game.id),
            func.coalesce(func.sum(models.Game.sales_millions), 0),
            func.coalesce(func.avg(models.Game.rating), 0),
        )
        .join(models.Game, models.Game.platform_id == models.Platform.id)
        .group_by(models.Platform.name)
        .all()
    )
    platforms = [
        schemas.PlatformStat(platform=r[0], count=r[1], total_sales=round(float(r[2]), 2), avg_rating=round(float(r[3]), 2))
        for r in plat_rows
    ]

    year_rows = (
        db.query(
            models.Game.release_year,
            func.count(models.Game.id),
            func.coalesce(func.sum(models.Game.sales_millions), 0),
        )
        .group_by(models.Game.release_year)
        .order_by(models.Game.release_year)
        .all()
    )
    years = [schemas.YearStat(year=r[0], count=r[1], total_sales=round(float(r[2]), 2)) for r in year_rows if r[0]]

    def top(field, limit=10):
        rows = db.query(models.Game).order_by(field.desc()).limit(limit).all()
        return [
            schemas.TopGame(
                id=g.id, title=g.title, sales_millions=g.sales_millions,
                rating=g.rating, metacritic=g.metacritic, online_players=g.online_players,
            )
            for g in rows
        ]

    top_sales = top(models.Game.sales_millions)
    top_rating = top(models.Game.rating)
    top_online = top(models.Game.online_players)

    sentiment_rows = db.query(models.Review.sentiment, func.count(models.Review.id)).group_by(models.Review.sentiment).all()
    sentiment = {r[0]: r[1] for r in sentiment_rows}
    for key in ("positive", "neutral", "negative"):
        sentiment.setdefault(key, 0)

    return schemas.DashboardSummary(
        total_games=total_games,
        total_sales=round(total_sales, 2),
        avg_rating=round(avg_rating, 2),
        total_online=total_online,
        total_reviews=total_reviews,
        genres=sorted(genres, key=lambda x: x.total_sales, reverse=True),
        platforms=sorted(platforms, key=lambda x: x.total_sales, reverse=True),
        years=years,
        top_by_sales=top_sales,
        top_by_rating=top_rating,
        top_by_online=top_online,
        sentiment=sentiment,
    )


@router.get("/games/{game_id}/trend", response_model=schemas.GameTrend)
def game_trend(game_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game:
        raise HTTPException(404, "Игра не найдена")
    snaps = (
        db.query(models.MarketSnapshot)
        .filter(models.MarketSnapshot.game_id == game_id)
        .order_by(models.MarketSnapshot.date.asc())
        .all()
    )
    points = [
        schemas.TrendPoint(
            date=s.date.strftime("%Y-%m-%d"),
            online_players=s.online_players,
            sales_millions=round(s.sales_millions, 2),
            rating=round(s.rating, 2),
        )
        for s in snaps
    ]
    return schemas.GameTrend(game_id=game.id, title=game.title, points=points)


@router.get("/compare")
def compare_games(
    ids: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    try:
        ids_list = [int(x) for x in ids.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(400, "Некорректный список идентификаторов")
    games = db.query(models.Game).options(
        joinedload(models.Game.platform), joinedload(models.Game.genre)
    ).filter(models.Game.id.in_(ids_list)).all()
    result = []
    for g in games:
        result.append({
            "id": g.id, "title": g.title, "rating": g.rating, "metacritic": g.metacritic,
            "sales_millions": g.sales_millions, "online_players": g.online_players,
            "price": g.price, "reviews_count": g.reviews_count,
            "platform": g.platform.name if g.platform else "",
            "genre": g.genre.name if g.genre else "",
        })
    return result