# File: api/add_admin.py

# Impor library yang kita butuhkan
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import models
import auth
import os

# --- BAGIAN PENTING YANG HARUS ANDA UBAH ---

# ⚠️ GANTI DENGAN URL KONEKSI DARI DASHBOARD NEON ANDA
#    Ini adalah kunci untuk masuk ke database cloud Anda.
DATABASE_URL = "postgresql://neondb_owner:npg_P5lp2DuYBqfn@ep-silent-feather-addlqazu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# ✅ GANTI DENGAN PASSWORD YANG INGIN ANDA GUNAKAN UNTUK LOGIN
#    Gunakan password yang aman!
USERNAME_PENGGUNA = "pengelola"
PASSWORD_PENGGUNA = "Admindemo123$"
ROLE_PENGGUNA = "pengelola"

# --- KODE UTAMA (TIDAK PERLU DIUBAH) ---

# Membuat koneksi ke database Neon
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def add_user():
    db = SessionLocal()
    try:
        # Cek apakah user sudah ada sebelumnya
        existing_user = db.query(models.User).filter(models.User.username == USERNAME_PENGGUNA).first()
        if existing_user:
            print(f"✅ User '{USERNAME_PENGGUNA}' sudah ada di database. Tidak perlu ditambah lagi.")
            return

        # Jika belum ada, buat user baru
        print(f"Membuat user '{USERNAME_PENGGUNA}'...")
        hashed_password = auth.get_password_hash(PASSWORD_PENGGUNA)
        db_user = models.User(
            username=USERNAME_PENGGUNA,
            hashed_password=hashed_password,
            role=ROLE_PENGGUNA
        )
        db.add(db_user)
        db.commit()
        print(f"✅ Berhasil! User '{USERNAME_PENGGUNA}' telah ditambahkan ke database Neon.")
    
    except Exception as e:
        print(f"❌ TERJADI ERROR: {e}")
        print("   Pastikan URL database Anda sudah benar dan tabel sudah dibuat.")
    finally:
        db.close()

if __name__ == "__main__":
    add_user()