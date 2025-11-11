"""
Games Service Router
FastAPI router for games management endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict, Any
from datetime import datetime

from ...core.database import get_db
from . import models, schemas

router = APIRouter()

class GamesService:
    def __init__(self, db: Session):
        self.db = db

    def get_games(self, category: Optional[str] = None, skip: int = 0, limit: int = 10):
        """Get games with filtering"""
        query = self.db.query(models.Game)
        if category:
            query = query.filter(models.Game.category == category)
        games = query.offset(skip).limit(limit).all()
        return games

    def get_game(self, game_id: int):
        """Get a single game"""
        game = self.db.query(models.Game).filter(
            models.Game.id == game_id
        ).first()
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")
        return game

    def create_game_score(self, score_data: Dict[str, Any], user_id: str):
        """Create a new game score"""
        score = models.GameScore(
            game_id=score_data["game_id"],
            user_id=int(user_id),
            score=score_data["score"],
            time_taken=score_data.get("time_taken"),
            moves_count=score_data.get("moves_count"),
            level_reached=score_data.get("level_reached"),
            metadata=score_data.get("metadata")
        )
        self.db.add(score)
        self.db.commit()
        self.db.refresh(score)
        return score

    def get_leaderboard(self, game_id: int, limit: int = 10):
        """Get leaderboard for a game"""
        scores = self.db.query(models.GameScore).filter(
            models.GameScore.game_id == game_id
        ).order_by(
            models.GameScore.score.desc()
        ).limit(limit).all()

        return scores

@router.get("/games", response_model=List[schemas.GameSummary])
async def get_games(
    category: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get games with filtering and pagination"""
    service = GamesService(db)
    games = service.get_games(category=category, skip=skip, limit=limit)
    return games

@router.get("/games/{game_id}", response_model=schemas.Game)
async def get_game(
    game_id: int,
    db: Session = Depends(get_db)
):
    """Get a single game by ID"""
    service = GamesService(db)
    return service.get_game(game_id)

@router.post("/scores", response_model=schemas.GameScore)
async def create_game_score(
    score: schemas.GameScoreCreate,
    user_id: str,  # This would come from auth middleware
    db: Session = Depends(get_db)
):
    """Create a new game score"""
    service = GamesService(db)
    return service.create_game_score(score.dict(), user_id)

@router.get("/games/{game_id}/leaderboard")
async def get_leaderboard(
    game_id: int,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get leaderboard for a game"""
    service = GamesService(db)
    leaderboard = service.get_leaderboard(game_id, limit)
    return {"leaderboard": leaderboard}

@router.get("/leaderboard/{game_id}", response_model=List[schemas.GameScore])
async def get_game_leaderboard(
    game_id: int,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get leaderboard for a specific game"""
    scores = db.query(models.GameScore).filter(
        models.GameScore.game_id == game_id
    ).order_by(desc(models.GameScore.score)).limit(limit).all()
    return [schemas.GameScore.from_orm(score) for score in scores]

@router.get("/scores/user", response_model=List[schemas.GameScore])
async def get_user_scores(
    user_id: str,  # This would come from auth middleware
    game_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get scores for a specific user"""
    query = db.query(models.GameScore).filter(models.GameScore.user_id == int(user_id))

    if game_id:
        query = query.filter(models.GameScore.game_id == game_id)

    scores = query.order_by(desc(models.GameScore.created_at)).offset(skip).limit(limit).all()
    return [schemas.GameScore.from_orm(score) for score in scores]

@router.get("/stats", response_model=Dict[str, int])
async def get_game_stats(db: Session = Depends(get_db)):
    """Get overall game statistics"""
    total_games = db.query(models.Game).count()
    total_scores = db.query(models.GameScore).count()
    
    return {
        "total_games": total_games,
        "total_scores": total_scores
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "zenith-games",
        "version": "1.0.0"
    }