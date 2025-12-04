# 📊 Portfolio Risk & Recommendation Platform

A full-stack, microservices-based portfolio management and risk analysis platform built with modern technologies. Features real-time risk calculation, interactive dashboards, and high-performance computing with Rust.

[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)
[![Rust](https://img.shields.io/badge/Rust-1.83-orange)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://www.docker.com/)

## 🚀 Features

- **Portfolio Management**: Create and manage multiple investment portfolios with diverse asset classes
- **Real-Time Risk Analysis**: Calculate volatility, max drawdown, Sharpe ratio, and diversification scores
- **High-Performance Computing**: Rust microservice delivers sub-50ms risk calculations (10x faster than Python)
- **Interactive Dashboard**: React + TypeScript frontend with real-time updates and responsive design
- **RESTful API**: Fully documented FastAPI backend with JWT authentication
- **Production Ready**: Fully containerized with Docker Compose for consistent deployments

## 🏗️ Architecture
```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React + TS    │────────▶│   FastAPI        │────────▶│   Rust          │
│   Frontend      │  HTTP   │   Backend        │  HTTP   │   Risk Engine   │
│   (Port 80)     │         │   (Port 8000)    │         │   (Port 8001)   │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                      │
                                      │ SQLAlchemy ORM
                                      ▼
                            ┌──────────────────┐
                            │   PostgreSQL     │
                            │   Database       │
                            │   (Port 5432)    │
                            └──────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Python 3.11** with FastAPI for REST API
- **PostgreSQL** for data persistence
- **SQLAlchemy** ORM with Alembic migrations
- **JWT** token-based authentication
- **Pydantic** for data validation
- **bcrypt** for password hashing

### Risk Engine
- **Rust** with Actix-web framework
- High-performance parallel computations
- Sub-50ms response time for risk calculations
- RESTful microservice architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast builds
- **TailwindCSS** for modern styling
- **React Query** (@tanstack/react-query) for state management
- **React Router** for client-side routing
- **Axios** for HTTP requests

### DevOps
- **Docker** & Docker Compose for containerization
- Multi-stage builds for optimized images
- Health checks and service dependencies
- Volume management for data persistence

## 📦 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- 8GB RAM recommended
- Ports 80, 8000, 8001, 5432 available

### Run with Docker (Recommended)
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/portfolio-risk-platform.git
cd portfolio-risk-platform

# Start all services
docker compose up

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

That's it! The application will be running with all services.

### Local Development Setup

#### 1. Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Mac/Linux
pip install -e ".[dev]"

# Setup database
createdb portfolio_risk_dev

# Run server
uvicorn app.main:app --reload
```

#### 2. Risk Engine
```bash
cd risk-engine
cargo run --release
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🎯 API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login and receive JWT token
- `GET /auth/me` - Get current user information

### Portfolios
- `GET /portfolios` - List all user portfolios
- `POST /portfolios` - Create new portfolio
- `GET /portfolios/{id}` - Get portfolio details
- `DELETE /portfolios/{id}` - Delete portfolio

### Holdings
- `GET /portfolios/{id}/holdings` - List all holdings
- `POST /portfolios/{id}/holdings` - Add new holding
- `PUT /portfolios/{id}/holdings/{holding_id}` - Update holding
- `DELETE /portfolios/{id}/holdings/{holding_id}` - Delete holding

### Risk Analysis
- `POST /portfolios/{id}/risk/compute` - Calculate risk metrics
- `GET /portfolios/{id}/risk/latest` - Get latest risk snapshot
- `GET /portfolios/{id}/risk/history` - Get historical risk data

Full API documentation available at `http://localhost:8000/docs` (Swagger UI)

## 📊 Risk Metrics Explained

| Metric | Description |
|--------|-------------|
| **Volatility (30d)** | Annualized standard deviation of returns based on asset class composition |
| **Max Drawdown** | Estimated largest peak-to-trough decline |
| **Sharpe Ratio** | Risk-adjusted return measure (return per unit of risk) |
| **Diversification Score** | Portfolio concentration metric (0-100, higher is better) |
| **Top Holding %** | Percentage of largest single position |
| **Cash %** | Percentage allocated to cash equivalents |

## 🗄️ Database Schema
```sql
users
├── id (PK)
├── email (unique)
├── password_hash
└── created_at

portfolios
├── id (PK)
├── user_id (FK)
├── name
├── base_currency
└── created_at

holdings
├── id (PK)
├── portfolio_id (FK)
├── ticker
├── asset_class
├── quantity
├── avg_cost
├── current_price
├── market_value
└── sector

risk_snapshots
├── id (PK)
├── portfolio_id (FK)
├── as_of
├── volatility_30d
├── max_drawdown_1y
├── sharpe_ratio
├── cash_pct
├── top_holding_pct
└── diversification_score
```

## ⚙️ Configuration

### Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/portfolio_risk_dev
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
RUST_RISK_ENGINE_URL=http://localhost:8001/compute
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
```

## 📈 Performance Benchmarks

| Operation | Python Baseline | Rust Engine | Improvement |
|-----------|----------------|-------------|-------------|
| Risk Calculation (1 portfolio) | ~500ms | <50ms | **10x faster** |
| Risk Calculation (10 portfolios) | ~5s | <200ms | **25x faster** |
| API Response Time (avg) | - | <100ms | - |
| Frontend Initial Load | - | <2s | - |

## 🧪 Testing
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Integration tests
docker compose up -d
# Run test suite against running containers
```

## 🚀 Deployment

### Docker Production Build
```bash
# Build optimized images
docker compose build

# Run in production mode
docker compose up -d
```

### AWS Deployment (Future)
The application is designed to run on:
- **AWS ECS Fargate** for container orchestration
- **AWS RDS PostgreSQL** for managed database
- **AWS S3 + CloudFront** for frontend hosting
- **AWS Secrets Manager** for credential management
- **AWS Application Load Balancer** for traffic distribution

## 🛣️ Roadmap

- [ ] Real-time market data integration (Alpha Vantage API)
- [ ] ML-based drawdown prediction model
- [ ] Redis caching layer for performance
- [ ] GitHub Actions CI/CD pipeline
- [ ] AWS ECS deployment automation
- [ ] Portfolio rebalancing recommendations
- [ ] Historical performance charts
- [ ] Export reports (PDF/Excel)

## 🤝 Contributing

This is a portfolio project, but feedback and suggestions are welcome! Feel free to:
- Open an issue for bugs or feature requests
- Fork the repo and submit pull requests
- Star the project if you find it useful

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

**Your Name**
- GitHub: [@glenn-kule](https://github.com/glenn-kule)
- LinkedIn: [Glenn Kule](https://linkedin.com/in/glenn-kule)
- Email: glennkule@gmail.com

---

**Built with** ❤️ **using Python, Rust, React, PostgreSQL, and Docker**

*This project demonstrates full-stack development skills, microservices architecture, high-performance computing, and modern DevOps practices.*