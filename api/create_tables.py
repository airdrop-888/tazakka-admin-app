# File: api/create_tables.py

import os
from sqlalchemy import create_engine
import models  # <-- Mengimpor file models.py Anda

# --- BAGIAN PENTING YANG HARUS ANDA UBAH ---

# ⚠️ GANTI DENGAN URL KONEKSI DARI DASHBOARD NEON ANDA
#    Ini harus sama persis dengan yang ada di add_admin.py
DATABASE_URL = "postgresql://neondb_owner:npg_P5lp2DuYBqfn@ep-silent-feather-addlqazu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"


# --- KODE UTAMA (TIDAK PERLU DIUBAH) ---

def main():
    print("Menghubungkan ke database Neon...")
    try:
        engine = create_engine(DATABASE_URL)
        
        print("Membuat semua tabel berdasarkan models.py...")
        # Perintah ini akan membaca semua class di models.py dan membuatnya di Neon
        models.Base.metadata.create_all(bind=engine)
        
        print("✅ Berhasil! Semua tabel seharusnya sudah ada di database Neon Anda.")
        print("   Sekarang, Anda bisa menjalankan 'python api/add_admin.py' lagi.")

    except Exception as e:
        print(f"❌ TERJADI ERROR: {e}")
        print("   Pastikan URL database Anda sudah benar.")

if __name__ == "__main__":
    main()