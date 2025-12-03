from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.models.models import User, Portfolio, Holding, RiskSnapshot
from app.schemas.schemas import RiskSnapshotResponse
from app.api.auth import get_current_user
from app.services.risk_calculator import calculate_portfolio_risk

router = APIRouter()


def verify_portfolio_ownership(portfolio_id: int, user_id: int, db: Session):
    """Helper function to verify user owns the portfolio"""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == user_id
    ).first()
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found or access denied"
        )
    
    return portfolio


@router.post("/compute", response_model=RiskSnapshotResponse, status_code=status.HTTP_201_CREATED)
async def compute_risk(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compute risk metrics for a portfolio"""
    portfolio = verify_portfolio_ownership(portfolio_id, current_user.id, db)
    
    # Get holdings
    holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio_id).all()
    
    if not holdings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot compute risk for portfolio with no holdings"
        )
    
    # Calculate risk metrics (now calls Rust service)
    risk_metrics = await calculate_portfolio_risk(holdings)
    
    # Create risk snapshot
    risk_snapshot = RiskSnapshot(
        portfolio_id=portfolio_id,
        as_of=datetime.utcnow(),
        volatility_30d=risk_metrics.get("volatility_30d"),
        max_drawdown_1y=risk_metrics.get("max_drawdown_1y"),
        sharpe_ratio=risk_metrics.get("sharpe_ratio"),
        cash_pct=risk_metrics.get("cash_pct"),
        top_holding_pct=risk_metrics.get("top_holding_pct"),
        diversification_score=risk_metrics.get("diversification_score"),
        total_value=risk_metrics.get("total_value")
    )
    
    db.add(risk_snapshot)
    db.commit()
    db.refresh(risk_snapshot)
    
    return risk_snapshot


@router.get("/latest", response_model=RiskSnapshotResponse)
def get_latest_risk(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the most recent risk snapshot for a portfolio"""
    verify_portfolio_ownership(portfolio_id, current_user.id, db)
    
    risk_snapshot = db.query(RiskSnapshot).filter(
        RiskSnapshot.portfolio_id == portfolio_id
    ).order_by(RiskSnapshot.as_of.desc()).first()
    
    if not risk_snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No risk data found. Run /compute first."
        )
    
    return risk_snapshot


@router.get("/history", response_model=List[RiskSnapshotResponse])
def get_risk_history(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get historical risk snapshots for a portfolio"""
    verify_portfolio_ownership(portfolio_id, current_user.id, db)
    
    snapshots = db.query(RiskSnapshot).filter(
        RiskSnapshot.portfolio_id == portfolio_id
    ).order_by(RiskSnapshot.as_of.desc()).limit(30).all()
    
    return snapshots