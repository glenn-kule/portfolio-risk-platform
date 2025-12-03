from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.models import User, Portfolio, Holding
from app.schemas.schemas import HoldingCreate, HoldingResponse
from app.api.auth import get_current_user

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


@router.get("", response_model=List[HoldingResponse])
def get_holdings(
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all holdings for a portfolio"""
    verify_portfolio_ownership(portfolio_id, current_user.id, db)
    
    holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio_id).all()
    return holdings


@router.post("", response_model=HoldingResponse, status_code=status.HTTP_201_CREATED)
def create_holding(
    portfolio_id: int,
    holding_data: HoldingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new holding to portfolio"""
    verify_portfolio_ownership(portfolio_id, current_user.id, db)
    
    # Calculate market value if current price provided
    market_value = None
    if holding_data.current_price:
        market_value = holding_data.quantity * holding_data.current_price
    
    new_holding = Holding(
        portfolio_id=portfolio_id,
        ticker=holding_data.ticker.upper(),
        asset_class=holding_data.asset_class,
        quantity=holding_data.quantity,
        avg_cost=holding_data.avg_cost,
        current_price=holding_data.current_price,
        market_value=market_value,
        sector=holding_data.sector
    )
    
    db.add(new_holding)
    db.commit()
    db.refresh(new_holding)
    
    return new_holding


@router.get("/{holding_id}", response_model=HoldingResponse)
def get_holding(
    portfolio_id: int,
    holding_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific holding"""
    verify_portfolio_ownership(portfolio_id, current_user.id, db)
    
    holding = db.query(Holding).filter(
        Holding.id == holding_id,
        Holding.portfolio_id == portfolio_id
    ).first()
    
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holding not found"
        )
    
    return holding


@router.put("/{holding_id}", response_model=HoldingResponse)
def update_holding(
    portfolio_id: int,
    holding_id: int,
    holding_data: HoldingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a holding"""
    verify_portfolio_ownership(portfolio_id, current_user.id, db)
    
    holding = db.query(Holding).filter(
        Holding.id == holding_id,
        Holding.portfolio_id == portfolio_id
    ).first()
    
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holding not found"
        )
    
    # Update fields
    holding.ticker = holding_data.ticker.upper()
    holding.asset_class = holding_data.asset_class
    holding.quantity = holding_data.quantity
    holding.avg_cost = holding_data.avg_cost
    holding.current_price = holding_data.current_price
    holding.sector = holding_data.sector
    
    # Recalculate market value
    if holding.current_price:
        holding.market_value = holding.quantity * holding.current_price
    
    db.commit()
    db.refresh(holding)
    
    return holding


@router.delete("/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holding(
    portfolio_id: int,
    holding_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a holding"""
    verify_portfolio_ownership(portfolio_id, current_user.id, db)
    
    holding = db.query(Holding).filter(
        Holding.id == holding_id,
        Holding.portfolio_id == portfolio_id
    ).first()
    
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holding not found"
        )
    
    db.delete(holding)
    db.commit()
    
    return None