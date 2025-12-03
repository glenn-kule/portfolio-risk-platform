import os
from typing import List, Dict
import httpx
from app.models.models import Holding


RUST_RISK_ENGINE_URL = os.getenv("RUST_RISK_ENGINE_URL", "http://127.0.0.1:8001/compute")


async def calculate_portfolio_risk(holdings: List[Holding]) -> Dict:
    """
    Calculate risk metrics by calling the Rust risk engine microservice
    Falls back to simple calculation if Rust service is unavailable
    """
    
    # Prepare holdings data for Rust service
    holdings_data = []
    for h in holdings:
        holding_value = h.market_value or (h.quantity * h.avg_cost)
        holdings_data.append({
            "ticker": h.ticker,
            "asset_class": h.asset_class.value,
            "quantity": h.quantity,
            "avg_cost": h.avg_cost,
            "current_price": h.current_price,
            "market_value": holding_value
        })
    
    try:
        # Call Rust microservice
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                RUST_RISK_ENGINE_URL,
                json={"holdings": holdings_data}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Rust service returned error: {response.status_code}")
                return fallback_calculation(holdings)
                
    except Exception as e:
        print(f"Failed to call Rust service: {e}")
        print("Falling back to Python calculation")
        return fallback_calculation(holdings)


def fallback_calculation(holdings: List[Holding]) -> Dict:
    """
    Fallback calculation in Python if Rust service is unavailable
    """
    import numpy as np
    from app.models.models import AssetClass
    
    total_value = sum(h.market_value or (h.quantity * h.avg_cost) for h in holdings)
    
    if total_value == 0:
        return {
            "total_value": 0,
            "volatility_30d": None,
            "max_drawdown_1y": None,
            "sharpe_ratio": None,
            "cash_pct": 0,
            "top_holding_pct": 0,
            "diversification_score": 0
        }
    
    weights = []
    for h in holdings:
        holding_value = h.market_value or (h.quantity * h.avg_cost)
        weight = holding_value / total_value
        weights.append(weight)
    
    cash_holdings = [h for h in holdings if h.asset_class == AssetClass.CASH]
    cash_value = sum(h.market_value or (h.quantity * h.avg_cost) for h in cash_holdings)
    cash_pct = (cash_value / total_value) * 100 if total_value > 0 else 0
    
    top_holding_pct = max(weights) * 100 if weights else 0
    
    if len(holdings) > 1:
        herfindahl = sum(w ** 2 for w in weights)
        diversification_score = (1 - herfindahl) * 100
    else:
        diversification_score = 0
    
    volatility_map = {
        AssetClass.CASH: 0.01,
        AssetClass.BOND: 0.05,
        AssetClass.EQUITY: 0.18,
        AssetClass.CRYPTO: 0.80,
        AssetClass.COMMODITY: 0.25,
        AssetClass.REAL_ESTATE: 0.12
    }
    
    weighted_volatility = sum(
        weights[i] * volatility_map.get(holdings[i].asset_class, 0.15)
        for i in range(len(holdings))
    )
    volatility_30d = weighted_volatility * 100
    
    max_drawdown_estimate = weighted_volatility * 2.5 * 100
    
    return_map = {
        AssetClass.CASH: 0.04,
        AssetClass.BOND: 0.05,
        AssetClass.EQUITY: 0.10,
        AssetClass.CRYPTO: 0.15,
        AssetClass.COMMODITY: 0.08,
        AssetClass.REAL_ESTATE: 0.09
    }
    
    expected_return = sum(
        weights[i] * return_map.get(holdings[i].asset_class, 0.07)
        for i in range(len(holdings))
    )
    
    risk_free_rate = 0.04
    sharpe_ratio = (expected_return - risk_free_rate) / weighted_volatility if weighted_volatility > 0 else 0
    
    return {
        "total_value": round(total_value, 2),
        "volatility_30d": round(volatility_30d, 2),
        "max_drawdown_1y": round(max_drawdown_estimate, 2),
        "sharpe_ratio": round(sharpe_ratio, 2),
        "cash_pct": round(cash_pct, 2),
        "top_holding_pct": round(top_holding_pct, 2),
        "diversification_score": round(diversification_score, 2)
    }