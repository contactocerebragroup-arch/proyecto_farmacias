from fastapi import FastAPI
app = FastAPI()

@app.get("/api/health")
def health():
    return {"status": "minimal_works"}

@app.get("/api/prices")
def prices():
    return {"results": [], "total": 0, "status": "minimal_prices"}
