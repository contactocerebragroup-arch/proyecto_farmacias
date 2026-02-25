import os
import httpx
from fastapi import FastAPI, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from . import models, db, scraper, security

from fastapi import APIRouter
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Comparador de precios Farmacias API")

# Setup CORS just in case, though same-origin on Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Rate Limiting Error Handler
app.state.limiter = security.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Ensure tables exist (especially in serverless where DB might be fresh)
try:
    models.Base.metadata.create_all(bind=db.engine)
except Exception as e:
    print(f"Database init error: {e}")

router = APIRouter(prefix="/api")

@router.get("/prices")
def get_prices(
    db: Session = Depends(db.get_db),
    page: int = 1,
    limit: int = 20,
    pharmacy: str = None,
    search: str = None,
    sort: str = "price_asc"
):
    query = db.query(models.Price)
    
    if pharmacy and pharmacy != "Todas":
        query = query.filter(models.Price.pharmacy == pharmacy)
    
    if search:
        query = query.filter(models.Price.product.ilike(f"%{search}%"))
    
    if sort == "price_asc":
        query = query.order_by(models.Price.price.asc())
    elif sort == "price_desc":
        query = query.order_by(models.Price.price.desc())
    else:
        query = query.order_by(models.Price.timestamp.desc())

    total = query.count()
    prices = query.offset((page - 1) * limit).limit(limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": prices
    }

@router.post("/scrape-url")
@limiter.limit("5/minute")
async def trigger_scrape_url(
    request: Request, 
    payload: dict, 
    db: Session = Depends(db.get_db), 
    api_key: str = Depends(security.get_api_key)
):
    target_url = payload.get("url")
    if not target_url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        results = await scraper.fetch_manual_url(client, target_url)
    
    for item in results:
        entry = models.Price(
            pharmacy="Manual",
            product=item["product"],
            price=item["price"],
            stock=item["stock"],
            url=item["url"]
        )
        db.add(entry)
    db.commit()
    
    return {"status": "success", "results": results}

@router.post("/scrape-geo")
@limiter.limit("5/minute")
async def trigger_scrape_geo(
    request: Request, 
    payload: dict, 
    db: Session = Depends(db.get_db), 
    api_key: str = Depends(security.get_api_key)
):
    lat = payload.get("lat")
    lng = payload.get("lng")
    results = await scraper.scrape_geo_async(lat, lng)
    
    for item in results:
        entry = models.Price(
            pharmacy=item["pharmacy"],
            product=item["product"],
            price=item["price"],
            stock=item["stock"],
            url=item["url"]
        )
        db.add(entry)
    db.commit()
    
    return {"status": "success", "count": len(results)}

@router.get("/health")
def health_check():
    return {"status": "ok", "db": str(db.engine.url)}

# Include router
app.include_router(router)
