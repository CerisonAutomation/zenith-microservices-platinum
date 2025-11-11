"""
Games Service - FastAPI microservice for gaming features
Senior-level implementation with comprehensive gaming API
"""

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, and_, or_, text, update
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import json
import logging
from contextlib import asynccontextmanager
from collections import defaultdict

# Import our models and schemas
from models import (
    Base, GameCategory, Game, GameScore, Leaderboard, LeaderboardEntry,
    Tournament, TournamentParticipant, TournamentMatch, Achievement,
    UserAchievement, UserGameStats
)
from schemas import (
    GameCategoryCreate, GameCategoryUpdate, GameCategory as GameCategorySchema,
    GameCreate, GameUpdate, Game as GameSchema, GameSummary, GameWithDetails,
    GameScoreCreate, GameScore as GameScoreSchema, GameScoreWithGame,
    LeaderboardCreate, LeaderboardUpdate, Leaderboard as LeaderboardSchema,
    LeaderboardWithEntries, LeaderboardEntry as LeaderboardEntrySchema,
    TournamentCreate, TournamentUpdate, Tournament as TournamentSchema,
    TournamentWithDetails, TournamentParticipant as TournamentParticipantSchema,
    TournamentMatch as TournamentMatchSchema, TournamentRegistration, MatchResult,
    AchievementCreate, AchievementUpdate, Achievement as AchievementSchema,
    UserAchievement as UserAchievementSchema, UserAchievementWithAchievement,
    UserGameStats as UserGameStatsSchema, GameStats, UserStats,
    GameSearchFilters, LeaderboardSearchFilters, TournamentSearchFilters,
    BulkGameUpdate, BulkAchievementUpdate, BulkDeleteRequest,
    PaginationParams, PaginatedResponse,
    APIResponse, ErrorResponse, SuccessResponse,
    GameType, Difficulty, LeaderboardType, TournamentType, TournamentStatus,
    ParticipantStatus, MatchStatus, AchievementType, Rarity
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup (placeholder - will be configured with actual database)
DATABASE_URL = "postgresql://user:password@localhost/games_db"

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = defaultdict(list)
        self.game_sessions: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_text(message)

    async def broadcast_to_game(self, game_id: int, message: str):
        for connections in self.active_connections.values():
            for connection in connections:
                # Check if user is in this game session
                await connection.send_text(message)

manager = ConnectionManager()

# Create FastAPI app
app = FastAPI(
    title="Games Service API",
    description="Enterprise gaming service with tournaments, leaderboards, and achievements",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency (placeholder)
def get_db():
    # This will be replaced with actual database session management
    return None

# Authentication dependency (placeholder)
def get_current_user():
    # This will be replaced with actual authentication
    return {"id": 1, "email": "user@example.com"}

# Admin authorization dependency (placeholder)
def require_admin(current_user: dict = Depends(get_current_user)):
    # This will be replaced with actual admin check
    return current_user

# Background task for updating statistics
async def update_game_stats(game_id: int, db: Session):
    """Update game statistics in background"""
    try:
        # Update play count and unique players
        play_stats = db.query(
            func.count(GameScore.id).label('total_scores'),
            func.count(func.distinct(GameScore.user_id)).label('unique_players')
        ).filter(GameScore.game_id == game_id).first()

        # Update average score
        avg_score = db.query(func.avg(GameScore.score)).filter(GameScore.game_id == game_id).scalar()

        db.query(Game).filter(Game.id == game_id).update({
            "play_count": play_stats.total_scores,
            "unique_players": play_stats.unique_players or 0,
            "average_score": avg_score or 0,
            "total_scores": play_stats.total_scores
        })

        db.commit()
        logger.info(f"Updated stats for game {game_id}")

    except Exception as e:
        logger.error(f"Error updating game stats for {game_id}: {e}")
        db.rollback()

async def update_leaderboards(game_id: int, db: Session):
    """Update leaderboards for a game"""
    try:
        # Get all active leaderboards for this game
        leaderboards = db.query(Leaderboard).filter(
            Leaderboard.game_id == game_id,
            Leaderboard.is_active == True
        ).all()

        for leaderboard in leaderboards:
            # Clear existing entries
            db.query(LeaderboardEntry).filter(LeaderboardEntry.leaderboard_id == leaderboard.id).delete()

            # Get top scores based on leaderboard type
            query = db.query(GameScore).filter(GameScore.game_id == game_id)

            # Apply time filters for periodic leaderboards
            if leaderboard.leaderboard_type == LeaderboardType.WEEKLY:
                week_ago = datetime.utcnow() - timedelta(days=7)
                query = query.filter(GameScore.created_at >= week_ago)
            elif leaderboard.leaderboard_type == LeaderboardType.MONTHLY:
                month_ago = datetime.utcnow() - timedelta(days=30)
                query = query.filter(GameScore.created_at >= month_ago)

            # Get top scores
            top_scores = query.order_by(desc(GameScore.score))\
                             .limit(leaderboard.max_entries)\
                             .all()

            # Create leaderboard entries
            for rank, score in enumerate(top_scores, 1):
                entry = LeaderboardEntry(
                    leaderboard_id=leaderboard.id,
                    user_id=score.user_id,
                    score_id=score.id,
                    rank=rank,
                    score_value=score.score
                )
                db.add(entry)

                # Update score rank
                score.rank = rank
                score.is_high_score = rank <= 10  # Top 10 are high scores

            # Check for ties
            scores_by_value = {}
            for entry in db.query(LeaderboardEntry)\
                          .filter(LeaderboardEntry.leaderboard_id == leaderboard.id)\
                          .order_by(desc(LeaderboardEntry.score_value)):
                if entry.score_value in scores_by_value:
                    entry.is_tied = True
                    scores_by_value[entry.score_value].is_tied = True
                else:
                    scores_by_value[entry.score_value] = entry

        db.commit()
        logger.info(f"Updated leaderboards for game {game_id}")

    except Exception as e:
        logger.error(f"Error updating leaderboards for game {game_id}: {e}")
        db.rollback()

async def check_achievements(user_id: int, game_id: int, score_data: Dict[str, Any], db: Session):
    """Check and unlock achievements for user"""
    try:
        # Get user's game stats
        user_stats = db.query(UserGameStats).filter(
            UserGameStats.user_id == user_id,
            UserGameStats.game_id == game_id
        ).first()

        if not user_stats:
            user_stats = UserGameStats(user_id=user_id, game_id=game_id)
            db.add(user_stats)
            db.commit()

        # Update user stats
        user_stats.games_played += 1
        user_stats.total_score += score_data.get('score', 0)
        user_stats.average_score = user_stats.total_score / user_stats.games_played

        if score_data.get('score', 0) > user_stats.high_score:
            user_stats.high_score = score_data['score']

        if score_data.get('time_taken') and (not user_stats.best_time or score_data['time_taken'] < user_stats.best_time):
            user_stats.best_time = score_data['time_taken']

        user_stats.total_time_played += score_data.get('time_taken', 0)
        user_stats.last_played_at = datetime.utcnow()

        # Check for achievements
        achievements = db.query(Achievement).filter(
            or_(
                Achievement.game_id == game_id,
                Achievement.game_id.is_(None)  # Global achievements
            ),
            Achievement.is_active == True
        ).all()

        for achievement in achievements:
            # Check if user already has this achievement
            user_achievement = db.query(UserAchievement).filter(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement.id
            ).first()

            if not user_achievement:
                user_achievement = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement.id
                )
                db.add(user_achievement)

            if user_achievement.is_completed:
                continue

            # Check achievement conditions
            completed = False

            if achievement.achievement_type == AchievementType.SCORE_BASED:
                if achievement.condition_type == 'score_threshold':
                    completed = score_data.get('score', 0) >= achievement.condition_value
                elif achievement.condition_type == 'high_score':
                    completed = score_data.get('score', 0) == user_stats.high_score and score_data['score'] >= achievement.condition_value

            elif achievement.achievement_type == AchievementType.PLAY_COUNT:
                completed = user_stats.games_played >= achievement.condition_value

            elif achievement.achievement_type == AchievementType.STREAK:
                # This would need more complex logic for streak tracking
                pass

            if completed:
                user_achievement.is_completed = True
                user_achievement.completed_at = datetime.utcnow()
                user_achievement.progress = achievement.condition_value

                # Award points (could integrate with user points system)
                logger.info(f"User {user_id} unlocked achievement {achievement.name}")

        db.commit()

    except Exception as e:
        logger.error(f"Error checking achievements for user {user_id}: {e}")
        db.rollback()

async def update_category_stats(category_id: int, db: Session):
    """Update category statistics in background"""
    try:
        # Update game count and total plays
        category_stats = db.query(
            func.count(Game.id).label('total_games'),
            func.sum(Game.play_count).label('total_plays'),
            func.sum(Game.unique_players).label('total_unique_players')
        ).filter(Game.category_id == category_id, Game.is_active == True).first()

        db.query(GameCategory).filter(GameCategory.id == category_id).update({
            "total_games": category_stats.total_games or 0,
            "total_plays": category_stats.total_plays or 0,
            "total_unique_players": category_stats.total_unique_players or 0
        })

        db.commit()
        logger.info(f"Updated stats for category {category_id}")

    except Exception as e:
        logger.error(f"Error updating category stats for {category_id}: {e}")
        db.rollback()

# API Routes

# Health check
@app.get("/health", response_model=SuccessResponse)
async def health_check():
    """Health check endpoint"""
    return SuccessResponse(message="Games service is healthy")

# WebSocket endpoint for real-time gaming
@app.websocket("/ws/game/{game_id}/{user_id}")
async def game_websocket(websocket: WebSocket, game_id: int, user_id: int):
    """WebSocket endpoint for real-time game interactions"""
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Process game messages
            message_data = json.loads(data)

            # Broadcast to other players in the same game
            await manager.broadcast_to_game(game_id, json.dumps({
                "type": "game_update",
                "user_id": user_id,
                "game_id": game_id,
                "data": message_data
            }))

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# Game Categories API
@app.post("/categories", response_model=GameCategorySchema)
async def create_category(
    category: GameCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Create a new game category"""
    try:
        # Check if slug already exists
        existing = db.query(GameCategory).filter(GameCategory.slug == category.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Category slug already exists")

        db_category = GameCategory(**category.dict())
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Category creation failed")

@app.get("/categories", response_model=PaginatedResponse)
async def list_categories(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """List game categories with pagination and filtering"""
    query = db.query(GameCategory)

    if search:
        query = query.filter(
            or_(
                GameCategory.name.ilike(f"%{search}%"),
                GameCategory.description.ilike(f"%{search}%")
            )
        )

    if is_active is not None:
        query = query.filter(GameCategory.is_active == is_active)

    total = query.count()
    categories = query.order_by(GameCategory.display_order, GameCategory.name)\
                     .offset((page - 1) * per_page)\
                     .limit(per_page)\
                     .all()

    return PaginatedResponse(
        items=categories,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@app.get("/categories/{category_id}", response_model=GameCategorySchema)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a specific game category"""
    category = db.query(GameCategory).filter(GameCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

# Games API
@app.post("/games", response_model=GameSchema)
async def create_game(
    game: GameCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Create a new game"""
    try:
        # Check if category exists
        category = db.query(GameCategory).filter(GameCategory.id == game.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        # Check if slug already exists
        existing = db.query(Game).filter(Game.slug == game.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Game slug already exists")

        db_game = Game(**game.dict(), created_by=current_user["id"])
        db.add(db_game)
        db.commit()
        db.refresh(db_game)

        # Update category stats
        background_tasks.add_task(update_category_stats, game.category_id, db)

        return db_game
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Game creation failed")

@app.get("/games", response_model=PaginatedResponse)
async def list_games(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    filters: GameSearchFilters = Depends(),
    db: Session = Depends(get_db)
):
    """List games with advanced filtering and pagination"""
    query = db.query(Game).join(GameCategory)

    # Apply filters
    if filters.query:
        query = query.filter(
            or_(
                Game.title.ilike(f"%{filters.query}%"),
                Game.description.ilike(f"%{filters.query}%"),
                GameCategory.name.ilike(f"%{filters.query}%")
            )
        )

    if filters.category_id:
        query = query.filter(Game.category_id == filters.category_id)

    if filters.game_type:
        query = query.filter(Game.game_type == filters.game_type)

    if filters.difficulty:
        query = query.filter(Game.difficulty == filters.difficulty)

    if filters.is_featured is not None:
        query = query.filter(Game.is_featured == filters.is_featured)

    if filters.is_active is not None:
        query = query.filter(Game.is_active == filters.is_active)

    if filters.min_rating is not None:
        query = query.filter(Game.average_score >= filters.min_rating)

    if filters.max_rating is not None:
        query = query.filter(Game.average_score <= filters.max_rating)

    # Sorting
    sort_column = getattr(Game, filters.sort_by, Game.created_at)
    if filters.sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    total = query.count()
    games = query.options(joinedload(Game.category))\
               .offset((page - 1) * per_page)\
               .limit(per_page)\
               .all()

    return PaginatedResponse(
        items=games,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@app.get("/games/{game_id}", response_model=GameWithDetails)
async def get_game(game_id: int, db: Session = Depends(get_db)):
    """Get a specific game with details"""
    game = db.query(Game)\
             .options(
                 joinedload(Game.category),
                 joinedload(Game.leaderboards),
                 joinedload(Game.scores).limit(10)
             )\
             .filter(Game.id == game_id)\
             .first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    return game

@app.put("/games/{game_id}", response_model=GameSchema)
async def update_game(
    game_id: int,
    game_update: GameUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Update a game"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Check slug uniqueness if being updated
    if game_update.slug and game_update.slug != game.slug:
        existing = db.query(Game).filter(Game.slug == game_update.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Game slug already exists")

    # Check category exists if being updated
    if game_update.category_id:
        category = db.query(GameCategory).filter(GameCategory.id == game_update.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    old_category_id = game.category_id
    for field, value in game_update.dict(exclude_unset=True).items():
        setattr(game, field, value)

    game.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(game)

    # Update stats if category changed
    if game_update.category_id and game_update.category_id != old_category_id:
        background_tasks.add_task(update_category_stats, old_category_id, db)
        background_tasks.add_task(update_category_stats, game_update.category_id, db)

    return game

# Scores API
@app.post("/games/{game_id}/scores", response_model=GameScoreSchema)
async def submit_score(
    game_id: int,
    score_data: GameScoreCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Submit a game score"""
    # Check if game exists and is active
    game = db.query(Game).filter(Game.id == game_id, Game.is_active == True).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found or inactive")

    # Check if user is authenticated (if required)
    if game.requires_auth and not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        db_score = GameScore(**score_data.dict(), game_id=game_id, user_id=current_user["id"])
        db.add(db_score)
        db.commit()
        db.refresh(db_score)

        # Update game stats and leaderboards
        background_tasks.add_task(update_game_stats, game_id, db)
        background_tasks.add_task(update_leaderboards, game_id, db)

        # Check achievements
        background_tasks.add_task(
            check_achievements,
            current_user["id"],
            game_id,
            score_data.dict(),
            db
        )

        return db_score
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Score submission failed")

@app.get("/games/{game_id}/scores", response_model=PaginatedResponse)
async def get_game_scores(
    game_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get scores for a specific game"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    query = db.query(GameScore).filter(GameScore.game_id == game_id)

    if user_id:
        query = query.filter(GameScore.user_id == user_id)

    total = query.count()
    scores = query.order_by(desc(GameScore.score), GameScore.created_at)\
                 .offset((page - 1) * per_page)\
                 .limit(per_page)\
                 .all()

    return PaginatedResponse(
        items=scores,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

# Leaderboards API
@app.get("/games/{game_id}/leaderboards", response_model=List[LeaderboardWithEntries])
async def get_game_leaderboards(game_id: int, db: Session = Depends(get_db)):
    """Get all leaderboards for a game"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    leaderboards = db.query(Leaderboard)\
                     .options(joinedload(Leaderboard.entries))\
                     .filter(Leaderboard.game_id == game_id, Leaderboard.is_active == True)\
                     .all()

    return leaderboards

@app.get("/leaderboards/{leaderboard_id}", response_model=LeaderboardWithEntries)
async def get_leaderboard(leaderboard_id: int, db: Session = Depends(get_db)):
    """Get a specific leaderboard with entries"""
    leaderboard = db.query(Leaderboard)\
                    .options(joinedload(Leaderboard.entries))\
                    .filter(Leaderboard.id == leaderboard_id)\
                    .first()

    if not leaderboard:
        raise HTTPException(status_code=404, detail="Leaderboard not found")

    return leaderboard

# Tournaments API
@app.post("/tournaments", response_model=TournamentSchema)
async def create_tournament(
    tournament: TournamentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Create a new tournament"""
    try:
        # Check if game exists
        game = db.query(Game).filter(Game.id == tournament.game_id).first()
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")

        # Check if slug already exists
        existing = db.query(Tournament).filter(Tournament.slug == tournament.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Tournament slug already exists")

        db_tournament = Tournament(**tournament.dict(), created_by=current_user["id"])
        db.add(db_tournament)
        db.commit()
        db.refresh(db_tournament)
        return db_tournament
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Tournament creation failed")

@app.get("/tournaments", response_model=PaginatedResponse)
async def list_tournaments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    filters: TournamentSearchFilters = Depends(),
    db: Session = Depends(get_db)
):
    """List tournaments with filtering and pagination"""
    query = db.query(Tournament)

    if filters.game_id:
        query = query.filter(Tournament.game_id == filters.game_id)

    if filters.status:
        query = query.filter(Tournament.status == filters.status)

    if filters.tournament_type:
        query = query.filter(Tournament.tournament_type == filters.tournament_type)

    if filters.start_date_from:
        query = query.filter(Tournament.start_date >= filters.start_date_from)

    if filters.start_date_to:
        query = query.filter(Tournament.start_date <= filters.start_date_to)

    # Sorting
    sort_column = getattr(Tournament, filters.sort_by, Tournament.start_date)
    if filters.sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    total = query.count()
    tournaments = query.offset((page - 1) * per_page)\
                      .limit(per_page)\
                      .all()

    return PaginatedResponse(
        items=tournaments,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@app.post("/tournaments/{tournament_id}/register", response_model=TournamentParticipantSchema)
async def register_for_tournament(
    tournament_id: int,
    registration: TournamentRegistration,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Register for a tournament"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    if tournament.status != TournamentStatus.UPCOMING:
        raise HTTPException(status_code=400, detail="Tournament registration is closed")

    if tournament.current_participants >= tournament.max_participants:
        raise HTTPException(status_code=400, detail="Tournament is full")

    if datetime.utcnow() > tournament.registration_deadline:
        raise HTTPException(status_code=400, detail="Registration deadline has passed")

    # Check if user is already registered
    existing = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id,
        TournamentParticipant.user_id == current_user["id"]
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this tournament")

    try:
        participant = TournamentParticipant(
            tournament_id=tournament_id,
            user_id=current_user["id"]
        )
        db.add(participant)

        # Update participant count
        tournament.current_participants += 1

        db.commit()
        db.refresh(participant)
        return participant
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Registration failed")

# Achievements API
@app.get("/achievements", response_model=PaginatedResponse)
async def list_achievements(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    game_id: Optional[int] = None,
    achievement_type: Optional[AchievementType] = None,
    rarity: Optional[Rarity] = None,
    db: Session = Depends(get_db)
):
    """List achievements with filtering"""
    query = db.query(Achievement).filter(Achievement.is_active == True)

    if game_id:
        query = query.filter(
            or_(
                Achievement.game_id == game_id,
                Achievement.game_id.is_(None)
            )
        )

    if achievement_type:
        query = query.filter(Achievement.achievement_type == achievement_type)

    if rarity:
        query = query.filter(Achievement.rarity == rarity)

    total = query.count()
    achievements = query.order_by(Achievement.rarity, Achievement.name)\
                       .offset((page - 1) * per_page)\
                       .limit(per_page)\
                       .all()

    return PaginatedResponse(
        items=achievements,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@app.get("/users/{user_id}/achievements", response_model=List[UserAchievementWithAchievement])
async def get_user_achievements(user_id: int, db: Session = Depends(get_db)):
    """Get achievements for a specific user"""
    user_achievements = db.query(UserAchievement)\
                         .options(joinedload(UserAchievement.achievement))\
                         .filter(UserAchievement.user_id == user_id)\
                         .all()

    return user_achievements

@app.get("/users/{user_id}/stats", response_model=UserStats)
async def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """Get comprehensive user gaming statistics"""
    # Get basic stats
    total_games = db.query(func.sum(UserGameStats.games_played)).filter(UserGameStats.user_id == user_id).scalar() or 0
    total_score = db.query(func.sum(UserGameStats.total_score)).filter(UserGameStats.user_id == user_id).scalar() or 0

    achievements_unlocked = db.query(func.count(UserAchievement.id))\
                             .filter(UserAchievement.user_id == user_id, UserAchievement.is_completed == True)\
                             .scalar()

    tournaments_won = db.query(func.count(TournamentParticipant.id))\
                       .filter(TournamentParticipant.user_id == user_id, TournamentParticipant.status == ParticipantStatus.WINNER)\
                       .scalar()

    # Get favorite game type
    favorite_type = db.query(Game.game_type)\
                     .join(UserGameStats)\
                     .filter(UserGameStats.user_id == user_id)\
                     .group_by(Game.game_type)\
                     .order_by(func.count(UserGameStats.id).desc())\
                     .first()

    # Calculate average session time
    avg_session_time = db.query(func.avg(UserGameStats.total_time_played))\
                        .filter(UserGameStats.user_id == user_id)\
                        .scalar() or 0

    return UserStats(
        user_id=user_id,
        total_games_played=total_games,
        total_score=total_score,
        achievements_unlocked=achievements_unlocked,
        tournaments_won=tournaments_won,
        favorite_game_type=favorite_type[0] if favorite_type else None,
        average_session_time=avg_session_time
    )

# Bulk operations API (Admin only)
@app.post("/admin/games/bulk-update", response_model=SuccessResponse)
async def bulk_update_games(
    bulk_update: BulkGameUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Bulk update games (Admin only)"""
    games = db.query(Game).filter(Game.id.in_(bulk_update.game_ids)).all()
    if len(games) != len(bulk_update.game_ids):
        raise HTTPException(status_code=404, detail="Some games not found")

    updated_count = 0
    affected_categories = set()

    for game in games:
        old_category_id = game.category_id
        for field, value in bulk_update.updates.dict(exclude_unset=True).items():
            setattr(game, field, value)
        game.updated_at = datetime.utcnow()
        updated_count += 1

        if bulk_update.updates.category_id and bulk_update.updates.category_id != old_category_id:
            affected_categories.add(old_category_id)
            affected_categories.add(bulk_update.updates.category_id)

    db.commit()

    # Update stats for affected categories
    for category_id in affected_categories:
        background_tasks.add_task(update_category_stats, category_id, db)

    return SuccessResponse(message=f"Updated {updated_count} games successfully")

# Statistics API
@app.get("/stats/games/{game_id}", response_model=GameStats)
async def get_game_stats(game_id: int, db: Session = Depends(get_db)):
    """Get statistics for a specific game"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    stats = db.query(
        func.count(func.distinct(GameScore.user_id)).label('total_players'),
        func.count(GameScore.id).label('total_games'),
        func.avg(GameScore.score).label('average_score'),
        func.max(GameScore.score).label('high_score'),
        func.sum(GameScore.time_taken).label('total_time_played')
    ).filter(GameScore.game_id == game_id).first()

    return GameStats(
        game_id=game_id,
        total_players=stats.total_players or 0,
        total_games=stats.total_games or 0,
        average_score=stats.average_score or 0,
        high_score=stats.high_score or 0,
        total_time_played=stats.total_time_played or 0
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)