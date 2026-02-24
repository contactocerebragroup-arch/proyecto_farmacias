import os
from fastapi import FastAPI, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from . import models, db, scraper, security
from .security import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

app = FastAPI(title="EcoFarmacias API")

# Setup Rate Limiting Error Handler
app.state.limiter = security.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create tables in dev (SQLite)
# In prod, migrations are recommended, but for this MVP:
if os.getenv("VERCEL_ENV") != "production":
    models.Base.metadata.create_all(bind=db.engine)

@app.get("/api/prices")
def get_prices(db: Session = Depends(db.get_db)):
    prices = db.query(models.Price).order_by(models.Price.timestamp.desc()).limit(100).all()
    return prices

@app.post("/api/scrape")
@limiter.limit("5/minute")
def trigger_scrape(request: Request, db: Session = Depends(db.get_db), api_key: str = Depends(security.get_api_key)):
    """
    Triggers the scraping process and stores results in the database.
    Protected by X-API-Key and Rate Limiting.
    """
    extracted_data = scraper.scrape_all()
    
    new_entries = []
    for item in extracted_data:
        price_entry = models.Price(
            pharmacy=item["pharmacy"],
            product=item["product"],
            price=item["price"]
        )
        db.add(price_entry)
        new_entries.append(price_entry)
    
    db.commit()
    return {"status": "success", "count": len(new_entries)}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
