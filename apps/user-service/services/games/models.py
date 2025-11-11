"""
Games Service Models - SQLAlchemy ORM models
Senior-level implementation with comprehensive gaming features
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey,
    Index, CheckConstraint, text, func, Float, BigInteger, JSON
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import JSONB

Base = declarative_base()

class GameCategory(Base):
    """Game category model"""
    __tablename__ = "game_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    game_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_players: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    games: Mapped[List["Game"]] = relationship("Game", back_populates="category", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(name) > 0', name='game_categories_name_length_check'),
        CheckConstraint('length(slug) > 0', name='game_categories_slug_length_check'),
        CheckConstraint('display_order >= 0', name='game_categories_display_order_check'),
        CheckConstraint('game_count >= 0', name='game_categories_game_count_check'),
        CheckConstraint('total_players >= 0', name='game_categories_total_players_check'),
        Index('idx_game_categories_active_order', 'is_active', 'display_order'),
        Index('idx_game_categories_slug', 'slug'),
    )

    def __repr__(self):
        return f"<GameCategory(id={self.id}, name='{self.name}', slug='{self.slug}')>"

class Game(Base):
    """Game model"""
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    game_url: Mapped[str] = mapped_column(String(500), nullable=False)  # Path to game files
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("game_categories.id"), nullable=False)
    game_type: Mapped[str] = mapped_column(String(50), nullable=False)  # puzzle, arcade, strategy, trivia, etc.
    difficulty: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)  # easy, medium, hard
    max_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    time_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # seconds
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    requires_auth: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    play_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unique_players: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_scores: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    category: Mapped["GameCategory"] = relationship("GameCategory", back_populates="games")
    scores: Mapped[List["GameScore"]] = relationship("GameScore", back_populates="game", cascade="all, delete-orphan")
    leaderboards: Mapped[List["Leaderboard"]] = relationship("Leaderboard", back_populates="game", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(title) > 0', name='games_title_length_check'),
        CheckConstraint('length(slug) > 0', name='games_slug_length_check'),
        CheckConstraint('length(game_url) > 0', name='games_game_url_length_check'),
        CheckConstraint('play_count >= 0', name='games_play_count_check'),
        CheckConstraint('unique_players >= 0', name='games_unique_players_check'),
        CheckConstraint('total_scores >= 0', name='games_total_scores_check'),
        CheckConstraint("game_type IN ('puzzle', 'arcade', 'strategy', 'trivia', 'action', 'simulation', 'sports', 'racing', 'other')", name='games_game_type_check'),
        CheckConstraint("difficulty IN ('easy', 'medium', 'hard')", name='games_difficulty_check'),
        Index('idx_games_category', 'category_id'),
        Index('idx_games_type', 'game_type'),
        Index('idx_games_featured', 'is_featured'),
        Index('idx_games_active', 'is_active'),
        Index('idx_games_slug', 'slug'),
        Index('idx_games_created', 'created_at'),
        Index('idx_games_plays', 'play_count'),
    )

    def __repr__(self):
        return f"<Game(id={self.id}, title='{self.title}', type='{self.game_type}')>"

class GameScore(Base):
    """Game score model"""
    __tablename__ = "game_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    game_id: Mapped[int] = mapped_column(Integer, ForeignKey("games.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    time_taken: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # seconds
    moves_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    level_reached: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)  # Additional game-specific data
    is_high_score: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Current rank for this score
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    game: Mapped["Game"] = relationship("Game", back_populates="scores")

    # Constraints
    __table_args__ = (
        CheckConstraint('score >= 0', name='game_scores_score_check'),
        CheckConstraint('time_taken > 0', name='game_scores_time_taken_check'),
        CheckConstraint('moves_count > 0', name='game_scores_moves_count_check'),
        CheckConstraint('level_reached > 0', name='game_scores_level_reached_check'),
        CheckConstraint('rank > 0', name='game_scores_rank_check'),
        Index('idx_game_scores_game', 'game_id'),
        Index('idx_game_scores_user', 'user_id'),
        Index('idx_game_scores_score', 'score'),
        Index('idx_game_scores_high_score', 'is_high_score'),
        Index('idx_game_scores_created', 'created_at'),
        Index('idx_game_scores_game_user', 'game_id', 'user_id'),
    )

    def __repr__(self):
        return f"<GameScore(game_id={self.game_id}, user_id={self.user_id}, score={self.score})>"

class Leaderboard(Base):
    """Leaderboard model"""
    __tablename__ = "leaderboards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    game_id: Mapped[int] = mapped_column(Integer, ForeignKey("games.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    leaderboard_type: Mapped[str] = mapped_column(String(20), default="global", nullable=False)  # global, weekly, monthly, all_time
    period_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    period_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    max_entries: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    game: Mapped["Game"] = relationship("Game", back_populates="leaderboards")
    entries: Mapped[List["LeaderboardEntry"]] = relationship("LeaderboardEntry", back_populates="leaderboard", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(name) > 0', name='leaderboards_name_length_check'),
        CheckConstraint('max_entries > 0', name='leaderboards_max_entries_check'),
        CheckConstraint("leaderboard_type IN ('global', 'weekly', 'monthly', 'all_time')", name='leaderboards_type_check'),
        Index('idx_leaderboards_game', 'game_id'),
        Index('idx_leaderboards_type', 'leaderboard_type'),
        Index('idx_leaderboards_active', 'is_active'),
        Index('idx_leaderboards_period', 'period_start', 'period_end'),
    )

    def __repr__(self):
        return f"<Leaderboard(id={self.id}, game_id={self.game_id}, name='{self.name}', type='{self.leaderboard_type}')>"

class LeaderboardEntry(Base):
    """Leaderboard entry model"""
    __tablename__ = "leaderboard_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    leaderboard_id: Mapped[int] = mapped_column(Integer, ForeignKey("leaderboards.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    score_id: Mapped[int] = mapped_column(Integer, ForeignKey("game_scores.id"), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    score_value: Mapped[int] = mapped_column(Integer, nullable=False)  # Denormalized for performance
    is_tied: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    leaderboard: Mapped["Leaderboard"] = relationship("Leaderboard", back_populates="entries")

    # Constraints
    __table_args__ = (
        CheckConstraint('rank > 0', name='leaderboard_entries_rank_check'),
        CheckConstraint('score_value >= 0', name='leaderboard_entries_score_value_check'),
        Index('idx_leaderboard_entries_leaderboard', 'leaderboard_id'),
        Index('idx_leaderboard_entries_user', 'user_id'),
        Index('idx_leaderboard_entries_rank', 'rank'),
        Index('idx_leaderboard_entries_score', 'score_value'),
        Index('idx_leaderboard_entries_unique', 'leaderboard_id', 'user_id', unique=True),
    )

    def __repr__(self):
        return f"<LeaderboardEntry(leaderboard_id={self.leaderboard_id}, user_id={self.user_id}, rank={self.rank}, score={self.score_value})>"

class Tournament(Base):
    """Tournament model"""
    __tablename__ = "tournaments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    game_id: Mapped[int] = mapped_column(Integer, ForeignKey("games.id"), nullable=False)
    tournament_type: Mapped[str] = mapped_column(String(20), default="single_elimination", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="upcoming", nullable=False)  # upcoming, active, completed, cancelled
    max_participants: Mapped[int] = mapped_column(Integer, nullable=False)
    current_participants: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    entry_fee: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Points or currency
    prize_pool: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    registration_deadline: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    rules: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    participants: Mapped[List["TournamentParticipant"]] = relationship("TournamentParticipant", back_populates="tournament", cascade="all, delete-orphan")
    matches: Mapped[List["TournamentMatch"]] = relationship("TournamentMatch", back_populates="tournament", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(name) > 0', name='tournaments_name_length_check'),
        CheckConstraint('length(slug) > 0', name='tournaments_slug_length_check'),
        CheckConstraint('max_participants > 1', name='tournaments_max_participants_check'),
        CheckConstraint('current_participants >= 0', name='tournaments_current_participants_check'),
        CheckConstraint('entry_fee >= 0', name='tournaments_entry_fee_check'),
        CheckConstraint('prize_pool >= 0', name='tournaments_prize_pool_check'),
        CheckConstraint("tournament_type IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss')", name='tournaments_type_check'),
        CheckConstraint("status IN ('upcoming', 'active', 'completed', 'cancelled')", name='tournaments_status_check'),
        Index('idx_tournaments_game', 'game_id'),
        Index('idx_tournaments_status', 'status'),
        Index('idx_tournaments_start_date', 'start_date'),
        Index('idx_tournaments_slug', 'slug'),
        Index('idx_tournaments_created_by', 'created_by'),
    )

    def __repr__(self):
        return f"<Tournament(id={self.id}, name='{self.name}', status='{self.status}')>"

class TournamentParticipant(Base):
    """Tournament participant model"""
    __tablename__ = "tournament_participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tournament_id: Mapped[int] = mapped_column(Integer, ForeignKey("tournaments.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="registered", nullable=False)  # registered, active, eliminated, winner
    seed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    current_round: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    games_played: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    games_won: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    registered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tournament: Mapped["Tournament"] = relationship("Tournament", back_populates="participants")

    # Constraints
    __table_args__ = (
        CheckConstraint('seed > 0', name='tournament_participants_seed_check'),
        CheckConstraint('current_round > 0', name='tournament_participants_current_round_check'),
        CheckConstraint('total_score >= 0', name='tournament_participants_total_score_check'),
        CheckConstraint('games_played >= 0', name='tournament_participants_games_played_check'),
        CheckConstraint('games_won >= 0', name='tournament_participants_games_won_check'),
        CheckConstraint("status IN ('registered', 'active', 'eliminated', 'winner')", name='tournament_participants_status_check'),
        Index('idx_tournament_participants_tournament', 'tournament_id'),
        Index('idx_tournament_participants_user', 'user_id'),
        Index('idx_tournament_participants_status', 'status'),
        Index('idx_tournament_participants_unique', 'tournament_id', 'user_id', unique=True),
    )

    def __repr__(self):
        return f"<TournamentParticipant(tournament_id={self.tournament_id}, user_id={self.user_id}, status='{self.status}')>"

class TournamentMatch(Base):
    """Tournament match model"""
    __tablename__ = "tournament_matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tournament_id: Mapped[int] = mapped_column(Integer, ForeignKey("tournaments.id"), nullable=False)
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    match_number: Mapped[int] = mapped_column(Integer, nullable=False)
    player1_id: Mapped[int] = mapped_column(Integer, nullable=False)
    player2_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # NULL for bye rounds
    winner_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    player1_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    player2_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="scheduled", nullable=False)  # scheduled, in_progress, completed, cancelled
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    game_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)  # Match-specific data
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    tournament: Mapped["Tournament"] = relationship("Tournament", back_populates="matches")

    # Constraints
    __table_args__ = (
        CheckConstraint('round_number > 0', name='tournament_matches_round_number_check'),
        CheckConstraint('match_number > 0', name='tournament_matches_match_number_check'),
        CheckConstraint('player1_score >= 0', name='tournament_matches_player1_score_check'),
        CheckConstraint('player2_score >= 0', name='tournament_matches_player2_score_check'),
        CheckConstraint("status IN ('scheduled', 'in_progress', 'completed', 'cancelled')", name='tournament_matches_status_check'),
        Index('idx_tournament_matches_tournament', 'tournament_id'),
        Index('idx_tournament_matches_round', 'round_number'),
        Index('idx_tournament_matches_players', 'player1_id', 'player2_id'),
        Index('idx_tournament_matches_winner', 'winner_id'),
        Index('idx_tournament_matches_status', 'status'),
        Index('idx_tournament_matches_scheduled', 'scheduled_at'),
    )

    def __repr__(self):
        return f"<TournamentMatch(id={self.id}, tournament_id={self.tournament_id}, round={self.round_number}, status='{self.status}')>"

class Achievement(Base):
    """Achievement model"""
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    achievement_type: Mapped[str] = mapped_column(String(20), nullable=False)  # score_based, play_count, streak, special
    condition_type: Mapped[str] = mapped_column(String(50), nullable=False)  # score_threshold, games_played, consecutive_wins, etc.
    condition_value: Mapped[int] = mapped_column(Integer, nullable=False)
    points_reward: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rarity: Mapped[str] = mapped_column(String(20), default="common", nullable=False)  # common, rare, epic, legendary
    game_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("games.id"), nullable=True)  # NULL for global achievements
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user_achievements: Mapped[List["UserAchievement"]] = relationship("UserAchievement", back_populates="achievement", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(name) > 0', name='achievements_name_length_check'),
        CheckConstraint('length(slug) > 0', name='achievements_slug_length_check'),
        CheckConstraint('length(description) > 0', name='achievements_description_length_check'),
        CheckConstraint('condition_value > 0', name='achievements_condition_value_check'),
        CheckConstraint('points_reward >= 0', name='achievements_points_reward_check'),
        CheckConstraint("achievement_type IN ('score_based', 'play_count', 'streak', 'completion', 'special')", name='achievements_type_check'),
        CheckConstraint("rarity IN ('common', 'rare', 'epic', 'legendary')", name='achievements_rarity_check'),
        Index('idx_achievements_type', 'achievement_type'),
        Index('idx_achievements_active', 'is_active'),
        Index('idx_achievements_rarity', 'rarity'),
        Index('idx_achievements_game', 'game_id'),
        Index('idx_achievements_slug', 'slug'),
    )

    def __repr__(self):
        return f"<Achievement(id={self.id}, name='{self.name}', type='{self.achievement_type}')>"

class UserAchievement(Base):
    """User achievement model"""
    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    achievement_id: Mapped[int] = mapped_column(Integer, ForeignKey("achievements.id"), nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Current progress towards achievement
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    achievement: Mapped["Achievement"] = relationship("Achievement", back_populates="user_achievements")

    # Constraints
    __table_args__ = (
        CheckConstraint('progress >= 0', name='user_achievements_progress_check'),
        Index('idx_user_achievements_user', 'user_id'),
        Index('idx_user_achievements_achievement', 'achievement_id'),
        Index('idx_user_achievements_completed', 'is_completed'),
        Index('idx_user_achievements_unique', 'user_id', 'achievement_id', unique=True),
    )

    def __repr__(self):
        return f"<UserAchievement(user_id={self.user_id}, achievement_id={self.achievement_id}, completed={self.is_completed})>"

class UserGameStats(Base):
    """User game statistics model"""
    __tablename__ = "user_game_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    game_id: Mapped[int] = mapped_column(Integer, ForeignKey("games.id"), nullable=False)
    games_played: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    high_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    best_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Best completion time in seconds
    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_time_played: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Total time in seconds
    last_played_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Constraints
    __table_args__ = (
        CheckConstraint('games_played >= 0', name='user_game_stats_games_played_check'),
        CheckConstraint('total_score >= 0', name='user_game_stats_total_score_check'),
        CheckConstraint('high_score >= 0', name='user_game_stats_high_score_check'),
        CheckConstraint('average_score >= 0', name='user_game_stats_average_score_check'),
        CheckConstraint('best_time > 0', name='user_game_stats_best_time_check'),
        CheckConstraint('current_streak >= 0', name='user_game_stats_current_streak_check'),
        CheckConstraint('longest_streak >= 0', name='user_game_stats_longest_streak_check'),
        CheckConstraint('total_time_played >= 0', name='user_game_stats_total_time_played_check'),
        Index('idx_user_game_stats_user', 'user_id'),
        Index('idx_user_game_stats_game', 'game_id'),
        Index('idx_user_game_stats_high_score', 'high_score'),
        Index('idx_user_game_stats_last_played', 'last_played_at'),
        Index('idx_user_game_stats_unique', 'user_id', 'game_id', unique=True),
    )

    def __repr__(self):
        return f"<UserGameStats(user_id={self.user_id}, game_id={self.game_id}, high_score={self.high_score})>"