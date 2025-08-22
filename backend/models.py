# backend/models.py (KODE LENGKAP DENGAN recorded_by)

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String)
    role = Column(String, default="admin")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=True)
    work_category = Column(String, nullable=True)
    device_category = Column(String, nullable=True)
    part_category = Column(String, nullable=True)
    description = Column(String, index=True)
    transaction_date = Column(DateTime, default=datetime.datetime.now)
    revenue = Column(Float)
    cost_of_goods = Column(Float, default=0)
    technician_name = Column(String, nullable=True)
    commission_percentage = Column(Float, nullable=True)
    recorded_by_user_id = Column(Integer, ForeignKey("users.id")) # <-- KOLOM BARU
    recorder = relationship("User") # <-- Relasi

class OperationalExpense(Base):
    __tablename__ = "operational_expenses"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, index=True)
    expense_date = Column(DateTime, default=datetime.datetime.now)
    amount = Column(Float)
    recorded_by_user_id = Column(Integer, ForeignKey("users.id")) # <-- KOLOM BARU
    recorder = relationship("User") # <-- Relasi

class StockPurchase(Base):
    __tablename__ = "stock_purchases"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, index=True)
    purchase_date = Column(DateTime, default=datetime.datetime.now)
    amount = Column(Float)
    recorded_by_user_id = Column(Integer, ForeignKey("users.id")) # <-- KOLOM BARU
    recorder = relationship("User") # <-- Relasi