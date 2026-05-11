from io import BytesIO
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, joinedload
from openpyxl import Workbook

from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api", tags=["games"])


@router.get("/platforms", response_model=list[schemas.PlatformOut])
def list_platforms(db: Session = Depends(get_db)):
    return db.query(models.Platform).order_by(models.Platform.name).all()


@router.get("/genres", response_model=list[schemas.GenreOut])
def list_genres(db: Session = Depends(get_db)):
    return db.query(models.Genre).order_by(models.Genre.name).all()


@router.get("/games", response_model=schemas.GameListOut)
def list_games(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    platform_id: Optional[int] = None,
    genre_id: Optional[int] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    min_rating: Optional[float] = None,
    sort_by: str = Query("sales_millions", pattern="^(title|sales_millions|rating|metacritic|release_year|online_players|price)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    skip: int = 0,
    limit: int = 50,
    _: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Game).options(
        joinedload(models.Game.platform), joinedload(models.Game.genre)
    )
    if search:
        s = f"%{search.lower()}%"
        q = q.filter(or_(
            func.lower(models.Game.title).like(s),
            func.lower(models.Game.developer).like(s),
            func.lower(models.Game.publisher).like(s),
        ))
    if platform_id:
        q = q.filter(models.Game.platform_id == platform_id)
    if genre_id:
        q = q.filter(models.Game.genre_id == genre_id)
    if year_from:
        q = q.filter(models.Game.release_year >= year_from)
    if year_to:
        q = q.filter(models.Game.release_year <= year_to)
    if min_rating is not None:
        q = q.filter(models.Game.rating >= min_rating)

    total = q.count()
    sort_col = getattr(models.Game, sort_by)
    q = q.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())
    items = q.offset(skip).limit(min(limit, 200)).all()
    return {"items": items, "total": total}


@router.get("/games/{game_id}", response_model=schemas.GameOut)
def get_game(game_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    g = db.query(models.Game).options(
        joinedload(models.Game.platform), joinedload(models.Game.genre)
    ).filter(models.Game.id == game_id).first()
    if not g:
        raise HTTPException(404, "Игра не найдена")
    return g


@router.get("/games/{game_id}/reviews", response_model=list[schemas.ReviewOut])
def list_reviews(game_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    return db.query(models.Review).filter(models.Review.game_id == game_id).order_by(models.Review.created_at.desc()).all()


@router.post("/reviews", response_model=schemas.ReviewOut)
def create_review(payload: schemas.ReviewCreate, db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    game = db.query(models.Game).filter(models.Game.id == payload.game_id).first()
    if not game:
        raise HTTPException(404, "Игра не найдена")

    sentiment = "positive" if payload.score >= 7 else ("neutral" if payload.score >= 4 else "negative")
    rev = models.Review(
        game_id=payload.game_id,
        author=payload.author or user.username,
        score=payload.score,
        text=payload.text,
        sentiment=sentiment,
    )
    db.add(rev)

    db.flush()
    avg = db.query(func.avg(models.Review.score)).filter(models.Review.game_id == payload.game_id).scalar() or 0
    cnt = db.query(func.count(models.Review.id)).filter(models.Review.game_id == payload.game_id).scalar() or 0
    game.rating = round(float(avg), 2)
    game.reviews_count = cnt
    db.commit()
    db.refresh(rev)
    return rev


@router.post("/games", response_model=schemas.GameOut)
def create_game(payload: schemas.GameCreate, db: Session = Depends(get_db),
                user: models.User = Depends(auth.require_role("admin", "analyst"))):
    g = models.Game(**payload.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    db.add(models.AuditLog(user_id=user.id, action="create_game", detail=f"id={g.id} title={g.title}"))
    db.commit()
    return g


@router.put("/games/{game_id}", response_model=schemas.GameOut)
def update_game(game_id: int, payload: schemas.GameUpdate, db: Session = Depends(get_db),
                user: models.User = Depends(auth.require_role("admin", "analyst"))):
    g = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not g:
        raise HTTPException(404, "Игра не найдена")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(g, k, v)
    db.commit()
    db.refresh(g)
    db.add(models.AuditLog(user_id=user.id, action="update_game", detail=f"id={g.id}"))
    db.commit()
    return g


@router.delete("/games/{game_id}")
def delete_game(game_id: int, db: Session = Depends(get_db),
                user: models.User = Depends(auth.require_role("admin"))):
    g = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not g:
        raise HTTPException(404, "Игра не найдена")
    db.delete(g)
    db.add(models.AuditLog(user_id=user.id, action="delete_game", detail=f"id={game_id}"))
    db.commit()
    return {"ok": True}


@router.get("/games/export/csv")
def export_games_csv(db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    games = db.query(models.Game).options(
        joinedload(models.Game.platform), joinedload(models.Game.genre)
    ).all()
    lines = ["id;title;developer;publisher;year;platform;genre;price;rating;metacritic;sales_mln;online;reviews"]
    for g in games:
        platform = g.platform.name if g.platform else ""
        genre = g.genre.name if g.genre else ""
        lines.append(
            f"{g.id};{g.title};{g.developer};{g.publisher};{g.release_year};{platform};{genre};"
            f"{g.price};{g.rating};{g.metacritic};{g.sales_millions};{g.online_players};{g.reviews_count}"
        )
    data = "\ufeff" + "\n".join(lines)
    return StreamingResponse(
        iter([data.encode("utf-8")]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=games.csv"},
    )


@router.get("/games/export/xlsx")
def export_games_xlsx(db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    games = db.query(models.Game).options(
        joinedload(models.Game.platform), joinedload(models.Game.genre)
    ).all()
    wb = Workbook()
    ws = wb.active
    ws.title = "Игры"
    ws.append([
        "ID", "Название", "Разработчик", "Издатель", "Год", "Платформа", "Жанр",
        "Цена", "Рейтинг", "Metacritic", "Продажи (млн)", "Онлайн", "Отзывов",
    ])
    for g in games:
        ws.append([
            g.id, g.title, g.developer, g.publisher, g.release_year,
            g.platform.name if g.platform else "", g.genre.name if g.genre else "",
            g.price, g.rating, g.metacritic, g.sales_millions, g.online_players, g.reviews_count,
        ])
    for col in ws.columns:
        max_len = max(len(str(c.value or "")) for c in col)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 2, 40)

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=games.xlsx"},
    )