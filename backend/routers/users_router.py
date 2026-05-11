from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db), _: models.User = Depends(auth.require_role("admin"))):
    return db.query(models.User).order_by(models.User.id).all()


@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_role("admin")),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Пользователь не найден")
    if payload.role is not None:
        if payload.role not in ("user", "analyst", "admin"):
            raise HTTPException(400, "Неизвестная роль")
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    db.add(models.AuditLog(user_id=admin.id, action="update_user", detail=f"user_id={user_id} role={user.role} active={user.is_active}"))
    db.commit()
    return user


@router.get("/audit/logs")
def audit_logs(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_role("admin")),
    limit: int = 100,
):
    rows = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id, "user_id": r.user_id, "action": r.action,
            "detail": r.detail, "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]