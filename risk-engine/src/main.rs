use actix_web::{web, App, HttpResponse, HttpServer, Result};
use actix_cors::Cors;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
struct Holding {
    ticker: String,
    asset_class: String,
    quantity: f64,
    avg_cost: f64,
    current_price: Option<f64>,
    market_value: Option<f64>,
}

#[derive(Debug, Serialize)]
struct RiskMetrics {
    total_value: f64,
    volatility_30d: f64,
    max_drawdown_1y: f64,
    sharpe_ratio: f64,
    cash_pct: f64,
    top_holding_pct: f64,
    diversification_score: f64,
}

#[derive(Debug, Deserialize)]
struct ComputeRequest {
    holdings: Vec<Holding>,
}

fn calculate_risk(holdings: &[Holding]) -> RiskMetrics {
    // Calculate total portfolio value
    let total_value: f64 = holdings.iter()
        .map(|h| h.market_value.unwrap_or(h.quantity * h.avg_cost))
        .sum();

    if total_value == 0.0 {
        return RiskMetrics {
            total_value: 0.0,
            volatility_30d: 0.0,
            max_drawdown_1y: 0.0,
            sharpe_ratio: 0.0,
            cash_pct: 0.0,
            top_holding_pct: 0.0,
            diversification_score: 0.0,
        };
    }

    // Calculate weights
    let weights: Vec<f64> = holdings.iter()
        .map(|h| {
            let value = h.market_value.unwrap_or(h.quantity * h.avg_cost);
            value / total_value
        })
        .collect();

    // Asset class volatility map
    let volatility_map: HashMap<&str, f64> = [
        ("cash", 0.01),
        ("bond", 0.05),
        ("equity", 0.18),
        ("crypto", 0.80),
        ("commodity", 0.25),
        ("real_estate", 0.12),
    ].iter().cloned().collect();

    // Expected return map
    let return_map: HashMap<&str, f64> = [
        ("cash", 0.04),
        ("bond", 0.05),
        ("equity", 0.10),
        ("crypto", 0.15),
        ("commodity", 0.08),
        ("real_estate", 0.09),
    ].iter().cloned().collect();

    // Calculate weighted volatility
    let weighted_volatility: f64 = holdings.iter().zip(weights.iter())
        .map(|(h, &weight)| {
            let vol = volatility_map.get(h.asset_class.as_str()).unwrap_or(&0.15);
            weight * vol
        })
        .sum();

    let volatility_30d = weighted_volatility * 100.0;

    // Calculate max drawdown estimate
    let max_drawdown_1y = weighted_volatility * 2.5 * 100.0;

    // Calculate expected return
    let expected_return: f64 = holdings.iter().zip(weights.iter())
        .map(|(h, &weight)| {
            let ret = return_map.get(h.asset_class.as_str()).unwrap_or(&0.07);
            weight * ret
        })
        .sum();

    // Sharpe ratio
    let risk_free_rate = 0.04;
    let sharpe_ratio = if weighted_volatility > 0.0 {
        (expected_return - risk_free_rate) / weighted_volatility
    } else {
        0.0
    };

    // Cash percentage
    let cash_value: f64 = holdings.iter()
        .filter(|h| h.asset_class == "cash")
        .map(|h| h.market_value.unwrap_or(h.quantity * h.avg_cost))
        .sum();
    let cash_pct = (cash_value / total_value) * 100.0;

    // Top holding percentage
    let top_holding_pct = weights.iter()
        .cloned()
        .fold(0.0_f64, f64::max) * 100.0;

    // Diversification score (1 - Herfindahl index)
    let herfindahl: f64 = weights.iter().map(|&w| w * w).sum();
    let diversification_score = if holdings.len() > 1 {
        (1.0 - herfindahl) * 100.0
    } else {
        0.0
    };

    RiskMetrics {
        total_value: (total_value * 100.0).round() / 100.0,
        volatility_30d: (volatility_30d * 100.0).round() / 100.0,
        max_drawdown_1y: (max_drawdown_1y * 100.0).round() / 100.0,
        sharpe_ratio: (sharpe_ratio * 100.0).round() / 100.0,
        cash_pct: (cash_pct * 100.0).round() / 100.0,
        top_holding_pct: (top_holding_pct * 100.0).round() / 100.0,
        diversification_score: (diversification_score * 100.0).round() / 100.0,
    }
}

async fn compute_risk(req: web::Json<ComputeRequest>) -> Result<HttpResponse> {
    println!("📊 Computing risk for {} holdings", req.holdings.len());
    let metrics = calculate_risk(&req.holdings);
    println!("✅ Risk computed: volatility={:.2}%, sharpe={:.2}", 
             metrics.volatility_30d, metrics.sharpe_ratio);
    Ok(HttpResponse::Ok().json(metrics))
}

async fn health_check() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "risk-engine"
    })))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("🦀 Rust Risk Engine starting on http://127.0.0.1:8001");

    HttpServer::new(|| {
        let cors = Cors::permissive();
        
        App::new()
            .wrap(cors)
            .route("/", web::get().to(health_check))
            .route("/compute", web::post().to(compute_risk))
    })
    .bind(("127.0.0.1", 8001))?
    .run()
    .await
}