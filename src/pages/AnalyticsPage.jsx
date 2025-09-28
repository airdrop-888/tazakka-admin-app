// frontend/src/pages/AnalyticsPage.jsx (Lengkap dengan Penyempurnaan Final)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatToRupiah, getLocalDate } from '../utils';
import { FiTrendingUp, FiArrowDownCircle, FiDollarSign, FiArchive, FiBriefcase, FiGift } from 'react-icons/fi';

// --- PERBAIKAN 1: CUSTOM HOOK UNTUK DETEKSI MOBILE YANG REAKTIF ---
// Hook ini akan memantau perubahan ukuran layar dan memberi tahu komponen kita.
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);
  return matches;
};

// Tooltip kustom untuk BarChart agar lebih rapi
const CustomBarChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '14px' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#2c3e50' }}>{label}</p>
        {payload.slice().reverse().map((pld, index) => (
          <p key={index} style={{ color: pld.fill, margin: '4px 0' }}>
            {`${pld.dataKey}: ${formatToRupiah(pld.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function AnalyticsPage() {
  // ... (State lainnya tetap sama)
  const [view, setView] = useState('monthly');
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const months = useMemo(() => Array.from({length: 12}, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) })), []);
  const years = useMemo(() => Array.from({length: 5}, (_, i) => new Date().getFullYear() - i), []);
  const PIE_CHART_COLORS = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#34495e'];
  
  // --- PERBAIKAN 2: GUNAKAN CUSTOM HOOK ---
  const isMobile = useMediaQuery('(max-width: 680px)');

  // Semua logika fetchData dan lainnya tetap sama persis
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let startDate, endDate;
      if (view === 'weekly') {
        const date = new Date(selectedDate);
        date.setUTCHours(0, 0, 0, 0);
        startDate = new Date(date);
        startDate.setDate(date.getDate() - 6);
        endDate = new Date(selectedDate);
        endDate.setUTCHours(23, 59, 59, 999);
      } else if (view === 'monthly') {
        startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
        endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999));
      } else { // annual
        startDate = new Date(Date.UTC(selectedYear, 0, 1));
        endDate = new Date(Date.UTC(selectedYear, 11, 31, 23, 59, 59, 999));
      }
      const [transactionsRes, expensesRes, stockPurchasesRes] = await Promise.all([
        supabase.from('transactions').select('*').gte('transaction_date', startDate.toISOString()).lte('transaction_date', endDate.toISOString()),
        supabase.from('operational_expenses').select('*').gte('expense_date', startDate.toISOString()).lte('expense_date', endDate.toISOString()),
        supabase.from('stock_purchases').select('*').gte('purchase_date', startDate.toISOString()).lte('purchase_date', endDate.toISOString())
      ]);
      if (transactionsRes.error) throw transactionsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (stockPurchasesRes.error) throw stockPurchasesRes.error;
      const transactions = transactionsRes.data || [];
      const expenses = expensesRes.data || [];
      const stockPurchases = stockPurchasesRes.data || [];
      const total_pendapatan = transactions.reduce((sum, tx) => sum + (tx.revenue || 0), 0);
      const total_modal = transactions.reduce((sum, tx) => sum + (tx.cost_of_goods || 0), 0);
      const total_beban_operasional = expenses.reduce((sum, ex) => sum + (ex.amount || 0), 0);
      const total_pembelanjaan_stok = stockPurchases.reduce((sum, sp) => sum + (sp.amount || 0), 0);
      const laba_kotor = total_pendapatan - total_modal;
      const total_komisi = transactions.reduce((sum, tx) => {
          const profit = (tx.revenue || 0) - (tx.cost_of_goods || 0);
          const commission = (profit * (tx.commission_percentage || 0)) / 100;
          return sum + commission;
      }, 0);
      const total_pengeluaran_non_modal = total_beban_operasional + total_pembelanjaan_stok;
      const laba_bersih_final = total_pendapatan - total_modal - total_komisi - total_beban_operasional;
      setSummaryData({ 
          total_pendapatan, laba_kotor, total_modal, total_beban_operasional,
          total_pembelanjaan_stok, total_komisi, laba_bersih_final,
          total_pengeluaran: total_pengeluaran_non_modal,
      });
      const categoryData = transactions.reduce((acc, tx) => {
        const category = tx.device_category || 'Lainnya';
        acc[category] = (acc[category] || 0) + (tx.revenue || 0);
        return acc;
      }, {});
      let trendData;
      if (view === 'annual') {
        trendData = months.map(m => ({ name: m.label.substring(0, 3), Pendapatan: 0, "Laba Bersih": 0 }));
        transactions.forEach(tx => {
            const monthIndex = new Date(tx.transaction_date).getMonth();
            const revenue = tx.revenue || 0;
            const cogs = tx.cost_of_goods || 0;
            const commission = (revenue - cogs) * ((tx.commission_percentage || 0) / 100);
            trendData[monthIndex].Pendapatan += revenue;
            trendData[monthIndex]["Laba Bersih"] += (revenue - cogs - commission);
        });
        expenses.forEach(ex => {
            const monthIndex = new Date(ex.expense_date).getMonth();
            trendData[monthIndex]["Laba Bersih"] -= (ex.amount || 0);
        });
      } else {
        const dailyData = {};
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayKey = currentDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            dailyData[dayKey] = { name: dayKey, Pendapatan: 0, "Laba Bersih": 0 };
            currentDate.setDate(currentDate.getDate() + 1);
        }
        transactions.forEach(tx => {
            const dayKey = new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            if(dailyData[dayKey]) {
              const revenue = tx.revenue || 0;
              const cogs = tx.cost_of_goods || 0;
              const commission = (revenue - cogs) * ((tx.commission_percentage || 0) / 100);
              dailyData[dayKey].Pendapatan += revenue;
              dailyData[dayKey]["Laba Bersih"] += (revenue - cogs - commission);
            }
        });
        expenses.forEach(ex => {
            const dayKey = new Date(ex.expense_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            if(dailyData[dayKey]) dailyData[dayKey]["Laba Bersih"] -= (ex.amount || 0);
        });
        trendData = Object.values(dailyData);
      }
      setChartData({
          category: Object.entries(categoryData).map(([name, value]) => ({ name, value })),
          trend: trendData
      });
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError('Gagal memuat data analitik. Periksa koneksi Anda.');
    } finally { 
      setLoading(false); 
    }
  }, [view, selectedDate, selectedMonth, selectedYear, months]);
  
  useEffect(() => { fetchData(); }, [fetchData]);

  const getTitle = () => {
    if (view === 'weekly') return `Ringkasan Laporan Mingguan`;
    if (view === 'monthly') return `Ringkasan Laporan Bulan ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
    if (view === 'annual') return `Ringkasan Laporan Tahun ${selectedYear}`;
    return "Halaman Analytics";
  };
  
  const renderContent = () => {
    if (loading) return <p>Memuat data analitik...</p>;
    if (error) return <p className="error">{error}</p>;
    if (!summaryData || !chartData) return <p>Tidak ada data untuk ditampilkan pada rentang waktu ini.</p>;
    
    return (
        <>
            <div className="charts-grid">
                <div className="chart-container">
                    <h3 className="chart-title">{view === 'annual' ? `Tren Bulanan ${selectedYear}` : `Tren Harian`}</h3>
                    {/* --- PERBAIKAN 3: KEMBALIKAN KE VERSI SEBELUMNYA DAN BIARKAN CSS YANG BEKERJA --- */}
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.trend} margin={{ top: 5, right: 20, left: 5, bottom: 5 }} >
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            {/* Logika XAxis disederhanakan, tidak perlu memutar teks lagi */}
                            <XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 12 }} dy={5} />
                            <YAxis tickFormatter={(value) => value >= 1000000 ? `${value / 1000000}jt` : `${value / 1000}k`} tick={{ fontSize: 12 }} width={50} />
                            <Tooltip content={<CustomBarChartTooltip />} cursor={{ fill: 'rgba(233, 236, 239, 0.5)' }}/>
                            <Legend wrapperStyle={{paddingTop: '20px'}} />
                            <Bar dataKey="Pendapatan" fill="#3498db" />
                            <Bar dataKey="Laba Bersih" fill="#2ecc71" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-container">
                    <h3 className="chart-title">Pendapatan per Kategori</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={chartData.category} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 90 : 120} label={!isMobile} >
                                {chartData.category.map((entry, index) => ( <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} /> ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatToRupiah(value)} />
                            <Legend layout={isMobile ? 'horizontal' : 'vertical'} verticalAlign={isMobile ? 'bottom' : 'middle'} align={isMobile ? 'center' : 'right'} wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <h2 style={{ marginTop: '40px' }}>Ringkasan Keuangan</h2>
            <div className="stats-grid">
                 <div className="stat-card"><div className="stat-card-icon" style={{ backgroundColor: summaryData.laba_bersih_final < 0 ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)', color: summaryData.laba_bersih_final < 0 ? '#e74c3c' : '#2ecc71' }}><FiDollarSign /></div><div className="stat-card-info"><p className="stat-card-title">Laba Bersih Final</p><h3 className="stat-card-value">{formatToRupiah(summaryData.laba_bersih_final)}</h3></div></div>
                <div className="stat-card"><div className="stat-card-icon" style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}><FiTrendingUp /></div><div className="stat-card-info"><p className="stat-card-title">Total Pendapatan</p><h3 className="stat-card-value">{formatToRupiah(summaryData.total_pendapatan)}</h3></div></div>
                <div className="stat-card"><div className="stat-card-icon" style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}><FiBriefcase /></div><div className="stat-card-info"><p className="stat-card-title">Laba Kotor</p><h3 className="stat-card-value">{formatToRupiah(summaryData.laba_kotor)}</h3></div></div>
                <div className="stat-card"><div className="stat-card-icon" style={{ backgroundColor: 'rgba(230, 126, 34, 0.1)', color: '#e67e22' }}><FiArchive /></div><div className="stat-card-info"><p className="stat-card-title">Total Modal (HPP)</p><h3 className="stat-card-value">{formatToRupiah(summaryData.total_modal)}</h3></div></div>
                <div className="stat-card"><div className="stat-card-icon" style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}><FiArrowDownCircle /></div><div className="stat-card-info"><p className="stat-card-title">Beban Operasional</p><h3 className="stat-card-value">{formatToRupiah(summaryData.total_beban_operasional)}</h3></div></div>
                <div className="stat-card"><div className="stat-card-icon" style={{ backgroundColor: 'rgba(142, 68, 173, 0.1)', color: '#8e44ad' }}><FiGift /></div><div className="stat-card-info"><p className="stat-card-title">Total Komisi</p><h3 className="stat-card-value">{formatToRupiah(summaryData.total_komisi)}</h3></div></div>
            </div>
        </>
    );
  };

  return (
    <div className="container">
      <header className="analytics-header">
        <h1>{getTitle()}</h1>
        <div className="analytics-filters">
            {view === 'weekly' && ( <div className="filter-item"> <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} /> </div> )}
            {view === 'monthly' && (
              <div className="analytics-date-filters">
                <div className="filter-item"> <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}> {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)} </select> </div>
                <div className="filter-item"> <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}> {years.map(y => <option key={y} value={y}>{y}</option>)} </select> </div>
              </div>
            )}
            {view === 'annual' && ( <div className="filter-item"> <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}> {years.map(y => <option key={y} value={y}>{y}</option>)} </select> </div> )}
            <div className="view-toggle-buttons">
                <button onClick={() => setView('weekly')} className={view === 'weekly' ? 'active' : ''}>Mingguan</button>
                <button onClick={() => setView('monthly')} className={view === 'monthly' ? 'active' : ''}>Bulanan</button>
                <button onClick={() => setView('annual')} className={view === 'annual' ? 'active' : ''}>Tahunan</button>
            </div>
        </div>
      </header>
      {renderContent()}
    </div>
  );
}

export default AnalyticsPage;