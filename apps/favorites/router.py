from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from typing import List
import models, schemas

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.FavoriteOut)
def create_favorite(favorite: schemas.FavoriteCreate, db: Session = Depends(get_db)):
    # Check if favorite already exists
    existing = db.query(models.Favorite).filter(
        models.Favorite.user_id == favorite.user_id,
        models.Favorite.provider_id == favorite.provider_id,
        models.Favorite.is_active == True
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Favorite already exists")

    db_favorite = models.Favorite(**favorite.dict())
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite

@router.get("/user/{user_id}", response_model=List[schemas.FavoriteOut])
def get_user_favorites(user_id: str, db: Session = Depends(get_db)):
    favorites = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.is_active == True
    ).all()
    return favorites

@router.delete("/{favorite_id}")
def remove_favorite(favorite_id: int, db: Session = Depends(get_db)):
    favorite = db.query(models.Favorite).filter(models.Favorite.id == favorite_id).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    favorite.is_active = False
    db.commit()
    return {"message": "Favorite removed"}

@router.put("/{favorite_id}", response_model=schemas.FavoriteOut)
def update_favorite(favorite_id: int, favorite_update: schemas.FavoriteUpdate, db: Session = Depends(get_db)):
    favorite = db.query(models.Favorite).filter(models.Favorite.id == favorite_id).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    for field, value in favorite_update.dict(exclude_unset=True).items():
        setattr(favorite, field, value)

    db.commit()
    db.refresh(favorite)
    return favorite
