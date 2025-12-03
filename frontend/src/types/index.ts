export interface User {
    id: number;
    email: string;
    created_at: string;
  }
  
  export interface LoginCredentials {
    username: string; // API expects "username" field but we use email
    password: string;
  }
  
  export interface RegisterCredentials {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    access_token: string;
    token_type: string;
  }
  
  export interface Portfolio {
    id: number;
    user_id: number;
    name: string;
    base_currency: string;
    created_at: string;
  }
  
  export interface PortfolioCreate {
    name: string;
    base_currency: string;
  }
  
  export enum AssetClass {
    EQUITY = "equity",
    BOND = "bond",
    CASH = "cash",
    CRYPTO = "crypto",
    COMMODITY = "commodity",
    REAL_ESTATE = "real_estate",
  }
  
  export interface Holding {
    id: number;
    portfolio_id: number;
    ticker: string;
    asset_class: AssetClass;
    quantity: number;
    avg_cost: number;
    current_price: number | null;
    market_value: number | null;
    sector: string | null;
    last_updated: string;
  }
  
  export interface HoldingCreate {
    ticker: string;
    asset_class: AssetClass;
    quantity: number;
    avg_cost: number;
    current_price?: number;
    sector?: string;
  }
  
  export interface RiskSnapshot {
    id: number;
    portfolio_id: number;
    as_of: string;
    volatility_30d: number | null;
    max_drawdown_1y: number | null;
    sharpe_ratio: number | null;
    cash_pct: number | null;
    top_holding_pct: number | null;
    diversification_score: number | null;
    total_value: number | null;
  }