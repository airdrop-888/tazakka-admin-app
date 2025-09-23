// frontend/src/pages/DashboardPage.jsx (Versi Final yang Disempurnakan dan Diperbaiki)

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import ImportModal from './ImportModal';
import EditModal from './EditItemModal';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import * as XLSX from 'xlsx';

// --- Helper Functions ---
const formatToRupiah = (number) => {
    if (number === null || number === undefined) return 'Rp 0';
    const numericValue = parseInt(String(number).replace(/[^0-9-]/g, ''), 10);
    if (isNaN(numericValue)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericValue);
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
  const [dailyDetails, setDailyDetails] = useState(null); // Diubah ke null untuk penanganan kondisi yang lebih baik
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDate());

  // State untuk form
  const [txCustomerName, setTxCustomerName] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txRevenue, setTxRevenue] = useState('');
  const [txCost, setTxCost] = useState('');
  const [txTechnician, setTxTechnician] = useState('');
  const [txCommission, setTxCommission] = useState('');
  const [txDeviceCategory, setTxDeviceCategory] = useState('');
  const [txPartCategory, setTxPartCategory] = useState('');
  const [exDesc, setExDesc] = useState('');
  const [exAmount, setExAmount] = useState('');
  const [spDesc, setSpDesc] = useState('');
  const [spAmount, setSpAmount] = useState('');

  // Kategori
  const deviceCategories = ["Hape", "Laptop", "Printer", "Lainnya"];
  const partsCategoriesMap = { Hape: ["LCD", "Battery", "Papan Charger", "Lainnya"], Laptop: ["LCD", "Battery", "Keyboard", "Lainnya"], Printer: ["Cartridge", "Head", "Lainnya"], Lainnya: ["Jasa", "Penjualan", "Lainnya"] };

  const handleDeviceCategoryChange = (e) => {
    setTxDeviceCategory(e.target.value);
    setTxPartCategory('');
  };

  // --- Logika Fetch Data disederhanakan di dalam useEffect ---
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDate) return;
      
      setLoading(true);
      setError('');
      // Reset data sebelum fetch baru untuk mencegah tampilan data lama
      setDailyDetails(null);
      setSummaryData(null);

      try {
        const startDate = `${selectedDate}T00:00:00.000Z`;
        const endDate = `${selectedDate}T23:59:59.999Z`;

        const [transactionsRes, expensesRes, stockPurchasesRes] = await Promise.all([
          supabase.from('transactions').select('*').gte('transaction_date', startDate).lte('transaction_date', endDate),
          supabase.from('operational_expenses').select('*').gte('expense_date', startDate).lte('expense_date', endDate),
          supabase.from('stock_purchases').select('*').gte('purchase_date', startDate).lte('purchase_date', endDate)
        ]);

        if (transactionsRes.error) throw transactionsRes.error;
        if (expensesRes.error) throw expensesRes.error;
        if (stockPurchasesRes.error) throw stockPurchasesRes.error;

        const transactions = transactionsRes.data || [];
        const expenses = expensesRes.data || [];
        const stockPurchases = stockPurchasesRes.data || [];
        
        setDailyDetails({ transactions, expenses, stockPurchases });

        const total_pendapatan = transactions.reduce((sum, tx) => sum + (tx.revenue || 0), 0);
        const total_beban_operasional = expenses.reduce((sum, ex) => sum + (ex.amount || 0), 0);
        const total_pembelanjaan_stok = stockPurchases.reduce((sum, sp) => sum + (sp.amount || 0), 0);
        const total_pengeluaran = total_beban_operasional + total_pembelanjaan_stok;
        const laba_bersih_final = total_pendapatan - total_pengeluaran;

        setSummaryData({ total_pendapatan, total_beban_operasional, total_pengeluaran, laba_bersih_final });

      } catch (err) {
        setError('Gagal memuat data. Periksa koneksi Anda.');
        console.error("Error di fetchData:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]); // <-- Dijalankan hanya saat selectedDate berubah

  // --- Fungsi-fungsi Handler (Penambahan, Penghapusan, Ekspor, dll.) ---
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!currentUser) return setError('User tidak ditemukan, silakan login ulang.');

    const { error } = await supabase.from('transactions').insert([{
      customer_name: txCustomerName, description: txDesc, revenue: parseFloat(txRevenue), 
      cost_of_goods: parseFloat(txCost) || 0, technician_name: txTechnician || null, 
      commission_percentage: parseFloat(txCommission) || null, device_category: txDeviceCategory, 
      part_category: txPartCategory, transaction_date: new Date(selectedDate).toISOString(),
      recorded_by_user_id: currentUser.id
    }]);

    if (error) setError('Gagal menyimpan transaksi: ' + error.message);
    else {
      setTxCustomerName(''); setTxDesc(''); setTxRevenue(''); setTxCost(''); setTxTechnician(''); setTxCommission(''); setTxDeviceCategory(''); setTxPartCategory('');
      setSelectedDate(new Date(selectedDate).toISOString().split('T')[0]);
    }
  };
  
  const handleAddExpense = async (e) => {
      e.preventDefault();
      if (!currentUser) return setError('User tidak ditemukan, silakan login ulang.');
      const { error } = await supabase.from('operational_expenses').insert([{ description: exDesc, amount: parseFloat(exAmount), expense_date: new Date(selectedDate).toISOString(), recorded_by_user_id: currentUser.id }]);
      if (error) setError('Gagal menyimpan beban: ' + error.message); 
      else { 
          setExDesc(''); 
          setExAmount(''); 
          setSelectedDate(new Date(selectedDate).toISOString().split('T')[0]);
      }
  };
  
  const handleAddStockPurchase = async (e) => {
      e.preventDefault();
      if (!currentUser) return setError('User tidak ditemukan, silakan login ulang.');
      const { error } = await supabase.from('stock_purchases').insert([{ description: spDesc, amount: parseFloat(spAmount), purchase_date: new Date(selectedDate).toISOString(), recorded_by_user_id: currentUser.id }]);
      if (error) setError('Gagal menyimpan belanja stok: ' + error.message); 
      else { 
          setSpDesc(''); 
          setSpAmount(''); 
          setSelectedDate(new Date(selectedDate).toISOString().split('T')[0]);
      }
  };

  const handleDelete = async (type, id) => {
    if (window.confirm("Anda yakin ingin menghapus data ini? Aksi ini tidak dapat dibatalkan.")) {
        const tableName = type === 'expenses' ? 'operational_expenses' : type;
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) setError('Gagal menghapus data: ' + error.message);
        else setSelectedDate(new Date(selectedDate).toISOString().split('T')[0]);
    }
  };

  const handleExportXLSX = async () => {
    const dateObj = new Date(selectedDate);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const firstDay = new Date(year, month - 1, 1).toISOString();
    const lastDay = new Date(year, month, 0, 23, 59, 59).toISOString();
    
    try {
        const { data, error } = await supabase.from('transactions').select('*').gte('transaction_date', firstDay).lte('transaction_date', lastDay);
        if (error) throw error;

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
        XLSX.writeFile(workbook, `Laporan_Transaksi_${year}-${String(month).padStart(2, '0')}.xlsx`);
    } catch (err) {
        setError("Gagal mengunduh file laporan: " + err.message);
    }
  };

  const handleOpenEditModal = (item, type) => { setEditingItem(item); setModalType(type); };
  const handleCloseEditModal = () => { setEditingItem(null); setModalType(null); };
  const handleSaveEdit = () => { setSelectedDate(new Date(selectedDate).toISOString().split('T')[0]); handleCloseEditModal(); };
  const handleNumericInputChange = (value, setter) => { setter(parseRupiah(value)); };

  const getTitle = () => {
    if (loading && !summaryData) return "Memuat Laporan Harian...";
    const dateObj = new Date(selectedDate + 'T00:00:00');
    return `Laporan Harian (${dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`;
  };

  // --- JSX dengan Logika Render Langsung ---
  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        <h1>{getTitle()}</h1>
        <div className="filter-controls">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          {currentUser && currentUser.role !== 'kasir' && (
            <>
              <button onClick={() => setShowImportModal(true)} className="btn btn-warning">Import Data</button>
              <button onClick={handleExportXLSX} className="btn btn-success">Download Laporan</button>
            </>
          )}
        </div>
      </div>
      
      {loading && <p>Memuat data...</p>}
      {error && <p className="error">{error}</p>}
      
      {!loading && !error && summaryData && dailyDetails && (
        <>
            <h2>Ringkasan</h2>
            <div className="report-grid">
              <div className="report-card"><h3 style={{color: summaryData.laba_bersih_final < 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>Laba Bersih Final</h3><p style={{ color: summaryData.laba_bersih_final < 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>{formatToRupiah(summaryData.laba_bersih_final)}</p></div>
              <div className="report-card"><h3>Total Pendapatan</h3><p>{formatToRupiah(summaryData.total_pendapatan)}</p></div>
              <div className="report-card"><h3>Total Pengeluaran</h3><p style={{ color: '#e74c3c' }}>{formatToRupiah(summaryData.total_pengeluaran)}</p></div>
              <div className="report-card"><h3>Beban Operasional</h3><p>{formatToRupiah(summaryData.total_beban_operasional)}</p></div>
            </div>

            {currentUser && currentUser.role !== 'kasir' && (
              <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
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
            )}

            <h2>Detail Pemasukan Hari Ini</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Deskripsi</th>
                    <th>Pelanggan</th>
                    <th>Pendapatan</th>
                    {currentUser && currentUser.role !== 'kasir' && (
                        <>
                            <th>Modal</th>
                            <th>Teknisi</th>
                            <th>Aksi</th>
                        </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {dailyDetails.transactions.map(tx => (
                    <tr key={tx.id}>
                        <td>{tx.description}</td>
                        <td>{tx.customer_name}</td>
                        <td>{formatToRupiah(tx.revenue)}</td>
                        {currentUser && currentUser.role !== 'kasir' && (
                            <>
                                <td>{formatToRupiah(tx.cost_of_goods)}</td>
                                <td>{tx.technician_name || '-'}</td>
                                <td>
                                    <button onClick={() => handleOpenEditModal(tx, 'transactions')} className="btn-icon"><FiEdit /></button>
                                    <button onClick={() => handleDelete('transactions', tx.id)} className="btn-icon btn-delete"><FiTrash2 /></button>
                                </td>
                            </>
                        )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {currentUser && currentUser.role !== 'kasir' && (
              <>
                <h2 style={{ marginTop: '30px' }}>Detail Beban Operasional Hari Ini</h2>
                <div className="table-container">
                  <table>
                    <thead>
                        <tr><th>Deskripsi</th><th>Jumlah</th><th>Aksi</th></tr>
                    </thead>
                    <tbody>
                        {dailyDetails.expenses.map(ex => (
                            <tr key={ex.id}>
                                <td>{ex.description}</td>
                                <td>{formatToRupiah(ex.amount)}</td>
                                <td>
                                    <button onClick={() => handleOpenEditModal(ex, 'expenses')} className="btn-icon"><FiEdit /></button>
                                    <button onClick={() => handleDelete('expenses', ex.id)} className="btn-icon btn-delete"><FiTrash2 /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <h2 style={{ marginTop: '30px' }}>Detail Pembelanjaan Stok Hari Ini</h2>
                <div className="table-container">
                  <table>
                    <thead>
                        <tr><th>Deskripsi</th><th>Jumlah</th><th>Aksi</th></tr>
                    </thead>
                    <tbody>
                        {/* --- INI ADALAH BAGIAN YANG DIPERBAIKI --- */}
                        {dailyDetails.stockPurchases.map(sp => (
                            <tr key={sp.id}>
                                <td>{sp.description}</td>
                                <td>{formatToRupiah(sp.amount)}</td>
                                <td>
                                    <button onClick={() => handleOpenEditModal(sp, 'stock_purchases')} className="btn-icon"><FiEdit /></button>
                                    <button onClick={() => handleDelete('stock_purchases', sp.id)} className="btn-icon btn-delete"><FiTrash2 /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
        </>
      )}

      {!loading && !error && !summaryData && <p>Tidak ada data untuk ditampilkan pada tanggal ini.</p>}
      
      {editingItem && ( <EditModal item={editingItem} type={modalType} onClose={handleCloseEditModal} onSave={handleSaveEdit} /> )}
      {showImportModal && ( <ImportModal onClose={() => setShowImportModal(false)} onImportSuccess={() => { setShowImportModal(false); setSelectedDate(new Date(selectedDate).toISOString().split('T')[0]); }} /> )}
    </div>
  );
}

export default DashboardPage;