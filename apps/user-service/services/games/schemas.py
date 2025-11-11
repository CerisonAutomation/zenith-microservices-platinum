"""
Games Service Schemas - Pydantic models for validation and serialization
Senior-level implementation with comprehensive gaming validation
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, validator, field_validator
from pydantic.types import PositiveInt, NonNegativeInt
import re

class GameCategoryStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class GameType(str, Enum):
    PUZZLE = "puzzle"
    ARCADE = "arcade"
    STRATEGY = "strategy"
    TRIVIA = "trivia"
    ACTION = "action"
    SIMULATION = "simulation"
    SPORTS = "sports"
    RACING = "racing"
    OTHER = "other"

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class LeaderboardType(str, Enum):
    GLOBAL = "global"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ALL_TIME = "all_time"

class TournamentType(str, Enum):
    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS = "swiss"

class TournamentStatus(str, Enum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ParticipantStatus(str, Enum):
    REGISTERED = "registered"
    ACTIVE = "active"
    ELIMINATED = "eliminated"
    WINNER = "winner"

class MatchStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class AchievementType(str, Enum):
    SCORE_BASED = "score_based"
    PLAY_COUNT = "play_count"
    STREAK = "streak"
    COMPLETION = "completion"
    SPECIAL = "special"

class Rarity(str, Enum):
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"

# Base schemas
class GameCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    slug: str = Field(..., min_length=1, max_length=120, description="URL-friendly slug")
    description: Optional[str] = Field(None, max_length=1000, description="Category description")
    icon_url: Optional[str] = Field(None, description="Category icon URL")
    display_order: NonNegativeInt = Field(default=0, description="Display order for sorting")
    is_active: bool = Field(default=True, description="Whether category is active")

class GameCategoryCreate(GameCategoryBase):
    pass

class GameCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=1000)
    icon_url: Optional[str] = None
    display_order: Optional[NonNegativeInt] = None
    is_active: Optional[bool] = None

class GameCategory(GameCategoryBase):
    id: int
    game_count: NonNegativeInt = Field(default=0)
    total_players: NonNegativeInt = Field(default=0)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GameCategoryWithGames(GameCategory):
    games: List["GameSummary"] = []

# Game schemas
class GameBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Game title")
    slug: str = Field(..., min_length=1, max_length=220, description="URL-friendly slug")
    description: Optional[str] = Field(None, max_length=2000, description="Game description")
    instructions: Optional[str] = Field(None, max_length=5000, description="Game instructions")
    thumbnail_url: Optional[str] = Field(None, description="Game thumbnail URL")
    game_url: str = Field(..., description="Path to game files")
    category_id: PositiveInt = Field(..., description="Category ID")
    game_type: GameType = Field(..., description="Game type")
    difficulty: Difficulty = Field(default=Difficulty.MEDIUM, description="Game difficulty")
    max_score: Optional[PositiveInt] = Field(None, description="Maximum possible score")
    time_limit: Optional[PositiveInt] = Field(None, description="Time limit in seconds")
    is_featured: bool = Field(default=False, description="Whether game is featured")
    is_active: bool = Field(default=True, description="Whether game is active")
    requires_auth: bool = Field(default=False, description="Whether authentication is required")

class GameCreate(GameBase):
    pass

class GameUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=220)
    description: Optional[str] = Field(None, max_length=2000)
    instructions: Optional[str] = Field(None, max_length=5000)
    thumbnail_url: Optional[str] = None
    game_url: Optional[str] = None
    category_id: Optional[PositiveInt] = None
    game_type: Optional[GameType] = None
    difficulty: Optional[Difficulty] = None
    max_score: Optional[PositiveInt] = None
    time_limit: Optional[PositiveInt] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    requires_auth: Optional[bool] = None

class GameSummary(BaseModel):
    id: int
    title: str
    slug: str
    thumbnail_url: Optional[str]
    category_id: int
    game_type: GameType
    difficulty: Difficulty
    is_featured: bool
    is_active: bool
    play_count: NonNegativeInt
    unique_players: NonNegativeInt
    average_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True

class Game(GameSummary):
    description: Optional[str]
    instructions: Optional[str]
    game_url: str
    max_score: Optional[int]
    time_limit: Optional[int]
    requires_auth: bool
    total_scores: NonNegativeInt
    updated_at: datetime

class GameWithDetails(Game):
    category: GameCategory
    leaderboards: List["LeaderboardSummary"] = []
    recent_scores: List["GameScore"] = []

# Score schemas
class GameScoreBase(BaseModel):
    score: NonNegativeInt = Field(..., description="Game score")
    time_taken: Optional[PositiveInt] = Field(None, description="Time taken in seconds")
    moves_count: Optional[PositiveInt] = Field(None, description="Number of moves")
    level_reached: Optional[PositiveInt] = Field(None, description="Level reached")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional game data")

class GameScoreCreate(GameScoreBase):
    game_id: PositiveInt = Field(..., description="Game ID")

class GameScore(GameScoreBase):
    id: int
    game_id: int
    user_id: int
    is_high_score: bool
    rank: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class GameScoreWithGame(GameScore):
    game: GameSummary

# Leaderboard schemas
class LeaderboardBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Leaderboard name")
    description: Optional[str] = Field(None, max_length=1000, description="Leaderboard description")
    leaderboard_type: LeaderboardType = Field(default=LeaderboardType.GLOBAL, description="Leaderboard type")
    period_start: Optional[datetime] = Field(None, description="Period start date")
    period_end: Optional[datetime] = Field(None, description="Period end date")
    max_entries: PositiveInt = Field(default=100, description="Maximum entries")
    is_active: bool = Field(default=True, description="Whether leaderboard is active")

class LeaderboardCreate(LeaderboardBase):
    game_id: PositiveInt = Field(..., description="Game ID")

class LeaderboardUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    leaderboard_type: Optional[LeaderboardType] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    max_entries: Optional[PositiveInt] = None
    is_active: Optional[bool] = None

class LeaderboardSummary(BaseModel):
    id: int
    game_id: int
    name: str
    leaderboard_type: LeaderboardType
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Leaderboard(LeaderboardSummary):
    description: Optional[str]
    period_start: Optional[datetime]
    period_end: Optional[datetime]
    max_entries: int
    updated_at: datetime

class LeaderboardWithEntries(Leaderboard):
    entries: List["LeaderboardEntry"] = []

class LeaderboardEntry(BaseModel):
    id: int
    leaderboard_id: int
    user_id: int
    score_id: int
    rank: int
    score_value: int
    is_tied: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Tournament schemas
class TournamentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Tournament name")
    slug: str = Field(..., min_length=1, max_length=220, description="URL-friendly slug")
    description: Optional[str] = Field(None, max_length=2000, description="Tournament description")
    game_id: PositiveInt = Field(..., description="Game ID")
    tournament_type: TournamentType = Field(default=TournamentType.SINGLE_ELIMINATION, description="Tournament type")
    max_participants: PositiveInt = Field(..., gt=1, description="Maximum participants")
    entry_fee: Optional[NonNegativeInt] = Field(None, description="Entry fee")
    prize_pool: Optional[NonNegativeInt] = Field(None, description="Prize pool")
    start_date: datetime = Field(..., description="Tournament start date")
    end_date: Optional[datetime] = Field(None, description="Tournament end date")
    registration_deadline: datetime = Field(..., description="Registration deadline")
    rules: Optional[str] = Field(None, max_length=5000, description="Tournament rules")

    @field_validator('registration_deadline')
    @classmethod
    def validate_registration_deadline(cls, v, values):
        if 'start_date' in values.data and v >= values.data['start_date']:
            raise ValueError('Registration deadline must be before start date')
        return v

    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v, values):
        if v and 'start_date' in values.data and v <= values.data['start_date']:
            raise ValueError('End date must be after start date')
        return v

class TournamentCreate(TournamentBase):
    pass

class TournamentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=220)
    description: Optional[str] = Field(None, max_length=2000)
    game_id: Optional[PositiveInt] = None
    tournament_type: Optional[TournamentType] = None
    max_participants: Optional[PositiveInt] = None
    entry_fee: Optional[NonNegativeInt] = None
    prize_pool: Optional[NonNegativeInt] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    rules: Optional[str] = Field(None, max_length=5000)
    status: Optional[TournamentStatus] = None

class TournamentSummary(BaseModel):
    id: int
    name: str
    slug: str
    game_id: int
    tournament_type: TournamentType
    status: TournamentStatus
    max_participants: int
    current_participants: int
    start_date: datetime
    registration_deadline: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class Tournament(TournamentSummary):
    description: Optional[str]
    entry_fee: Optional[int]
    prize_pool: Optional[int]
    end_date: Optional[datetime]
    rules: Optional[str]
    created_by: int
    updated_at: datetime

class TournamentWithDetails(Tournament):
    participants: List["TournamentParticipant"] = []
    matches: List["TournamentMatch"] = []

class TournamentParticipant(BaseModel):
    id: int
    tournament_id: int
    user_id: int
    status: ParticipantStatus
    seed: Optional[int]
    current_round: Optional[int]
    total_score: int
    games_played: int
    games_won: int
    registered_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TournamentMatch(BaseModel):
    id: int
    tournament_id: int
    round_number: int
    match_number: int
    player1_id: int
    player2_id: Optional[int]
    winner_id: Optional[int]
    player1_score: Optional[int]
    player2_score: Optional[int]
    status: MatchStatus
    scheduled_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    game_data: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Achievement schemas
class AchievementBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Achievement name")
    slug: str = Field(..., min_length=1, max_length=120, description="URL-friendly slug")
    description: str = Field(..., min_length=1, max_length=1000, description="Achievement description")
    icon_url: Optional[str] = Field(None, description="Achievement icon URL")
    achievement_type: AchievementType = Field(..., description="Achievement type")
    condition_type: str = Field(..., min_length=1, max_length=50, description="Condition type")
    condition_value: PositiveInt = Field(..., description="Condition value")
    points_reward: NonNegativeInt = Field(default=0, description="Points reward")
    is_active: bool = Field(default=True, description="Whether achievement is active")
    rarity: Rarity = Field(default=Rarity.COMMON, description="Achievement rarity")
    game_id: Optional[PositiveInt] = Field(None, description="Game ID (NULL for global)")

class AchievementCreate(AchievementBase):
    pass

class AchievementUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    icon_url: Optional[str] = None
    achievement_type: Optional[AchievementType] = None
    condition_type: Optional[str] = Field(None, min_length=1, max_length=50)
    condition_value: Optional[PositiveInt] = None
    points_reward: Optional[NonNegativeInt] = None
    is_active: Optional[bool] = None
    rarity: Optional[Rarity] = None
    game_id: Optional[PositiveInt] = None

class Achievement(AchievementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserAchievement(BaseModel):
    id: int
    user_id: int
    achievement_id: int
    progress: NonNegativeInt
    is_completed: bool
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserAchievementWithAchievement(UserAchievement):
    achievement: Achievement

# Statistics schemas
class UserGameStats(BaseModel):
    id: int
    user_id: int
    game_id: int
    games_played: int
    total_score: int
    high_score: int
    average_score: float
    best_time: Optional[int]
    current_streak: int
    longest_streak: int
    total_time_played: int
    last_played_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GameStats(BaseModel):
    game_id: int
    total_players: int
    total_games: int
    average_score: float
    high_score: int
    total_time_played: int

class UserStats(BaseModel):
    user_id: int
    total_games_played: int
    total_score: int
    achievements_unlocked: int
    tournaments_won: int
    favorite_game_type: Optional[str]
    average_session_time: float

# Search and filter schemas
class GameSearchFilters(BaseModel):
    query: Optional[str] = Field(None, max_length=100, description="Search query")
    category_id: Optional[PositiveInt] = None
    game_type: Optional[GameType] = None
    difficulty: Optional[Difficulty] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    min_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Minimum average rating")
    max_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Maximum average rating")
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")

class LeaderboardSearchFilters(BaseModel):
    game_id: Optional[PositiveInt] = None
    leaderboard_type: Optional[LeaderboardType] = None
    is_active: Optional[bool] = None

class TournamentSearchFilters(BaseModel):
    game_id: Optional[PositiveInt] = None
    status: Optional[TournamentStatus] = None
    tournament_type: Optional[TournamentType] = None
    start_date_from: Optional[datetime] = None
    start_date_to: Optional[datetime] = None
    sort_by: str = Field(default="start_date", description="Sort field")
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$", description="Sort order")

# Bulk operation schemas
class BulkGameUpdate(BaseModel):
    game_ids: List[PositiveInt] = Field(min_length=1, max_length=50, description="Game IDs to update")
    updates: GameUpdate

class BulkAchievementUpdate(BaseModel):
    achievement_ids: List[PositiveInt] = Field(min_length=1, max_length=50, description="Achievement IDs to update")
    updates: AchievementUpdate

class BulkDeleteRequest(BaseModel):
    ids: List[PositiveInt] = Field(min_length=1, max_length=50, description="IDs to delete")

# Tournament registration schema
class TournamentRegistration(BaseModel):
    tournament_id: PositiveInt = Field(..., description="Tournament ID")

# Match result schema
class MatchResult(BaseModel):
    match_id: PositiveInt = Field(..., description="Match ID")
    player1_score: NonNegativeInt = Field(..., description="Player 1 score")
    player2_score: NonNegativeInt = Field(..., description="Player 2 score")
    winner_id: PositiveInt = Field(..., description="Winner user ID")

# Pagination schemas
class PaginationParams(BaseModel):
    page: PositiveInt = Field(default=1, description="Page number")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page")

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: NonNegativeInt
    page: PositiveInt
    per_page: int
    pages: int

# API response schemas
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[List[str]] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: List[str]

class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Any] = None

# Update forward references
GameCategoryWithGames.update_forward_refs()
GameWithDetails.update_forward_refs()
UserAchievementWithAchievement.update_forward_refs()
TournamentWithDetails.update_forward_refs()