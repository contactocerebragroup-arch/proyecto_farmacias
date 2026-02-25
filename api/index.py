import os
import sys
import httpx
import asyncio
import structlog
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session

# 1. SETUP LOGGING
logger = structlog.get_logger()

# 2. DATABASE CONFIGURATION
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if os.getenv("VERCEL_ENV"):
        DATABASE_URL = "sqlite:////tmp/prices.db"
    else:
        DATABASE_URL = "sqlite:///prices.db"

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 3. MODELS
class Price(Base):
    __tablename__ = "prices"
    id = Column(Integer, primary_key=True, index=True)
    pharmacy = Column(String, index=True)
    product = Column(String, index=True)
    price = Column(Float, index=True)
    stock = Column(String, nullable=True)
    url = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

# 4. DATABASE INITIALIZATION
try:
    Base.metadata.create_all(bind=engine)
    print("DEBUG: Database tables created successfully")
except Exception as e:
    print(f"DEBUG: Database init error: {e}")

# 5. DEPENDENCIES
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    # Bypassed for open testing v3.2.2
    return "testing_mode_active"

# 6. APP INITIALIZATION
app = FastAPI(title="Comparador de precios Farmacias API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 7. IMPORT SCRAPER AND AI PARSER (Robustly)
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

try:
    import scraper
    import ai_parser
    print("DEBUG: Scraper and AI Parser imported")
except Exception as e:
    print(f"DEBUG: Scraper import failed: {e}")

# 8. ENDPOINTS
@app.get("/api/health")
def health_check():
    return {"status": "ok", "db": str(DATABASE_URL).split("@")[-1], "version": "v3.2.1"}

@app.get("/api/prices")
def get_prices(
    db_session: Session = Depends(get_db),
    page: int = 1,
    limit: int = 20,
    pharmacy: str = None,
    search: str = None,
    sort: str = "price_asc"
):
    query = db_session.query(Price)
    if pharmacy and pharmacy != "Todas":
        query = query.filter(Price.pharmacy == pharmacy)
    if search:
        query = query.filter(Price.product.ilike(f"%{search}%"))
    
    if sort == "price_asc":
        query = query.order_by(Price.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Price.price.desc())
    else:
        query = query.order_by(Price.timestamp.desc())

    total = query.count()
    prices = query.offset((page - 1) * limit).limit(limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": [
            {
                "pharmacy": p.pharmacy,
                "product": p.product,
                "price": p.price,
                "stock": p.stock,
                "url": p.url,
                "timestamp": p.timestamp.isoformat() if p.timestamp else None
            } for p in prices
        ]
    }

@app.post("/api/scrape-url")
async def trigger_scrape_url(
    request: Request, 
    payload: dict, 
    db_session: Session = Depends(get_db), 
    api_key: str = Depends(get_api_key)
):
    target_url = payload.get("url")
    if not target_url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        results = await scraper.fetch_manual_url(client, target_url)
    
    for item in results:
        entry = Price(
            pharmacy="Manual",
            product=item["product"],
            price=item["price"],
            stock=item["stock"],
            url=item["url"]
        )
        db_session.add(entry)
    db_session.commit()
    
    return {"status": "success", "results": results}

@app.post("/api/scrape-geo")
async def trigger_scrape_geo(
    request: Request, 
    payload: dict, 
    db_session: Session = Depends(get_db), 
    api_key: str = Depends(get_api_key)
):
    lat = payload.get("lat")
    lng = payload.get("lng")
    results = await scraper.scrape_geo_async(lat, lng)
    
    for item in results:
        entry = Price(
            pharmacy=item["pharmacy"],
            product=item["product"],
            price=item["price"],
            stock=item["stock"],
            url=item["url"]
        )
        db_session.add(entry)
    db_session.commit()
    
    return {"status": "success", "count": len(results)}
