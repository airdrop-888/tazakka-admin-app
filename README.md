# Tazakka Group Service - Admin Dashboard

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFFFFF)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=FFFFFF)](https://supabase.io/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

Aplikasi dasbor admin untuk Tazakka Group Service yang dibangun untuk mempermudah pengelolaan transaksi, layanan, dan suku cadang.

<img width="1599" height="745" alt="admin panel" src="https://github.com/user-attachments/assets/2441468a-0574-4b5a-933b-16b406266918" />

### ✨ [Live Demo](https://tazakka-admin-app.vercel.app/)

---

### 📝 Daftar Isi

- [Tentang Proyek](#tentang-proyek)
  - [Fitur Utama](#fitur-utama)
  - [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Panduan Instalasi](#panduan-instalasi)
  - [Prasyarat](#prasyarat)
  - [Instalasi Lokal](#instalasi-lokal)
- [Kontak](#kontak)

---

### 🚀 Tentang Proyek

Proyek ini adalah sebuah dasbor admin yang berfungsi sebagai sistem Point of Sale (POS) atau kasir. Dibuat untuk membantu "Tazakka Group Service" dalam mengelola data transaksi, daftar jasa perbaikan, dan stok suku cadang secara efisien dan terpusat.

#### Fitur Utama

-   **🖥️ Kasir (Point of Sale)**: Antarmuka kasir untuk menambahkan produk atau jasa ke dalam keranjang transaksi.
-   **📈 Manajemen Transaksi**: Melihat riwayat, mencari, dan mengelola semua data transaksi yang masuk.
-   **📦 Manajemen Jasa & Produk**: Kemudahan untuk menambah, mengubah, dan menghapus daftar jasa atau produk yang ditawarkan.
-   **👥 Manajemen Staf**: (Opsional, jika ada) Mengelola akun dan hak akses untuk staf.
-   **📊 Dasbor Analitik**: (Opsional, jika ada) Menampilkan ringkasan pendapatan dan data analitik lainnya.

#### Teknologi yang Digunakan

-   **Frontend**:
    -   [React.js](https://reactjs.org/)
    -   [Vite](https://vitejs.dev/)
-   **Backend & Database**:
    -   [Supabase](https://supabase.io/) (Database PostgreSQL, Otentikasi, dan API)
-   **Deployment**:
    -   [Vercel](https://vercel.com/)

---

### 🛠️ Panduan Instalasi

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di lingkungan lokal Anda.

#### Prasyarat

Pastikan Anda sudah menginstal Node.js dan npm di komputer Anda.
-   **Node.js** (v16 atau lebih baru)
-   **npm**
    ```sh
    npm install npm@latest -g
    ```

#### Instalasi Lokal

1.  **Clone repositori ini**
    ```sh
    git clone https://github.com/airdrop-888/tazakka-admin-app.git
    ```
2.  **Masuk ke direktori proyek**
    ```sh
    cd tazakka-admin-app
    ```
3.  **Install semua dependencies**
    ```sh
    npm install
    ```
4.  **Konfigurasi Environment Variables**
    Buat file baru bernama `.env.local` di root folder proyek, lalu isi dengan kredensial Supabase Anda.
    ```env
    VITE_SUPABASE_URL="URL_PROYEK_SUPABASE_ANDA"
    VITE_SUPABASE_ANON_KEY="ANON_KEY_SUPABASE_ANDA"
    ```
    *Anda bisa mendapatkan URL dan Kunci Anon dari dasbor Supabase Anda di bagian Settings > API.*

5.  **Jalankan aplikasi**
    ```sh
    npm run dev
    ```
    Aplikasi akan berjalan di `http://localhost:5173`.

---

### 📬 Kontak

Mario Atmaja Nugraha - [Portfolio Anda](https://github.com/airdrop-888) - teamproject888official@gmail.com

Link Proyek: [https://github.com/airdrop-888/tazakka-admin-app](https://github.com/airdrop-888/tazakka-admin-app)
