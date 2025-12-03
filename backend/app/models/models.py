from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    portfolios = relationship("Portfolio", back_populates="owner")


class Portfolio(Base):
    __tablename__ = "portfolios"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    base_currency = Column(String, default="USD")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="portfolios")
    holdings = relationship("Holding", back_populates="portfolio", cascade="all, delete-orphan")
    risk_snapshots = relationship("RiskSnapshot", back_populates="portfolio", cascade="all, delete-orphan")


class AssetClass(str, enum.Enum):
    EQUITY = "equity"
    BOND = "bond"
    CASH = "cash"
    CRYPTO = "crypto"
    COMMODITY = "commodity"
    REAL_ESTATE = "real_estate"


class Holding(Base):
    __tablename__ = "holdings"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    ticker = Column(String, nullable=False)
    asset_class = Column(Enum(AssetClass), nullable=False)
    quantity = Column(Float, nullable=False)
    avg_cost = Column(Float, nullable=False)
    current_price = Column(Float, nullable=True)
    market_value = Column(Float, nullable=True)
    sector = Column(String, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="holdings")


class RiskSnapshot(Base):
    __tablename__ = "risk_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    as_of = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Risk metrics
    volatility_30d = Column(Float, nullable=True)
    max_drawdown_1y = Column(Float, nullable=True)
    sharpe_ratio = Column(Float, nullable=True)
    cash_pct = Column(Float, nullable=True)
    top_holding_pct = Column(Float, nullable=True)
    diversification_score = Column(Float, nullable=True)
    total_value = Column(Float, nullable=True)
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="risk_snapshots")