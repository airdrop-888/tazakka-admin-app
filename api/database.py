# File: api/database.py (VERSI FINAL UNTUK PRODUCTION)

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Baca URL database dari Environment Variable Vercel
# 2. Jika tidak ada (saat di lokal), gunakan file SQLite sebagai cadangan
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./tazakka.db")

# Siapkan argumen koneksi, hanya untuk SQLite
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Buat engine dengan konfigurasi yang sudah pintar
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()