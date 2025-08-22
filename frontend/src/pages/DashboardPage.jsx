// frontend/src/pages/DashboardPage.jsx (KODE LENGKAP - SUDAH DIPERBAIKI)

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import ImportModal from './ImportModal';
import EditModal from './EditItemModal';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { useUser } from '../UserContext';

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

function DashboardPage({ token, onLogout }) {
  const currentUser = useUser();
  const [summaryData, setSummaryData] = useState(null);
  const [dailyDetails, setDailyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const location = useLocation();

  const [txCustomerName, setTxCustomerName] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txRevenue, setTxRevenue] = useState('');
  const [txCost, setTxCost] = useState('');
  const [txTechnician, setTxTechnician] = useState('');
  const [txCommission, setTxCommission] = useState('');
  const [txWorkCategory, setTxWorkCategory] = useState('');
  const [txDeviceCategory, setTxDeviceCategory] = useState('');
  const [txPartCategory, setTxPartCategory] = useState('');
  const [exDesc, setExDesc] = useState('');
  const [exAmount, setExAmount] = useState('');
  const [spDesc, setSpDesc] = useState('');
  const [spAmount, setSpAmount] = useState('');
  
  const deviceCategories = ["Hape", "Laptop", "Printer", "Lainnya"];
  const partsCategoriesMap = {
    Hape: ["LCD", "Battery", "Papan Charger", "Buzzer Speaker", "Fleksibel Board", "Fleksibel Power/Volume", "Pernik", "Software", "Remove Virus", "Pengecekan", "Lainnya"],
    Laptop: ["LCD", "Battery", "Keyboard", "Speaker", "Cleaning, Repasta", "Fan Processor", "Paket Upgrade - Basic", "Paket Upgrade - Premium", "Paket Upgrade - Exclusive", "Paket Upgrade - Excellent", "Lainnya"],
    Printer: ["Cartridge Hitam", "Cartridge Warna", "Head", "Cleaning", "Reset", "Lainnya"],
    Lainnya: ["Jasa", "Penjualan", "Lainnya"]
  };

  const handleDeviceCategoryChange = (e) => {
    const newDeviceCategory = e.target.value;
    setTxDeviceCategory(newDeviceCategory);
    setTxPartCategory('');
  };
  
  const fetchData = useCallback(async () => {
    if (!selectedDate) return;

    setLoading(true);
    setError('');
    try {
        // --- PERBAIKAN 1 ---
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/reports/daily/`;
        const response = await axios.get(apiUrl, { 
            headers: { Authorization: `Bearer ${token}` }, 
            params: { report_date: selectedDate } 
        });
        setSummaryData(response.data);
        setDailyDetails(response.data);
    } catch (err) { setError('Gagal memuat data. Periksa koneksi atau coba login ulang.'); console.error(err); } 
    finally { setLoading(false); }
  }, [token, selectedDate]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [fetchData, token]);

  useEffect(() => {
    if (location.pathname === '/') {
        setSelectedDate(getLocalDate());
    }
  }, [location.pathname]);

  const handleApiSubmit = async (endpoint, data, successCallback) => {
    try {
      let dataWithDate = { ...data, transaction_date: selectedDate, expense_date: selectedDate, purchase_date: selectedDate };
      // --- PERBAIKAN 2 ---
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}${endpoint}`;
      await axios.post(apiUrl, dataWithDate, { headers: { Authorization: `Bearer ${token}` } });
      successCallback();
      await fetchData();
    } catch (err) { setError('Gagal menyimpan data.'); }
  };

  const handleDelete = async (type, id) => {
    if (window.confirm("Anda yakin ingin menghapus data ini? Aksi ini tidak dapat dibatalkan.")) {
        try {
            // --- PERBAIKAN 3 ---
            const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/${type}/${id}`;
            await axios.delete(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
            await fetchData();
        } catch (err) { setError('Gagal menghapus data.'); }
    }
  };

  const handleOpenEditModal = (item, type) => { setEditingItem(item); setModalType(type); };
  const handleCloseEditModal = () => { setEditingItem(null); setModalType(null); };
  const handleSaveEdit = async () => { 
    await fetchData(); 
    handleCloseEditModal(); 
  };
  
  const handleExportXLSX = async () => {
      const dateObj = new Date(selectedDate);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      try {
        // --- PERBAIKAN 4 ---
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/reports/monthly/export?year=${year}&month=${month}`;
        const response = await axios.get(apiUrl, {
            headers: { Authorization: `Bearer ${token}` }, responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        const contentDisposition = response.headers['content-disposition'];
        let fileName = `Laporan_Bulanan_Default.xlsx`;
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
        }
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) { setError("Gagal mengunduh file laporan."); }
  };
  
  // Sisa kode tidak perlu diubah...
  const handleNumericInputChange = (value, setter) => { setter(parseRupiah(value)); };
  const getTitle = () => { if (loading && !summaryData) return "Memuat Laporan Harian..."; const dateObj = new Date(selectedDate + 'T00:00:00'); return `Laporan Harian (${dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`; };
  const renderContent = () => { if (loading) return <p>Memuat data...</p>; if (error) return <p className="error">{error}</p>; if (!summaryData || !dailyDetails) return <p>Tidak ada data untuk ditampilkan.</p>; return (<><h2>Ringkasan</h2><div className="report-grid"><div className="report-card"><h3 style={{color: summaryData.laba_bersih_final < 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>Laba Bersih Final</h3><p style={{ color: summaryData.laba_bersih_final < 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>{formatToRupiah(summaryData.laba_bersih_final)}</p></div><div className="report-card"><h3>Total Pendapatan</h3><p>{formatToRupiah(summaryData.total_pendapatan)}</p></div><div className="report-card"><h3>Total Pengeluaran</h3><p style={{ color: '#e74c3c' }}>{formatToRupiah(summaryData.total_pengeluaran)}</p></div><div className="report-card"><h3>Beban Operasional</h3><p>{formatToRupiah(summaryData.total_beban_operasional)}</p></div></div>{currentUser && currentUser.role !== 'kasir' && (<div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}><div><h2>Tambah Pemasukan</h2><form onSubmit={(e) => { e.preventDefault(); handleApiSubmit('/transactions/', { customer_name: txCustomerName, description: txDesc, revenue: parseFloat(txRevenue), cost_of_goods: parseFloat(txCost) || 0, technician_name: txTechnician || null, commission_percentage: parseFloat(txCommission) || null, work_category: txWorkCategory, device_category: txDeviceCategory, part_category: txPartCategory }, () => { setTxCustomerName(''); setTxDesc(''); setTxRevenue(''); setTxCost(''); setTxTechnician(''); setTxCommission(''); setTxWorkCategory(''); setTxDeviceCategory(''); setTxPartCategory(''); }); }} className="form-section"><input type="text" placeholder="Nama Pelanggan (Opsional)" value={txCustomerName} onChange={e => setTxCustomerName(e.target.value)} /><select value={txDeviceCategory} onChange={handleDeviceCategoryChange} required><option value="">-- Pilih Kategori Perangkat --</option>{deviceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select><select value={txPartCategory} onChange={e => setTxPartCategory(e.target.value)} required disabled={!txDeviceCategory}><option value="">-- Pilih Kategori Part/Servis --</option>{txDeviceCategory && partsCategoriesMap[txDeviceCategory]?.map(part => (<option key={part} value={part}>{part}</option>))}</select><input type="text" placeholder="Deskripsi Detail" value={txDesc} onChange={e => setTxDesc(e.target.value)} required /><input type="text" placeholder="Pendapatan (Rp)" value={formatToRupiah(txRevenue)} onChange={e => handleNumericInputChange(e.target.value, setTxRevenue)} required /><small style={{color: '#95a5a6', marginTop: '-10px', marginBottom: '10px', display: 'block'}}>Total yg dibayar customer</small><input type="text" placeholder="Modal (Rp)" value={formatToRupiah(txCost)} onChange={e => handleNumericInputChange(e.target.value, setTxCost)} /><small style={{color: '#95a5a6', marginTop: '-10px', marginBottom: '10px', display: 'block'}}>Harga beli part/barang</small><input type="text" placeholder="Nama Teknisi (Opsional)" value={txTechnician} onChange={e => setTxTechnician(e.target.value)} /><input type="number" placeholder="Komisi % (Opsional, cth: 15)" value={txCommission} onChange={e => setTxCommission(e.target.value)} /><button type="submit">Tambah</button></form></div><div><h2>Tambah Beban Operasional</h2><form onSubmit={(e) => { e.preventDefault(); handleApiSubmit('/expenses/', { description: exDesc, amount: parseFloat(exAmount) }, () => { setExDesc(''); setExAmount(''); }); }} className="form-section"><input type="text" placeholder="Deskripsi (cth: Upah Mario)" value={exDesc} onChange={e => setExDesc(e.target.value)} required /><input type="text" placeholder="Jumlah (Rp)" value={formatToRupiah(exAmount)} onChange={e => handleNumericInputChange(e.target.value, setExAmount)} required /><button type="submit">Tambah</button></form></div><div><h2>Tambah Pembelanjaan Stok</h2><form onSubmit={(e) => { e.preventDefault(); handleApiSubmit('/stock-purchases/', { description: spDesc, amount: parseFloat(spAmount) }, () => { setSpDesc(''); setSpAmount(''); }); }} className="form-section"><input type="text" placeholder="Nama Barang (cth: Baterai Lenovo)" value={spDesc} onChange={e => setSpDesc(e.target.value)} required /><input type="text" placeholder="Harga Beli (Rp)" value={formatToRupiah(spAmount)} onChange={e => handleNumericInputChange(e.target.value, setSpAmount)} required /><button type="submit">Tambah</button></form></div></div>)}<h2>Detail Pemasukan Hari Ini</h2><div className="table-container"><table><thead><tr><th>Pelanggan</th><th>Deskripsi</th><th>Pendapatan</th><th>Metode Bayar</th><th>Modal</th><th>Teknisi</th><th>Komisi %</th><th>Pemasukan Teknisi</th>{currentUser && currentUser.role !== 'kasir' && (<th style={{width: '120px'}}>Aksi</th>)}</tr></thead><tbody>{dailyDetails.transactions.map(tx => { const keuntungan = tx.revenue - tx.cost_of_goods; const komisiRp = tx.commission_percentage && keuntungan > 0 ? (keuntungan * (tx.commission_percentage / 100)) : 0; return (<tr key={tx.id}><td>{tx.customer_name || '-'}</td><td>{tx.description}</td><td>{formatToRupiah(tx.revenue)}</td><td>{tx.payment_method || 'Tunai'}</td><td>{formatToRupiah(tx.cost_of_goods)}</td><td>{tx.technician_name || '-'}</td><td>{tx.commission_percentage ? `${tx.commission_percentage}%` : '-'}</td><td>{formatToRupiah(komisiRp)}</td>{currentUser && currentUser.role !== 'kasir' && (<td className="action-button-container"><button onClick={() => handleOpenEditModal(tx, 'transactions')} className="action-button edit-button"><FiEdit /></button><button onClick={() => handleDelete('transactions', tx.id)} className="action-button delete-button"><FiTrash2 /></button></td>)}</tr>); })}</tbody></table></div>{currentUser && currentUser.role !== 'kasir' && (<><h2 style={{ marginTop: '30px' }}>Detail Beban Operasional Hari Ini</h2><div className="table-container"><table><thead><tr><th>Deskripsi</th><th>Jumlah</th><th style={{width: '120px'}}>Aksi</th></tr></thead><tbody>{dailyDetails.expenses.map(ex => (<tr key={ex.id}><td>{ex.description}</td><td>{formatToRupiah(ex.amount)}</td><td className="action-button-container"><button onClick={() => handleOpenEditModal(ex, 'expenses')} className="action-button edit-button"><FiEdit /></button><button onClick={() => handleDelete('expenses', ex.id)} className="action-button delete-button"><FiTrash2 /></button></td></tr>))}</tbody></table></div><h2 style={{ marginTop: '30px' }}>Detail Pembelanjaan Stok Hari Ini</h2><div className="table-container"><table><thead><tr><th>Deskripsi</th><th>Jumlah</th><th style={{width: '120px'}}>Aksi</th></tr></thead><tbody>{dailyDetails.stock_purchases.map(sp => (<tr key={sp.id}><td>{sp.description}</td><td>{formatToRupiah(sp.amount)}</td><td className="action-button-container"><button onClick={() => handleOpenEditModal(sp, 'stock-purchases')} className="action-button edit-button"><FiEdit /></button><button onClick={() => handleDelete('stock-purchases', sp.id)} className="action-button delete-button"><FiTrash2 /></button></td></tr>))}</tbody></table></div></>)}</>); };
  
  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        <h1>{getTitle()}</h1>
        
        <div className="filter-controls">
          <div className="filter-item">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              disabled={currentUser && currentUser.role === 'kasir'}
              style={{ cursor: (currentUser && currentUser.role === 'kasir') ? 'not-allowed' : 'pointer' }}
            />
          </div>
          
          {currentUser && currentUser.role !== 'kasir' && (
            <>
              <button onClick={() => setShowImportModal(true)} className="btn btn-warning">
                Import Data
              </button>
              <button onClick={handleExportXLSX} className="btn btn-success">
                Download Laporan
              </button>
            </>
          )}

          <button onClick={onLogout} className="btn btn-danger">
            Logout
          </button>
        </div>
      </div>
      
      {renderContent()}
      
      {editingItem && ( <EditModal token={token} item={editingItem} type={modalType} onClose={handleCloseEditModal} onSave={handleSaveEdit} /> )}
      {showImportModal && ( <ImportModal token={token} onClose={() => setShowImportModal(false)} onImportSuccess={() => { setShowImportModal(false); fetchData(); }} /> )}
    </div>
  );
}

export default DashboardPage;