// frontend/src/pages/DashboardPage.jsx (Versi Final dengan Perbaikan Metode Pemformatan Excel dan UI Mobile Responsif)

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import ImportModal from './ImportModal';
import EditModal from './EditItemModal';
import { FiEdit, FiTrash2, FiCopy } from 'react-icons/fi';
import * as XLSX from 'xlsx';

// --- Helper Functions ---
const formatToRupiah = (number) => {
    if (number === null || number === undefined) return 'Rp 0';
    const numericValue = parseInt(String(number).replace(/[^0-9-]/g, ''), 10);
    if (isNaN(numericValue)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericValue);
};

const formatToSimpleNumber = (number) => {
    if (number === null || number === undefined) return '0';
    const numericValue = parseInt(String(number).replace(/[^0-9-]/g, ''), 10);
    if (isNaN(numericValue)) return '0';
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(numericValue);
};

const formatToNumber = (number) => {
    if (number === null || number === undefined) return 0;
    const numericValue = parseInt(String(number).replace(/[^0-9-]/g, ''), 10);
    if (isNaN(numericValue)) return 0;
    return numericValue;
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

  // State baru untuk tab mobile
  const [activeTab, setActiveTab] = useState('pemasukan');

  const deviceCategories = ["Hape", "Laptop", "Printer", "Lainnya"];
  const partsCategoriesMap = { Hape: ["LCD", "Battery", "Papan Charger", "Lainnya"], Laptop: ["LCD", "Battery", "Keyboard", "Lainnya"], Printer: ["Cartridge", "Head", "Lainnya"], Lainnya: ["Jasa", "Penjualan", "Lainnya"] };

  const handleDeviceCategoryChange = (e) => {
    setTxDeviceCategory(e.target.value);
    setTxPartCategory('');
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDate) return;
      
      setLoading(true);
      setError('');
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

        setSummaryData({ 
            total_pendapatan, 
            total_beban_operasional, 
            total_pengeluaran, 
            laba_bersih_final,
            total_modal,
            total_komisi,
            total_pembelanjaan_stok
        });

      } catch (err) {
        setError('Gagal memuat data. Periksa koneksi Anda.');
        console.error("Error di fetchData:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, currentUser]);
  
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

  const handleCopyReport = () => {
    if (!summaryData || !dailyDetails) {
        alert("Data laporan belum dimuat sepenuhnya.");
        return;
    }

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    let reportString = `LAPORAN PEMASUKAN/PENGELUARAN TAZAKKA\n`;
    reportString += `Hari,tgl : ${formattedDate}\n\n`;

    if (dailyDetails.transactions.length > 0) {
        dailyDetails.transactions.forEach((tx, index) => {
            const keuntungan = (tx.revenue || 0) - (tx.cost_of_goods || 0);
            const komisi = (keuntungan * (tx.commission_percentage || 0)) / 100;
            const bersih = keuntungan - komisi;

            reportString += `${index + 1}. ${tx.description}\n`;
            reportString += `Pendapatan: ${formatToSimpleNumber(tx.revenue)}\n`;
            if (tx.cost_of_goods > 0) {
              reportString += `- Modal: ${formatToSimpleNumber(tx.cost_of_goods)}\n`;
            }
            reportString += `Keuntungan: ${formatToSimpleNumber(keuntungan)}\n`;
            if (tx.commission_percentage > 0) {
              reportString += `Upah Teknis ${tx.commission_percentage}%: ${formatToSimpleNumber(komisi)}\n`;
              reportString += `Bersih: ${formatToSimpleNumber(bersih)}\n`;
            }
            reportString += `\n`;
        });
    }

    if (dailyDetails.expenses.length > 0) {
        reportString += `Beban Operasional:\n`;
        dailyDetails.expenses.forEach(ex => {
            reportString += `- ${ex.description} ${formatToSimpleNumber(ex.amount)}\n`;
        });
        reportString += `\n`;
    }
    
    const labaKotor = summaryData.total_pendapatan - summaryData.total_modal;
    reportString += `Total keseluruhan\n`;
    reportString += `- Pendapatan: ${formatToSimpleNumber(summaryData.total_pendapatan)}\n`;
    reportString += `- Modal: ${formatToSimpleNumber(summaryData.total_modal)}\n`;
    reportString += `- Keuntungan (Laba Kotor): ${formatToSimpleNumber(labaKotor)}\n`;
    if (summaryData.total_komisi > 0) {
        reportString += `- Total Komisi Teknisi: ${formatToSimpleNumber(summaryData.total_komisi)}\n`;
    }
    reportString += `- Total Beban Operasional: ${formatToSimpleNumber(summaryData.total_beban_operasional)}\n`;
    reportString += `- Laba Bersih: ${formatToSimpleNumber(summaryData.laba_bersih_final)}\n\n`;

    if (dailyDetails.stockPurchases.length > 0) {
        reportString += `Laporan Pembelanjaan/Pengeluaran\n`;
        reportString += `Hari, tgl : ${formattedDate}\n`;
        let totalPembelanjaan = 0;
        dailyDetails.stockPurchases.forEach(sp => {
            reportString += `- ${sp.description} ${formatToSimpleNumber(sp.amount)}\n`;
            totalPembelanjaan += sp.amount;
        });
        reportString += `Total: ${formatToSimpleNumber(totalPembelanjaan)}\n`;
    }

    navigator.clipboard.writeText(reportString).then(() => {
        alert('Laporan harian berhasil disalin ke clipboard!');
    }).catch(err => {
        alert('Gagal menyalin laporan.');
        console.error('Tidak dapat menyalin teks: ', err);
    });
  };

  const handleExportXLSX = async () => {
    setLoading(true);
    setError('');

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const monthName = dateObj.toLocaleString('id-ID', { month: 'long' }).toUpperCase();
    
    const monthNameForFile = dateObj.toLocaleString('id-ID', { month: 'long' });
    const capitalizedMonthName = monthNameForFile.charAt(0).toUpperCase() + monthNameForFile.slice(1);
    
    const firstDay = new Date(year, month, 1).toISOString();
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    
    try {
        const [transRes, expRes, stockRes] = await Promise.all([
            supabase.from('transactions').select('*').gte('transaction_date', firstDay).lte('transaction_date', lastDay),
            supabase.from('operational_expenses').select('*').gte('expense_date', firstDay).lte('expense_date', lastDay),
            supabase.from('stock_purchases').select('*').gte('purchase_date', firstDay).lte('purchase_date', lastDay)
        ]);

        if (transRes.error) throw transRes.error;
        if (expRes.error) throw expRes.error;
        if (stockRes.error) throw stockRes.error;

        const transactions = transRes.data || [];
        const expenses = expRes.data || [];
        const stockPurchases = stockRes.data || [];

        const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "EAEAEA" } } };
        const rupiahFormat = '"Rp"#,##0';
        
        const totalPendapatanKotor = transactions.reduce((sum, tx) => sum + tx.revenue, 0);
        const totalModal = transactions.reduce((sum, tx) => sum + tx.cost_of_goods, 0);
        const labaKotor = totalPendapatanKotor - totalModal;
        const totalKomisi = transactions.reduce((sum, tx) => sum + (((tx.revenue || 0) - (tx.cost_of_goods || 0)) * (tx.commission_percentage || 0)) / 100, 0);
        const totalBebanOperasional = expenses.reduce((sum, ex) => sum + ex.amount, 0);
        const totalPembelianStok = stockPurchases.reduce((sum, sp) => sum + sp.amount, 0);
        const totalPengeluaranKeseluruhan = totalBebanOperasional + totalPembelianStok;
        const labaBersihFinal = labaKotor - totalKomisi - totalBebanOperasional;

        let pemasukanData = [
            [`LAPORAN PEMASUKAN TAZAKKA - ${monthName} ${year}`],
            [],
            ["RINGKASAN KEUANGAN"],
            ["Total Pendapatan", formatToNumber(totalPendapatanKotor)],
            ["Total Modal Barang", formatToNumber(totalModal)],
            ["Laba Kotor (Pendapatan - Modal)", formatToNumber(labaKotor)],
            ["Total Komisi Teknisi", formatToNumber(totalKomisi)],
            ["Total Beban Operasional", formatToNumber(totalBebanOperasional)],
            ["LABA BERSIH FINAL", formatToNumber(labaBersihFinal)],
            [],
            ["DETAIL PEMASUKAN"],
            ["Tanggal", "Pelanggan", "Deskripsi", "Kategori Perangkat", "Pendapatan", "Modal", "Teknisi", "Jumlah Komisi (Rp)", "Komisi (%)"]
        ];
        transactions.forEach(tx => {
            const commissionAmount = ((tx.revenue || 0) - (tx.cost_of_goods || 0)) * (tx.commission_percentage || 0) / 100;
            pemasukanData.push([
                new Date(tx.transaction_date).toLocaleDateString('id-ID'),
                tx.customer_name,
                tx.description,
                tx.device_category,
                formatToNumber(tx.revenue),
                formatToNumber(tx.cost_of_goods),
                tx.technician_name || '-',
                formatToNumber(commissionAmount),
                tx.commission_percentage || 0
            ]);
        });

        const wsPemasukan = XLSX.utils.aoa_to_sheet(pemasukanData);
        wsPemasukan['!cols'] = [{wch:12}, {wch:20}, {wch:35}, {wch:20}, {wch:15}, {wch:15}, {wch:15}, {wch:18}, {wch:10}];

        const rangePemasukan = XLSX.utils.decode_range(wsPemasukan['!ref']);
        for (let R = rangePemasukan.s.r; R <= rangePemasukan.e.r; ++R) {
            const cellRef = XLSX.utils.encode_cell({c:0, r:R});
            if (!wsPemasukan[cellRef]) continue;
            if (R === 0 || R === 2 || R === 10 || R === 11) {
                for (let C = rangePemasukan.s.c; C <= rangePemasukan.e.c; ++C) {
                    const headerCellRef = XLSX.utils.encode_cell({c:C, r:R});
                    if (wsPemasukan[headerCellRef]) wsPemasukan[headerCellRef].s = headerStyle;
                }
            }
            
            const summaryStartRow = 3; 
            const summaryEndRow = 8;
            const detailStartRow = 12;

            if (R >= summaryStartRow && R <= summaryEndRow) {
                const cell = wsPemasukan[XLSX.utils.encode_cell({ c: 1, r: R })];
                if (cell && cell.t === 'n') cell.z = rupiahFormat;
            }

            if (R >= detailStartRow) {
                const detailCurrencyCols = [4, 5, 7];
                for (const C of detailCurrencyCols) {
                    const cell = wsPemasukan[XLSX.utils.encode_cell({ c: C, r: R })];
                    if (cell && cell.t === 'n') cell.z = rupiahFormat;
                }
            }
        }

        let pengeluaranData = [
            [`LAPORAN PENGELUARAN TAZAKKA - ${monthName} ${year}`],
            [],
            ["RINGKASAN PENGELUARAN"],
            ["Total Beban Operasional", formatToNumber(totalBebanOperasional)],
            ["Total Pembelanjaan Stok", formatToNumber(totalPembelianStok)],
            ["TOTAL PENGELUARAN KESELURUHAN", formatToNumber(totalPengeluaranKeseluruhan)],
            [],
            ["DETAIL BEBAN OPERASIONAL"],
            ["Tanggal", "Deskripsi", "Jumlah"]
        ];
        expenses.forEach(ex => {
            pengeluaranData.push([ new Date(ex.expense_date).toLocaleDateString('id-ID'), ex.description, formatToNumber(ex.amount) ]);
        });
        pengeluaranData.push([]);
        pengeluaranData.push(["DETAIL PEMBELANJAAN STOK"]);
        pengeluaranData.push(["Tanggal", "Deskripsi", "Jumlah"]);
        stockPurchases.forEach(sp => {
            pengeluaranData.push([ new Date(sp.purchase_date).toLocaleDateString('id-ID'), sp.description, formatToNumber(sp.amount) ]);
        });

        const wsPengeluaran = XLSX.utils.aoa_to_sheet(pengeluaranData);
        wsPengeluaran['!cols'] = [{wch:12}, {wch:35}, {wch:15}];

        const rangePengeluaran = XLSX.utils.decode_range(wsPengeluaran['!ref']);
        for (let R = rangePengeluaran.s.r; R <= rangePengeluaran.e.r; ++R) {
            const cellRef = XLSX.utils.encode_cell({c:0, r:R});
            if (!wsPengeluaran[cellRef]) continue;
            
            if (R === 0 || R === 2 || R === 7 || R === 8 + expenses.length + 1 || R === 8 + expenses.length + 2) {
                 for (let C = rangePengeluaran.s.c; C <= rangePengeluaran.e.c; ++C) {
                    const headerCellRef = XLSX.utils.encode_cell({c:C, r:R});
                    if (wsPengeluaran[headerCellRef]) wsPengeluaran[headerCellRef].s = headerStyle;
                }
            }
            
            if (R >= 3 && R <= 5) {
                const cell = wsPengeluaran[XLSX.utils.encode_cell({ c: 1, r: R })];
                if (cell && cell.t === 'n') cell.z = rupiahFormat;
            }
            
            const detailBebanStart = 9;
            const detailStokStart = detailBebanStart + expenses.length + 2;
            if ((R >= detailBebanStart && R < detailBebanStart + expenses.length) || (R >= detailStokStart && R < detailStokStart + stockPurchases.length)) {
                 const cell = wsPengeluaran[XLSX.utils.encode_cell({ c: 2, r: R })];
                 if (cell && cell.t === 'n') cell.z = rupiahFormat;
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, wsPemasukan, "PEMASUKAN");
        XLSX.utils.book_append_sheet(workbook, wsPengeluaran, "PENGELUARAN");
        
        XLSX.writeFile(workbook, `Laporan_Bulanan-${capitalizedMonthName}-${year}.xlsx`);

    } catch (err) {
        setError("Gagal mengunduh file laporan: " + err.message);
    } finally {
        setLoading(false);
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

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        <h1>{getTitle()}</h1>
        <div className="filter-controls">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          <button onClick={handleCopyReport} className="btn btn-info" title="Salin Laporan Harian">
            <FiCopy style={{ marginRight: '5px' }} /> Copy Laporan
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
            
            {currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && (
              <>
                {/* === Wrapper untuk Form Desktop === */}
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

                {/* === Wrapper untuk Form Mobile dengan Tabs === */}
                <div className="forms-wrapper-mobile">
                    <div className="form-tabs">
                        <button onClick={() => setActiveTab('pemasukan')} className={activeTab === 'pemasukan' ? 'active' : ''}>Pemasukan</button>
                        <button onClick={() => setActiveTab('beban')} className={activeTab === 'beban' ? 'active' : ''}>Beban</button>
                        <button onClick={() => setActiveTab('stok')} className={activeTab === 'stok' ? 'active' : ''}>Stok</button>
                    </div>
                    <div className="form-content-mobile">
                        {activeTab === 'pemasukan' && (
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
                        )}
                        {activeTab === 'beban' && (
                            <div>
                                <h2>Tambah Beban Operasional</h2>
                                <form onSubmit={handleAddExpense} className="form-section">
                                    <input type="text" placeholder="Deskripsi (misal: Bayar Listrik)" value={exDesc} onChange={e => setExDesc(e.target.value)} required />
                                    <input type="text" placeholder="Jumlah (Rp)" value={formatToRupiah(exAmount)} onChange={e => handleNumericInputChange(e.target.value, setExAmount)} required />
                                    <button type="submit" className="btn">Tambah Beban</button>
                                </form>
                            </div>
                        )}
                        {activeTab === 'stok' && (
                            <div>
                                <h2>Tambah Pembelanjaan Stok</h2>
                                <form onSubmit={handleAddStockPurchase} className="form-section">
                                    <input type="text" placeholder="Deskripsi (misal: Beli LCD Samsung)" value={spDesc} onChange={e => setSpDesc(e.target.value)} required />
                                    <input type="text" placeholder="Jumlah (Rp)" value={formatToRupiah(spAmount)} onChange={e => handleNumericInputChange(e.target.value, setSpAmount)} required />
                                    <button type="submit" className="btn">Tambah Belanja</button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
              </>
            )}

            <h2 style={{ marginTop: '40px' }}>Detail Pemasukan Hari Ini</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Deskripsi</th>
                    <th>Pelanggan</th>
                    <th>Pendapatan</th>
                    {currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && (
                        <>
                            <th>Modal</th>
                            <th>Teknisi</th>
                            <th>Komisi</th>
                            <th>Aksi</th>
                        </>
                    )}
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
                    <thead>
                        <tr>
                            <th>Deskripsi</th>
                            <th>Jumlah</th>
                            {currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && (
                                <th>Aksi</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {dailyDetails.expenses.map(ex => (
                            <tr key={ex.id}>
                                <td data-label="Deskripsi">{ex.description}</td>
                                <td data-label="Jumlah">{formatToRupiah(ex.amount)}</td>
                                {currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && (
                                    <td data-label="Aksi">
                                        <button onClick={() => handleOpenEditModal(ex, 'expenses')} className="btn-icon" title="Edit"><FiEdit /></button>
                                        <button onClick={() => handleDelete('expenses', ex.id)} className="btn-icon btn-delete" title="Hapus"><FiTrash2 /></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <h2 style={{ marginTop: '30px' }}>Detail Pembelanjaan Stok Hari Ini</h2>
                <div className="table-container">
                  <table>
                    <thead>
                        <tr>
                            <th>Deskripsi</th>
                            <th>Jumlah</th>
                            {currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && (
                                <th>Aksi</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {dailyDetails.stockPurchases.map(sp => (
                            <tr key={sp.id}>
                                <td data-label="Deskripsi">{sp.description}</td>
                                <td data-label="Jumlah">{formatToRupiah(sp.amount)}</td>
                                {currentUser && (currentUser.role === 'pengelola' || currentUser.role === 'admin') && (
                                    <td data-label="Aksi">
                                        <button onClick={() => handleOpenEditModal(sp, 'stock_purchases')} className="btn-icon" title="Edit"><FiEdit /></button>
                                        <button onClick={() => handleDelete('stock_purchases', sp.id)} className="btn-icon btn-delete" title="Hapus"><FiTrash2 /></button>
                                    </td>
                                )}
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