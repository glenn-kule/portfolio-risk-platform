from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from app.models.models import AssetClass


# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# Portfolio schemas
class PortfolioCreate(BaseModel):
    name: str
    base_currency: str = "USD"


class PortfolioResponse(BaseModel):
    id: int
    user_id: int
    name: str
    base_currency: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Holding schemas
class HoldingCreate(BaseModel):
    ticker: str
    asset_class: AssetClass
    quantity: float
    avg_cost: float
    current_price: Optional[float] = None
    sector: Optional[str] = None


class HoldingResponse(BaseModel):
    id: int
    portfolio_id: int
    ticker: str
    asset_class: AssetClass
    quantity: float
    avg_cost: float
    current_price: Optional[float]
    market_value: Optional[float]
    sector: Optional[str]
    last_updated: datetime
    
    class Config:
        from_attributes = True


# Risk snapshot schemas
class RiskSnapshotResponse(BaseModel):
    id: int
    portfolio_id: int
    as_of: datetime
    volatility_30d: Optional[float]
    max_drawdown_1y: Optional[float]
    sharpe_ratio: Optional[float]
    cash_pct: Optional[float]
    top_holding_pct: Optional[float]
    diversification_score: Optional[float]
    total_value: Optional[float]
    
    class Config:
        from_attributes = True