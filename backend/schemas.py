# backend/schemas.py (KODE LENGKAP DENGAN SKEMA UNTUK KASIR/POS)

from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

# --- TRANSACTION ---
class TransactionBase(BaseModel):
    customer_name: Optional[str] = None
    description: str
    revenue: float
    cost_of_goods: float = 0
    technician_name: Optional[str] = None
    commission_percentage: Optional[float] = None
    work_category: Optional[str] = None
    device_category: Optional[str] = None
    part_category: Optional[str] = None # <-- FIELD BARU

class TransactionCreate(TransactionBase):
    transaction_date: Optional[date] = None

class Transaction(TransactionBase):
    id: int
    transaction_date: datetime
    class Config:
        from_attributes = True

# --- EXPENSE ---
class ExpenseBase(BaseModel):
    description: str
    amount: float

class ExpenseCreate(ExpenseBase):
    expense_date: Optional[date] = None

class Expense(ExpenseBase):
    id: int
    expense_date: datetime
    class Config:
        from_attributes = True

# --- STOCK PURCHASE ---
class StockPurchaseBase(BaseModel):
    description: str
    amount: float

class StockPurchaseCreate(StockPurchaseBase):
    purchase_date: Optional[date] = None

class StockPurchase(StockPurchaseBase):
    id: int
    purchase_date: datetime
    class Config:
        from_attributes = True

# --- USER ---
class UserBase(BaseModel):
    username: str
    role: str
    full_name: Optional[str] = ""   # ✅ default string kosong

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = ""   # ✅ default string kosong
    password: Optional[str] = None
    role: Optional[str] = None

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# --- AUTH TOKEN ---
class Token(BaseModel):
    access_token: str
    token_type: str

# --- REPORTS ---
class PeriodSummary(BaseModel):
    start_date: date
    end_date: date
    total_pendapatan: float
    total_modal: float
    laba_kotor: float
    total_beban_operasional: float
    total_pengeluaran: float
    total_komisi_teknis: float
    laba_bersih_final: float

class DailyReport(PeriodSummary):
    date: date
    laba_bersih_sebelum_komisi: float
    alokasi_bsi: float
    alokasi_bca: float
    transactions: List[Transaction]
    expenses: List[Expense]
    stock_purchases: List[StockPurchase]

class MonthlyBreakdown(BaseModel):
    labels: List[str] # ["Jan", "Feb", ...]
    revenue: List[float]

class AnnualReport(PeriodSummary):
    monthly_breakdown: MonthlyBreakdown

# --- SKEMA BARU UNTUK LAPORAN TAHUNAN ---
# Catatan: Terdapat duplikasi definisi MonthlyBreakdown dan AnnualReport di file asli Anda.
# Saya akan mempertahankan satu definisi yang benar.
# class MonthlyBreakdown(BaseModel):
#     labels: List[str] # ["Jan", "Feb", ...]
#     revenue: List[float]

# class AnnualReport(PeriodSummary):
#     monthly_breakdown: MonthlyBreakdown

# --- SKEMA BARU UNTUK FITUR KASIR (POS) ---

# Skema ini merepresentasikan SATU item yang dimasukkan ke dalam keranjang belanja di halaman Kasir.
class POSItemCreate(BaseModel):
    description: str
    revenue: float
    cost_of_goods: float = 0
    work_category: Optional[str] = None
    device_category: Optional[str] = None
    part_category: Optional[str] = None

# Skema ini merepresentasikan seluruh data yang dikirim saat tombol "Selesaikan Transaksi" ditekan.
# Ini mencakup data umum (pelanggan, teknisi) dan sebuah LIST berisi semua item di keranjang.
class POSCheckout(BaseModel):
    customer_name: Optional[str] = None
    technician_name: Optional[str] = None
    commission_percentage: Optional[float] = None
    payment_method: Optional[str] = "Tunai" # Contoh: Tunai, Transfer BCA, QRIS
    discount_amount: float = 0
    items: List[POSItemCreate]