// frontend/src/pages/DashboardPage.jsx (VERSI RAPIH DENGAN GRID METRIK TERPADU)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import ImportModal from './ImportModal';
import EditModal from './EditItemModal';
// --- PERUBAHAN: Ikon baru untuk StatCard ditambahkan ---
import { FiEdit, FiTrash2, FiCopy, FiTrendingUp, FiArrowDownCircle, FiDollarSign, FiFileText, FiTool, FiCheckSquare, FiAlertCircle, FiSettings } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StyledDatePicker from '../components/StyledDatePicker';
import { toast } from 'react-toastify';
// --- PERUBAHAN 1: Hapus import ServiceStats, ganti dengan StatCard ---
import StatCard from '../components/StatCard';

// --- Helper Functions ---
const formatToRupiah = (number) => {
    if (number === null || number === undefined) return 'Rp 0';
    // Penanganan angka negatif
    const isNegative = number < 0;
    const absoluteNumber = Math.abs(number);
    const numericValue = parseInt(String(absoluteNumber).replace(/[^0-9-]/g, ''), 10);
    if (isNaN(numericValue)) return 'Rp 0';
    const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericValue);
    return isNegative ? `-${formatted}` : formatted;
};

const formatToSimpleNumber = (number) => {
    if (number === null || number === undefined) return '0';
    const numericValue = parseInt(String(number).replace(/[^0-9-]/g, ''), 10);
    if (isNaN(numericValue)) return '0';
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(numericValue);
};

const parseRupiah = (rupiahString) => String(rupiahString).replace(/[^0-9]/g, '');

const getLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
// --- Akhir Helper Functions ---

