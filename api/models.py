from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
import db
from db import Base

class Price(Base):
    __tablename__ = "prices"

    id = Column(Integer, primary_key=True, index=True)
    pharmacy = Column(String, index=True)
    product = Column(String, index=True)
    price = Column(Float, index=True)
    stock = Column(String, nullable=True)
    url = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
