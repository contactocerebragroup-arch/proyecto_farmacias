import os
from fastapi import FastAPI, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from . import models, db, scraper, security
from .security import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

app = FastAPI(title="Comparador de precios Farmacias API")

# Setup Rate Limiting Error Handler
app.state.limiter = security.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create tables in dev (SQLite)
# In prod, migrations are recommended, but for this MVP:
if os.getenv("VERCEL_ENV") != "production":
    models.Base.metadata.create_all(bind=db.engine)

@app.get("/api/prices")
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

@app.post("/api/scrape-url")
@limiter.limit("5/minute")
async def trigger_scrape_url(
    request: Request, 
    payload: dict, 
    db: Session = Depends(db.get_db), 
    api_key: str = Depends(security.get_api_key)
):
    """
    Scrapes a specific URL provided in the payload.
    """
    target_url = payload.get("url")
    if not target_url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        results = await scraper.fetch_manual_url(client, target_url)
    
    # Store results in background
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

@app.post("/api/scrape-geo")
@limiter.limit("5/minute")
async def trigger_scrape_geo(
    request: Request, 
    payload: dict, 
    db: Session = Depends(db.get_db), 
    api_key: str = Depends(security.get_api_key)
):
    """
    Scrapes popular sites with geographic context.
    """
    lat = payload.get("lat")
    lng = payload.get("lng")
    
    results = await scraper.scrape_geo_async(lat, lng)
    
    # Store results
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

@app.post("/api/scrape")
@limiter.limit("5/minute")
async def trigger_scrape(request: Request, db: Session = Depends(db.get_db), api_key: str = Depends(security.get_api_key)):
    """
    Triggers the high-performance async analysis process.
    """
    extracted_data = await scraper.scrape_all_async()
    
    new_entries = []
    for item in extracted_data:
        price_entry = models.Price(
            pharmacy=item["pharmacy"],
            product=item["product"],
            price=item["price"],
            stock=item["stock"],
            url=item["url"]
        )
        db.add(price_entry)
        new_entries.append(price_entry)
    
    db.commit()
    return {"status": "success", "count": len(new_entries), "scraped_at": str(models.datetime.utcnow())}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