function DashboardPage() {
  const currentUser = useUser();
  const [summaryData, setSummaryData] = useState(null);
  const [dailyDetails, setDailyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [txCustomerName, setTxCustomerName] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txRevenue, setTxRevenue] = useState('');
  const [txCost, setTxCost] = useState('');
  const [txTechnician, setTxTechnician] = useState('');
  const [txCommission, setTxCommission] = useState('');
  const [txDeviceCategory, setTxDeviceCategory] = useState('');
  const [txPartCategory, setTxPartCategory] = useState('');
  const [txPaymentMethod, setTxPaymentMethod] = useState('Cash');
  const [exDesc, setExDesc] = useState('');
  const [exAmount, setExAmount] = useState('');
  const [spDesc, setSpDesc] = useState('');
  const [spAmount, setSpAmount] = useState('');
  const [activeTab, setActiveTab] = useState('pemasukan');

  const deviceCategories = ["Hape", "Laptop", "Printer", "Lainnya"];
  const partsCategoriesMap = { Hape: ["LCD", "Battery", "Papan Charger", "Lainnya"], Laptop: ["LCD", "Battery", "Keyboard", "Lainnya"], Printer: ["Cartridge", "Head", "Lainnya"], Lainnya: ["Jasa", "Penjualan", "Lainnya"] };

  const handleDeviceCategoryChange = (e) => {
    setTxDeviceCategory(e.target.value);
    setTxPartCategory('');
  };

  // --- Logika fetch data sama persis, tidak ada perubahan ---
  const fetchData = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    setDailyDetails(null);
    setSummaryData(null);
    try {
      const dailyStartDate = `${selectedDate}T00:00:00.000Z`;
      const dailyEndDate = `${selectedDate}T23:59:59.999Z`;

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      const [
        transactionsRes, 
        expensesRes, 
        stockPurchasesRes, 
        activeJobsRes, 
        completedJobsRes,
        serviceJobsStatsRes
      ] = await Promise.all([
        supabase.from('transactions').select('*').gte('transaction_date', dailyStartDate).lte('transaction_date', dailyEndDate),
        supabase.from('operational_expenses').select('*').gte('expense_date', dailyStartDate).lte('expense_date', dailyEndDate),
        supabase.from('stock_purchases').select('*').gte('purchase_date', dailyStartDate).lte('purchase_date', dailyEndDate),
        supabase.from('service_jobs').select('*', { count: 'exact', head: true }).in('status', ['Menunggu Pengecekan', 'Menunggu Konfirmasi', 'Dalam Pengerjaan', 'Siap Diambil']),
        supabase.from('service_jobs').select('*', { count: 'exact', head: true }).eq('status', 'Selesai').gte('entry_date', startOfMonth.toISOString()).lte('entry_date', endOfMonth.toISOString()),
        supabase.from('service_jobs').select('status').in('status', ['Menunggu Pengecekan', 'Menunggu Konfirmasi', 'Dalam Pengerjaan', 'Siap Diambil'])
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (stockPurchasesRes.error) throw stockPurchasesRes.error;
      if (activeJobsRes.error) throw activeJobsRes.error;
      if (completedJobsRes.error) throw completedJobsRes.error;
      if (serviceJobsStatsRes.error) throw serviceJobsStatsRes.error;

      const transactions = transactionsRes.data || [];
      const expenses = expensesRes.data || [];
      const stockPurchases = stockPurchasesRes.data || [];
      setDailyDetails({ transactions, expenses, stockPurchases });

      const total_pendapatan = transactions.reduce((sum, tx) => sum + (tx.revenue || 0), 0);
      const total_modal = transactions.reduce((sum, tx) => sum + (tx.cost_of_goods || 0), 0);
      const total_komisi = transactions.reduce((sum, tx) => {
          const profit = (tx.revenue || 0) - (tx.cost_of_goods || 0);
          const commission = (profit * (tx.commission_percentage || 0)) / 100;
          return sum + commission;
      }, 0);
      const total_beban_operasional = expenses.reduce((sum, ex) => sum + (ex.amount || 0), 0);
      const total_pembelanjaan_stok = stockPurchases.reduce((sum, sp) => sum + (sp.amount || 0), 0);
      const total_pengeluaran = total_beban_operasional + total_pembelanjaan_stok;
      const laba_bersih_final = total_pendapatan - total_modal - total_komisi - total_beban_operasional;
      
      const statsData = serviceJobsStatsRes.data || [];
      const serviceStats = {
          total: statsData.length,
          menunggu: statsData.filter(j => j.status === 'Menunggu Pengecekan' || j.status === 'Menunggu Konfirmasi').length,
          pengerjaan: statsData.filter(j => j.status === 'Dalam Pengerjaan').length,
          siap: statsData.filter(j => j.status === 'Siap Diambil').length
      };

      setSummaryData({ 
          total_pendapatan, 
          total_beban_operasional, 
          total_pengeluaran, 
          laba_bersih_final, 
          total_modal, 
          total_komisi, 
          total_pembelanjaan_stok,
          active_jobs_count: activeJobsRes.count || 0,
          completed_jobs_this_month: completedJobsRes.count || 0,
          serviceStats: serviceStats
      });

    } catch (err) {
      toast.error('Gagal memuat data. Periksa koneksi Anda.');
      console.error("Error di fetchData:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Semua fungsi handle (handleAddTransaction, etc.) tetap sama ---
  const handleAddTransaction = async (e) => { e.preventDefault(); if (!currentUser) return toast.error('User tidak ditemukan, silakan login ulang.'); const { error } = await supabase.from('transactions').insert([{ customer_name: txCustomerName, description: txDesc, revenue: parseFloat(txRevenue), cost_of_goods: parseFloat(txCost) || 0, technician_name: txTechnician || null, commission_percentage: parseFloat(txCommission) || null, device_category: txDeviceCategory, part_category: txPartCategory, payment_method: txPaymentMethod, transaction_date: selectedDate, recorded_by_user_id: currentUser.id }]); if (error) { toast.error('Gagal menyimpan transaksi: ' + error.message); } else { toast.success('Transaksi berhasil ditambahkan!'); setTxCustomerName(''); setTxDesc(''); setTxRevenue(''); setTxCost(''); setTxTechnician(''); setTxCommission(''); setTxDeviceCategory(''); setTxPartCategory(''); setTxPaymentMethod('Cash'); fetchData(); } };
  const handleAddExpense = async (e) => { e.preventDefault(); if (!currentUser) return toast.error('User tidak ditemukan, silakan login ulang.'); const { error } = await supabase.from('operational_expenses').insert([{ description: exDesc, amount: parseFloat(exAmount), expense_date: selectedDate, recorded_by_user_id: currentUser.id }]); if (error) { toast.error('Gagal menyimpan beban: ' + error.message); } else { toast.success('Beban berhasil ditambahkan!'); setExDesc(''); setExAmount(''); fetchData(); } };
  const handleAddStockPurchase = async (e) => { e.preventDefault(); if (!currentUser) return toast.error('User tidak ditemukan, silakan login ulang.'); const { error } = await supabase.from('stock_purchases').insert([{ description: spDesc, amount: parseFloat(spAmount), purchase_date: selectedDate, recorded_by_user_id: currentUser.id }]); if (error) { toast.error('Gagal menyimpan belanja stok: ' + error.message); } else { toast.success('Belanja stok berhasil ditambahkan!'); setSpDesc(''); setSpAmount(''); fetchData(); } };
  const handleDelete = async (type, id) => { if (window.confirm("Anda yakin ingin menghapus data ini? Aksi ini tidak dapat dibatalkan.")) { const tableName = type === 'expenses' ? 'operational_expenses' : type; const { error } = await supabase.from(tableName).delete().eq('id', id); if (error) { toast.error('Gagal menghapus data: ' + error.message); } else { toast.success('Data berhasil dihapus.'); fetchData(); } } };
  const handleOpenEditModal = (item, type) => { setEditingItem(item); setModalType(type); };
  const handleCloseEditModal = () => { setEditingItem(null); setModalType(null); };
  const handleSaveEdit = () => { fetchData(); handleCloseEditModal(); };
  const handleNumericInputChange = (value, setter) => { setter(parseRupiah(value)); };
  const handleCopyReport = () => { if (!summaryData || !dailyDetails) { toast.warn('Data belum siap untuk disalin.'); return; } const formattedDate = new Date(selectedDate + 'T00:00:00Z').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); let reportText = `LAPORAN PEMASUKAN/PENGELUARAN TAZAKKA\nHari,tgl : ${formattedDate}\n\n`; dailyDetails.transactions.forEach((tx, index) => { const keuntungan = (tx.revenue || 0) - (tx.cost_of_goods || 0); const komisi = keuntungan * (tx.commission_percentage || 0) / 100; const bersih = keuntungan - komisi; const paymentEmoji = tx.payment_method === 'Transfer' ? '💳' : '💵'; reportText += `${index + 1}. ${tx.description} ${paymentEmoji}\n`; reportText += `Pendapatan: ${formatToSimpleNumber(tx.revenue)}\n`; if (tx.cost_of_goods > 0) reportText += `- Modal: ${formatToSimpleNumber(tx.cost_of_goods)}\n`; reportText += `Keuntungan: ${formatToSimpleNumber(keuntungan)}\n`; if (tx.commission_percentage > 0) reportText += `Upah Teknis ${tx.commission_percentage}%: ${formatToSimpleNumber(komisi)}\n`; reportText += `Bersih: ${formatToSimpleNumber(bersih)}\n\n`; }); if (dailyDetails.expenses.length > 0) { reportText += `Beban Operasional:\n`; dailyDetails.expenses.forEach(ex => { reportText += `- ${ex.description} ${formatToSimpleNumber(ex.amount)}\n`; }); reportText += `\n`; } const totalCash = dailyDetails.transactions .filter(tx => tx.payment_method !== 'Transfer') .reduce((sum, tx) => sum + (tx.revenue || 0), 0); const totalTransfer = dailyDetails.transactions .filter(tx => tx.payment_method === 'Transfer') .reduce((sum, tx) => sum + (tx.revenue || 0), 0); const labaKotor = summaryData.total_pendapatan - summaryData.total_modal; reportText += `Total keseluruhan\n- Pendapatan: ${formatToSimpleNumber(summaryData.total_pendapatan)}\n- Modal: ${formatToSimpleNumber(summaryData.total_modal)}\n- Keuntungan (Laba Kotor): ${formatToSimpleNumber(labaKotor)}\n- Total Komisi Teknisi: ${formatToSimpleNumber(summaryData.total_komisi)}\n- Total Beban Operasional: ${formatToSimpleNumber(summaryData.total_beban_operasional)}\n- Laba Bersih: ${formatToSimpleNumber(summaryData.laba_bersih_final)}\n`; reportText += `- Cash : ${formatToSimpleNumber(totalCash)}\n`; reportText += `- Transfer: ${formatToSimpleNumber(totalTransfer)}\n\n`; if (dailyDetails.stockPurchases.length > 0) { reportText += `Laporan Pembelanjaan/Pengeluaran\nHari, tgl : ${formattedDate}\n`; dailyDetails.stockPurchases.forEach(sp => { reportText += `- ${sp.description} ${formatToSimpleNumber(sp.amount)}\n`; }); reportText += `Total: ${formatToSimpleNumber(summaryData.total_pembelanjaan_stok)}\n`; } navigator.clipboard.writeText(reportText) .then(() => toast.success('Laporan harian berhasil disalin ke clipboard!')) .catch(err => toast.error('Gagal menyalin laporan: ' + err)); };
  const handleExportXLSX = async () => { toast.info('Mengunduh laporan bulanan. Mohon tunggu...'); try { const selected = new Date(selectedDate + 'T00:00:00Z'); const year = selected.getUTCFullYear(); const month = selected.getUTCMonth(); const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]; const monthName = monthNames[month].toUpperCase(); const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)).toISOString(); const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString(); const [transactionsRes, expensesRes, stockPurchasesRes] = await Promise.all([ supabase.from('transactions').select('*').gte('transaction_date', startDate).lte('transaction_date', endDate).order('transaction_date', { ascending: true }), supabase.from('operational_expenses').select('*').gte('expense_date', startDate).lte('expense_date', endDate).order('expense_date', { ascending: true }), supabase.from('stock_purchases').select('*').gte('purchase_date', startDate).lte('purchase_date', endDate).order('purchase_date', { ascending: true }) ]); if (transactionsRes.error || expensesRes.error || stockPurchasesRes.error) throw new Error("Gagal mengambil data bulanan."); const transactions = transactionsRes.data || []; const expenses = expensesRes.data || []; const stockPurchases = stockPurchasesRes.data || []; const totalPendapatan = transactions.reduce((sum, tx) => sum + (tx.revenue || 0), 0); const totalModal = transactions.reduce((sum, tx) => sum + (tx.cost_of_goods || 0), 0); const labaKotor = totalPendapatan - totalModal; const totalKomisi = transactions.reduce((sum, tx) => sum + (((tx.revenue || 0) - (tx.cost_of_goods || 0)) * (tx.commission_percentage || 0) / 100), 0); const totalBebanOperasional = expenses.reduce((sum, ex) => sum + (ex.amount || 0), 0); const totalPembelanjaanStok = stockPurchases.reduce((sum, sp) => sum + (sp.amount || 0), 0); const labaBersihFinal = labaKotor - totalKomisi - totalBebanOperasional; const kategoriCount = transactions.reduce((acc, tx) => { acc[tx.device_category || 'Lainnya'] = (acc[tx.device_category || 'Lainnya'] || 0) + 1; return acc; }, {}); let pemasukanData = [ [`LAPORAN PEMASUKAN TAZAKKA - ${monthName} ${year}`], [], ["RINGKASAN KEUANGAN"], ["Total Pendapatan Kotor", formatToRupiah(totalPendapatan)], ["Total Modal Barang Terjual", formatToRupiah(totalModal)], ["Laba Kotor (Pendapatan - Modal)", formatToRupiah(labaKotor)], ["Total Komisi Teknisi", formatToRupiah(totalKomisi)], ["Total Beban Operasional", formatToRupiah(totalBebanOperasional)], ["LABA BERSIH FINAL", formatToRupiah(labaBersihFinal)], [], ["RINGKASAN KATEGORI PERANGKAT"], ["Kategori", "Jumlah Transaksi"], ...Object.entries(kategoriCount).map(([key, value]) => [key, value]), ["TOTAL", transactions.length], [], ["DETAIL PEMASUKAN"], ["Tanggal", "Pelanggan", "Deskripsi", "Kategori Perangkat", "Pendapatan", "Modal", "Teknisi", "Komisi %"] ]; transactions.forEach(tx => pemasukanData.push([ new Date(tx.transaction_date).toLocaleDateString('id-ID'), tx.customer_name, tx.description, tx.device_category, formatToRupiah(tx.revenue), formatToRupiah(tx.cost_of_goods), tx.technician_name || '-', tx.commission_percentage || 0 ])); const ws_pemasukan = XLSX.utils.aoa_to_sheet(pemasukanData); ws_pemasukan['!cols'] = [{wch:12}, {wch:25}, {wch:40}, {wch:20}, {wch:15}, {wch:15}, {wch:20}, {wch:10}]; let pengeluaranData = [ [`LAPORAN PENGELUARAN TAZAKKA - ${monthName} ${year}`], [], ["RINGKASAN PENGELUARAN"], ["Total Beban Operasional", formatToRupiah(totalBebanOperasional)], ["Total Pembelanjaan Stok", formatToRupiah(totalPembelanjaanStok)], ["TOTAL PENGELUARAN KESELURUHAN", formatToRupiah(totalBebanOperasional + totalPembelanjaanStok)], [], ]; pengeluaranData.push(["DETAIL BEBAN OPERASIONAL"]); pengeluaranData.push(["Tanggal", "Deskripsi", "Jumlah"]); expenses.forEach(item => pengeluaranData.push([new Date(item.expense_date).toLocaleDateString('id-ID'), item.description, formatToRupiah(item.amount)])); pengeluaranData.push([]); pengeluaranData.push(["DETAIL PEMBELIAN STOK"]); pengeluaranData.push(["Tanggal", "Deskripsi", "Jumlah"]); stockPurchases.forEach(item => pengeluaranData.push([new Date(item.purchase_date).toLocaleDateString('id-ID'), item.description, formatToRupiah(item.amount)])); const ws_pengeluaran = XLSX.utils.aoa_to_sheet(pengeluaranData); ws_pengeluaran['!cols'] = [{wch:12}, {wch:40}, {wch:20}]; const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws_pemasukan, 'PEMASUKAN'); XLSX.utils.book_append_sheet(wb, ws_pengeluaran, 'PENGELUARAN'); XLSX.writeFile(wb, `Laporan_Bulanan_${monthName}_${year}.xlsx`); } catch (error) { toast.error("Gagal membuat file laporan bulanan: " + error.message); console.error("Gagal membuat file XLSX:", error); } };

  const chartData = useMemo(() => {
    if (!dailyDetails?.transactions) return { revenueByCategory: [], profitByTransaction: [] };
    const revenueByCategory = dailyDetails.transactions.reduce((acc, tx) => {
        const category = tx.device_category || 'Lainnya';
        if (!acc[category]) { acc[category] = { name: category, value: 0 }; }
        acc[category].value += tx.revenue || 0;
        return acc;
    }, {});
    const profitByTransaction = dailyDetails.transactions.map((tx, index) => ({
        name: `Trx #${index + 1}`,
        laba: (tx.revenue || 0) - (tx.cost_of_goods || 0),
    }));
    return { revenueByCategory: Object.values(revenueByCategory), profitByTransaction };
  }, [dailyDetails]);

  const PIE_CHART_COLORS = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#34495e'];

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Selamat datang, {currentUser?.full_name || 'Admin'}. 
            Ini ringkasan untuk {new Date(selectedDate + 'T00:00:00Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>
        <div className="dashboard-actions">
          <StyledDatePicker
            selectedDate={new Date(selectedDate + 'T00:00:00')}
            onChange={(date) => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              setSelectedDate(`${year}-${month}-${day}`);
            }}
          />
          <button onClick={handleCopyReport} className="btn btn-info" title="Salin Laporan Harian">
            <FiCopy style={{ marginRight: '8px' }} /> Copy
          </button>
          {currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && (
            <button onClick={() => setShowImportModal(true)} className="btn btn-warning">Import Data</button>
          )}
          {currentUser && currentUser.role !== 'kasir' && (
            <button onClick={handleExportXLSX} className="btn btn-success">Download Laporan</button>
          )}
        </div>
      </div>
      
      {loading && <p>Memuat data...</p>}
      
      {!loading && summaryData && dailyDetails && (
        <>
            {/* --- PERUBAHAN 2: Ganti semua card lama dengan grid metrik yang baru --- */}
            <div className="key-metrics-grid">
              <StatCard
                title="Laba Bersih (Harian)"
                value={formatToRupiah(summaryData.laba_bersih_final)}
                icon={<FiDollarSign />}
                color={summaryData.laba_bersih_final < 0 ? '231, 76, 60' : '46, 204, 113'} // Merah jika rugi, Hijau jika untung
              />
              <StatCard
                title="Total Pendapatan (Harian)"
                value={formatToRupiah(summaryData.total_pendapatan)}
                icon={<FiTrendingUp />}
                color="52, 152, 219" // Biru
              />
              <StatCard
                title="Total Pengeluaran (Harian)"
                value={formatToRupiah(summaryData.total_pengeluaran)}
                icon={<FiArrowDownCircle />}
                color="231, 76, 60" // Merah
              />
               <StatCard
                title="Beban Operasional (Harian)"
                value={formatToRupiah(summaryData.total_beban_operasional)}
                icon={<FiFileText />}
                color="230, 126, 34" // Oranye
              />

              {/* Baris kedua untuk statistik servisan */}
              <StatCard
                title="Servisan Aktif"
                value={summaryData.serviceStats.total}
                icon={<FiTool />}
                color="139, 92, 246" // Ungu
                note="Total servisan yang sedang berjalan"
              />
              <StatCard
                title="Menunggu"
                value={summaryData.serviceStats.menunggu}
                icon={<FiAlertCircle />}
                color="245, 158, 11" // Amber
                note="Pengecekan & Konfirmasi"
              />
              <StatCard
                title="Dikerjakan"
                value={summaryData.serviceStats.pengerjaan}
                icon={<FiSettings />}
                color="59, 130, 246" // Biru lebih terang
                note="Sedang dalam proses perbaikan"
              />
              <StatCard
                title="Selesai Bulan Ini"
                value={summaryData.completed_jobs_this_month}
                icon={<FiCheckSquare />}
                color="20, 184, 166" // Teal
                note="Total servisan yang selesai bulan ini"
              />
            </div>
            
            <div className="charts-grid">
              <div className="chart-container">
                  <h3 className="chart-title">Laba per Transaksi Harian</h3>
                  {chartData.profitByTransaction.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData.profitByTransaction} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID').format(value)} />
                              <Tooltip formatter={(value) => formatToRupiah(value)} />
                              <Legend />
                              <Line type="monotone" dataKey="laba" stroke="#3498db" strokeWidth={2} activeDot={{ r: 8 }} />
                          </LineChart>
                      </ResponsiveContainer>
                  ) : <div className="no-chart-data"><p>Belum ada transaksi untuk menampilkan grafik laba.</p></div>}
              </div>
              <div className="chart-container">
                <h3 className="chart-title">Pendapatan per Kategori</h3>
                 {chartData.revenueByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                          <Pie
                              data={chartData.revenueByCategory}
                              cx="50%" cy="50%" labelLine={false} outerRadius={110} fill="#8884d8" dataKey="value" nameKey="name"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                              {chartData.revenueByCategory.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatToRupiah(value)} />
                          <Legend />
                      </PieChart>
                  </ResponsiveContainer>
                ) : <div className="no-chart-data"><p>Belum ada pendapatan untuk divisualisasikan.</p></div>}
              </div>
            </div>

            {currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && (
              <>
                <div className="forms-wrapper-desktop" style={{ marginTop: '30px' }}>
                  <div>
                    <h2>Tambah Pemasukan</h2>
                    <form onSubmit={handleAddTransaction} className="form-section">
                        <input type="text" placeholder="Nama Pelanggan" value={txCustomerName} onChange={e => setTxCustomerName(e.target.value)} required />
                        <input type="text" placeholder="Deskripsi (misal: Ganti LCD iPhone)" value={txDesc} onChange={e => setTxDesc(e.target.value)} required />
                        <select value={txDeviceCategory} onChange={handleDeviceCategoryChange} required>
                            <option value="">-- Pilih Kategori Device --</option>
                            {deviceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        {txDeviceCategory && (
                            <select value={txPartCategory} onChange={e => setTxPartCategory(e.target.value)} required>
                                <option value="">-- Pilih Kategori Part/Jasa --</option>
                                {partsCategoriesMap[txDeviceCategory].map(part => <option key={part} value={part}>{part}</option>)}
                            </select>
                        )}
                        <select value={txPaymentMethod} onChange={e => setTxPaymentMethod(e.target.value)} required>
                            <option value="Cash">💵 Cash</option>
                            <option value="Transfer">💳 Transfer</option>
                        </select>
                        <input type="text" placeholder="Pendapatan (Rp)" value={formatToRupiah(txRevenue)} onChange={e => handleNumericInputChange(e.target.value, setTxRevenue)} required />
                        <input type="text" placeholder="Harga Modal Barang (Rp)" value={formatToRupiah(txCost)} onChange={e => handleNumericInputChange(e.target.value, setTxCost)} />
                        <input type="text" placeholder="Nama Teknisi" value={txTechnician} onChange={e => setTxTechnician(e.target.value)} />
                        <input type="number" placeholder="Komisi Teknisi (%)" value={txCommission} onChange={e => setTxCommission(e.target.value)} min="0" max="100" />
                        <button type="submit" className="btn">Tambah Pemasukan</button>
                    </form>
                  </div>
                  <div>
                    <h2>Tambah Beban Operasional</h2>
                    <form onSubmit={handleAddExpense} className="form-section">
                        <input type="text" placeholder="Deskripsi (misal: Bayar Listrik)" value={exDesc} onChange={e => setExDesc(e.target.value)} required />
                        <input type="text" placeholder="Jumlah (Rp)" value={formatToRupiah(exAmount)} onChange={e => handleNumericInputChange(e.target.value, setExAmount)} required />
                        <button type="submit" className="btn">Tambah Beban</button>
                    </form>
                  </div>
                  <div>
                    <h2>Tambah Pembelanjaan Stok</h2>
                    <form onSubmit={handleAddStockPurchase} className="form-section">
                        <input type="text" placeholder="Deskripsi (misal: Beli LCD Samsung)" value={spDesc} onChange={e => setSpDesc(e.target.value)} required />
                        <input type="text" placeholder="Jumlah (Rp)" value={formatToRupiah(spAmount)} onChange={e => handleNumericInputChange(e.target.value, setSpAmount)} required />
                        <button type="submit" className="btn">Tambah Belanja</button>
                    </form>
                  </div>
                </div>

                <div className="forms-wrapper-mobile">
                    <div className="form-tabs">
                        <button onClick={() => setActiveTab('pemasukan')} className={activeTab === 'pemasukan' ? 'active' : ''}>Pemasukan</button>
                        <button onClick={() => setActiveTab('beban')} className={activeTab === 'beban' ? 'active' : ''}>Beban</button>
                        <button onClick={() => setActiveTab('stok')} className={activeTab === 'stok' ? 'active' : ''}>Stok</button>
                    </div>
                    <div className="form-content-mobile">
                        {activeTab === 'pemasukan' && ( <div> <h2>Tambah Pemasukan</h2> <form onSubmit={handleAddTransaction} className="form-section"> <input type="text" placeholder="Nama Pelanggan" value={txCustomerName} onChange={e => setTxCustomerName(e.target.value)} required /> <input type="text" placeholder="Deskripsi (misal: Ganti LCD iPhone)" value={txDesc} onChange={e => setTxDesc(e.target.value)} required /> <select value={txDeviceCategory} onChange={handleDeviceCategoryChange} required> <option value="">-- Pilih Kategori Device --</option> {deviceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)} </select> {txDeviceCategory && ( <select value={txPartCategory} onChange={e => setTxPartCategory(e.target.value)} required> <option value="">-- Pilih Kategori Part/Jasa --</option> {partsCategoriesMap[txDeviceCategory].map(part => <option key={part} value={part}>{part}</option>)} </select> )} <select value={txPaymentMethod} onChange={e => setTxPaymentMethod(e.target.value)} required> <option value="Cash">💵 Cash</option> <option value="Transfer">💳 Transfer</option> </select> <input type="text" placeholder="Pendapatan (Rp)" value={formatToRupiah(txRevenue)} onChange={e => handleNumericInputChange(e.target.value, setTxRevenue)} required /> <input type="text" placeholder="Harga Modal Barang (Rp)" value={formatToRupiah(txCost)} onChange={e => handleNumericInputChange(e.target.value, setTxCost)} /> <input type="text" placeholder="Nama Teknisi" value={txTechnician} onChange={e => setTxTechnician(e.target.value)} /> <input type="number" placeholder="Komisi Teknisi (%)" value={txCommission} onChange={e => setTxCommission(e.target.value)} min="0" max="100" /> <button type="submit" className="btn">Tambah Pemasukan</button> </form> </div> )}
                        {activeTab === 'beban' && ( <div> <h2>Tambah Beban Operasional</h2> <form onSubmit={handleAddExpense} className="form-section"> <input type="text" placeholder="Deskripsi (misal: Bayar Listrik)" value={exDesc} onChange={e => setExDesc(e.target.value)} required /> <input type="text" placeholder="Jumlah (Rp)" value={formatToRupiah(exAmount)} onChange={e => handleNumericInputChange(e.target.value, setExAmount)} required /> <button type="submit" className="btn">Tambah Beban</button> </form> </div> )}
                        {activeTab === 'stok' && ( <div> <h2>Tambah Pembelanjaan Stok</h2> <form onSubmit={handleAddStockPurchase} className="form-section"> <input type="text" placeholder="Deskripsi (misal: Beli LCD Samsung)" value={spDesc} onChange={e => setSpDesc(e.target.value)} required /> <input type="text" placeholder="Jumlah (Rp)" value={formatToRupiah(spAmount)} onChange={e => handleNumericInputChange(e.target.value, setSpAmount)} required /> <button type="submit" className="btn">Tambah Belanja</button> </form> </div> )}
                    </div>
                </div>
              </>
            )}

            <h2 style={{ marginTop: '40px' }}>Detail Pemasukan Hari Ini</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Deskripsi</th><th>Pelanggan</th><th>Pendapatan</th>
                    {currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && ( <><th>Modal</th><th>Teknisi</th><th>Komisi</th><th>Aksi</th></> )}
                  </tr>
                </thead>
                <tbody>
                  {dailyDetails.transactions.map(tx => {
                    const commissionAmount = ((tx.revenue || 0) - (tx.cost_of_goods || 0)) * (tx.commission_percentage || 0) / 100;
                    return (
                        <tr key={tx.id}>
                            <td data-label="Deskripsi">{tx.description}</td>
                            <td data-label="Pelanggan">{tx.customer_name}</td>
                            <td data-label="Pendapatan">{formatToRupiah(tx.revenue)}</td>
                            {currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && (
                                <>
                                    <td data-label="Modal">{formatToRupiah(tx.cost_of_goods)}</td>
                                    <td data-label="Teknisi">{tx.technician_name || '-'}</td>
                                    <td data-label="Komisi">{formatToRupiah(commissionAmount)}</td>
                                    <td data-label="Aksi">
                                        <button onClick={() => handleOpenEditModal(tx, 'transactions')} className="btn-icon" title="Edit"><FiEdit /></button>
                                        <button onClick={() => handleDelete('transactions', tx.id)} className="btn-icon btn-delete" title="Hapus"><FiTrash2 /></button>
                                    </td>
                                </>
                            )}
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {currentUser && (currentUser.role === 'pemilik' || currentUser.role === 'pengelola' || currentUser.role === 'admin') && (
              <>
                <h2 style={{ marginTop: '30px' }}>Detail Beban Operasional Hari Ini</h2>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Deskripsi</th><th>Jumlah</th>{currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && (<th>Aksi</th>)}</tr></thead>
                    <tbody>
                        {dailyDetails.expenses.map(ex => (
                            <tr key={ex.id}>
                                <td data-label="Deskripsi">{ex.description}</td>
                                <td data--label="Jumlah">{formatToRupiah(ex.amount)}</td>
                                {currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && ( <td data-label="Aksi"> <button onClick={() => handleOpenEditModal(ex, 'expenses')} className="btn-icon" title="Edit"><FiEdit /></button> <button onClick={() => handleDelete('expenses', ex.id)} className="btn-icon btn-delete" title="Hapus"><FiTrash2 /></button> </td> )}
                            </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <h2 style={{ marginTop: '30px' }}>Detail Pembelanjaan Stok Hari Ini</h2>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Deskripsi</th><th>Jumlah</th>{currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && (<th>Aksi</th>)}</tr></thead>
                    <tbody>
                        {dailyDetails.stockPurchases.map(sp => (
                            <tr key={sp.id}>
                                <td data-label="Deskripsi">{sp.description}</td>
                                <td data-label="Jumlah">{formatToRupiah(sp.amount)}</td>
                                {currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && ( <td data-label="Aksi"> <button onClick={() => handleOpenEditModal(sp, 'stock_purchases')} className="btn-icon" title="Edit"><FiEdit /></button> <button onClick={() => handleDelete('stock_purchases', sp.id)} className="btn-icon btn-delete" title="Hapus"><FiTrash2 /></button> </td> )}
                            </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
        </>
      )}

      {!loading && !summaryData && <p>Tidak ada data untuk ditampilkan pada tanggal ini.</p>}
      
      {editingItem && ( <EditModal item={editingItem} type={modalType} onClose={handleCloseEditModal} onSave={handleSaveEdit} /> )}
      {showImportModal && ( <ImportModal onClose={() => setShowImportModal(false)} onImportSuccess={() => { setShowImportModal(false); fetchData(); }} /> )}
    </div>
  );
}

export default DashboardPage;