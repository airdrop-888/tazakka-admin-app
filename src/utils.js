// frontend/src/utils.js (File Baru)

// Fungsi ini akan kita gunakan di semua halaman
export const formatToRupiah = (number) => {
    if (number === null || number === undefined) return 'Rp 0';
    // Menggunakan parseFloat untuk menangani angka desimal jika ada
    const numericValue = parseFloat(String(number).replace(/[^0-9.-]/g, ''));
    if (isNaN(numericValue)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 // Memastikan tidak ada desimal di output akhir
    }).format(numericValue);
};

// Fungsi untuk mendapatkan tanggal lokal dalam format YYYY-MM-DD
export const getLocalDate = () => {
    const d = new Date();
    // Mengkompensasi timezone agar tanggal tidak mundur/maju
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};