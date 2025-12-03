from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.api import auth, portfolios, holdings, risk

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Portfolio Risk Platform API",
    description="REST API for portfolio risk analysis and recommendations",
    version="0.1.0"
)

# CORS middleware (allows frontend to call this API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
def read_root():
    return {
        "message": "Portfolio Risk Platform API",
        "status": "running",
        "version": "0.1.0"
    }

# Include routers (we'll create these next)
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(portfolios.router, prefix="/portfolios", tags=["Portfolios"])
app.include_router(holdings.router, prefix="/portfolios/{portfolio_id}/holdings", tags=["Holdings"])
app.include_router(risk.router, prefix="/portfolios/{portfolio_id}/risk", tags=["Risk Analysis"])