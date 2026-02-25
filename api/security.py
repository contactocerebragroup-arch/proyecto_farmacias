import os
from fastapi import Header, HTTPException, Security
from fastapi.security import APIKeyHeader
# from slowapi import Limiter
# from slowapi.util import get_remote_address

# API Key Security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    expected_key = os.getenv("APP_API_KEY")
    if not api_key or api_key != expected_key:
        raise HTTPException(
            status_code=403,
            detail="Could not validate credentials"
        )
    return api_key

# Rate Limiting (Removed for troubleshooting)
# limiter = Limiter(key_func=get_remote_address)
