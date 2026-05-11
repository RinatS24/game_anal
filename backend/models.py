from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # user / analyst / admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Platform(Base):
    __tablename__ = "platforms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    games = relationship("Game", back_populates="platform")


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    games = relationship("Game", back_populates="genre")


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    developer = Column(String, nullable=False)
    publisher = Column(String, nullable=False)
    release_year = Column(Integer)
    price = Column(Float, default=0.0)
    rating = Column(Float, default=0.0)
    metacritic = Column(Integer, default=0)
    sales_millions = Column(Float, default=0.0)
    online_players = Column(Integer, default=0)
    reviews_count = Column(Integer, default=0)

    platform_id = Column(Integer, ForeignKey("platforms.id"))
    genre_id = Column(Integer, ForeignKey("genres.id"))

    platform = relationship("Platform", back_populates="games")
    genre = relationship("Genre", back_populates="games")
    reviews = relationship("Review", back_populates="game", cascade="all, delete")
    snapshots = relationship("MarketSnapshot", back_populates="game", cascade="all, delete")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"))
    author = Column(String)
    score = Column(Float)
    text = Column(Text)
    sentiment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    game = relationship("Game", back_populates="reviews")


class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"))
    date = Column(DateTime, default=datetime.utcnow)
    online_players = Column(Integer, default=0)
    sales_millions = Column(Float, default=0.0)
    rating = Column(Float, default=0.0)

    game = relationship("Game", back_populates="snapshots")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    detail = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)