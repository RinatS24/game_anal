from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginRequest(BaseModel):
    username: str
    password: str


class PlatformOut(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class GenreOut(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class GameBase(BaseModel):
    title: str
    developer: str
    publisher: str
    release_year: int
    price: float = 0.0
    rating: float = 0.0
    metacritic: int = 0
    sales_millions: float = 0.0
    online_players: int = 0
    reviews_count: int = 0
    platform_id: int
    genre_id: int


class GameCreate(GameBase):
    pass


class GameUpdate(BaseModel):
    title: Optional[str] = None
    developer: Optional[str] = None
    publisher: Optional[str] = None
    release_year: Optional[int] = None
    price: Optional[float] = None
    rating: Optional[float] = None
    metacritic: Optional[int] = None
    sales_millions: Optional[float] = None
    online_players: Optional[int] = None
    reviews_count: Optional[int] = None
    platform_id: Optional[int] = None
    genre_id: Optional[int] = None


class GameOut(GameBase):
    id: int
    platform: Optional[PlatformOut] = None
    genre: Optional[GenreOut] = None
    model_config = ConfigDict(from_attributes=True)


class GameListOut(BaseModel):
    items: List[GameOut]
    total: int


class ReviewOut(BaseModel):
    id: int
    game_id: int
    author: str
    score: float
    text: str
    sentiment: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ReviewCreate(BaseModel):
    game_id: int
    author: str
    score: float
    text: str


class GenreStat(BaseModel):
    genre: str
    count: int
    total_sales: float
    avg_rating: float


class PlatformStat(BaseModel):
    platform: str
    count: int
    total_sales: float
    avg_rating: float


class YearStat(BaseModel):
    year: int
    count: int
    total_sales: float


class TopGame(BaseModel):
    id: int
    title: str
    sales_millions: float
    rating: float
    metacritic: int
    online_players: int


class DashboardSummary(BaseModel):
    total_games: int
    total_sales: float
    avg_rating: float
    total_online: int
    total_reviews: int
    genres: List[GenreStat]
    platforms: List[PlatformStat]
    years: List[YearStat]
    top_by_sales: List[TopGame]
    top_by_rating: List[TopGame]
    top_by_online: List[TopGame]
    sentiment: dict


class TrendPoint(BaseModel):
    date: str
    online_players: int
    sales_millions: float
    rating: float


class GameTrend(BaseModel):
    game_id: int
    title: str
    points: List[TrendPoint]