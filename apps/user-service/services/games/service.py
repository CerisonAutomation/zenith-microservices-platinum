"""
Games Service - Business logic for gaming features
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from fastapi import HTTPException
from typing import List, Optional, Dict, Any
from . import models, schemas


class GamesService:
    def __init__(self, db: Session):
        self.db = db

    def get_games(self, category: Optional[str] = None, skip: int = 0, limit: int = 10) -> List[schemas.GameSummary]:
        """Get games with optional category filtering"""
        query = self.db.query(models.Game)

        if category:
            query = query.filter(models.Game.category == category)

        games = query.offset(skip).limit(limit).all()
        return [schemas.GameSummary.from_orm(game) for game in games]

    def get_game(self, game_id: int) -> schemas.Game:
        """Get a single game by ID"""
        game = self.db.query(models.Game).filter(models.Game.id == game_id).first()
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")
        return schemas.Game.from_orm(game)

    def create_game_score(self, score_data: Dict[str, Any], user_id: str) -> schemas.GameScore:
        """Create a new game score"""
        score = models.GameScore(**score_data, user_id=int(user_id))
        self.db.add(score)
        self.db.commit()
        self.db.refresh(score)
        return schemas.GameScore.from_orm(score)

    def get_game_leaderboard(self, game_id: int, limit: int = 10) -> List[schemas.GameScore]:
        """Get leaderboard for a specific game"""
        scores = self.db.query(models.GameScore).filter(
            models.GameScore.game_id == game_id
        ).order_by(desc(models.GameScore.score)).limit(limit).all()
        return [schemas.GameScore.from_orm(score) for score in scores]

    def get_user_scores(self, user_id: str, game_id: Optional[int] = None, skip: int = 0, limit: int = 10) -> List[schemas.GameScore]:
        """Get scores for a specific user"""
        query = self.db.query(models.GameScore).filter(models.GameScore.user_id == int(user_id))

        if game_id:
            query = query.filter(models.GameScore.game_id == game_id)

        scores = query.order_by(desc(models.GameScore.created_at)).offset(skip).limit(limit).all()
        return [schemas.GameScore.from_orm(score) for score in scores]