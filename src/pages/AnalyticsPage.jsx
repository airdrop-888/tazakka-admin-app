// frontend/src/pages/AnalyticsPage.jsx (KODE FINAL DENGAN DEFAULT TANGGAL SAAT INI DAN UI MOBILE RESPONSIVE)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrasi komponen dan plugin ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ChartDataLabels);

// Helper function untuk format Rupiah
const formatToRupiah = (number) => {
    if (number === null || number === undefined) return 'Rp 0';
    const numericValue = parseInt(String(number).replace(/[^0-9-]/g, ''), 10);
    if (isNaN(numericValue)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericValue);
};

// Helper function untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
const getLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function AnalyticsPage() {
  const [view, setView] = useState('monthly');
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedDate, setSelectedDate] = useState(getLocalDate()); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); 

  const months = Array.from({length: 12}, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      let startDate, endDate;
      if (view === 'weekly') {
        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0);
        startDate = new Date(date);
        startDate.setDate(date.getDate() - 6);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (view === 'monthly') {
        startDate = new Date(selectedYear, selectedMonth - 1, 1);
        endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
      } else { // annual
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
      }

      const [transactionsRes, expensesRes] = await Promise.all([
        supabase.from('transactions').select('*').gte('transaction_date', startDate.toISOString()).lte('transaction_date', endDate.toISOString()),
        supabase.from('operational_expenses').select('*').gte('expense_date', startDate.toISOString()).lte('expense_date', endDate.toISOString())
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      
      const transactions = transactionsRes.data || [];
      const expenses = expensesRes.data || [];
      
      const total_pendapatan = transactions.reduce((sum, tx) => sum + (tx.revenue || 0), 0);
      const total_modal_terjual = transactions.reduce((sum, tx) => sum + (tx.cost_of_goods || 0), 0);
      const total_beban_operasional = expenses.reduce((sum, ex) => sum + (ex.amount || 0), 0);
      const laba_kotor = total_pendapatan - total_modal_terjual;

      const total_komisi = transactions.reduce((sum, tx) => {
          const revenue = tx.revenue || 0;
          const cogs = tx.cost_of_goods || 0;
          const profit = revenue - cogs;
          const commissionPercentage = tx.commission_percentage || 0;
          const commission = profit > 0 ? profit * (commissionPercentage / 100) : 0;
          return sum + commission;
      }, 0);

      const total_pengeluaran_keseluruhan = total_modal_terjual + total_beban_operasional + total_komisi;
      const laba_bersih_final = laba_kotor - total_beban_operasional - total_komisi;

      setSummaryData({ 
          total_pendapatan,
          laba_kotor,
          total_modal_terjual,
          total_beban_operasional,
          total_komisi,
          laba_bersih_final,
          total_pengeluaran: total_pengeluaran_keseluruhan,
      });

      const categoryData = transactions.reduce((acc, tx) => {
        const category = tx.device_category || 'Lainnya';
        acc[category] = (acc[category] || 0) + tx.revenue;
        return acc;
      }, {});
      
      let trendLabels = [];
      let trendPendapatan = [];
      let trendLaba = [];

      if (view === 'annual') {
        trendLabels = months.map(m => m.label.substring(0, 3));
        const monthlyData = Array(12).fill(0).map(() => ({ revenue: 0, cogs: 0, operationalCost: 0, commission: 0 }));

        transactions.forEach(tx => {
            const monthIndex = new Date(tx.transaction_date).getMonth();
            const revenue = tx.revenue || 0;
            const cogs = tx.cost_of_goods || 0;
            const profit = revenue - cogs;
            const commissionPercentage = tx.commission_percentage || 0;

            monthlyData[monthIndex].revenue += revenue;
            monthlyData[monthIndex].cogs += cogs;
            if (profit > 0) {
                monthlyData[monthIndex].commission += profit * (commissionPercentage / 100);
            }
        });

        expenses.forEach(ex => {
            const monthIndex = new Date(ex.expense_date).getMonth();
            monthlyData[monthIndex].operationalCost += (ex.amount || 0);
        });
        
        trendPendapatan = monthlyData.map(m => m.revenue);
        trendLaba = monthlyData.map(m => (m.revenue - m.cogs) - m.operationalCost - m.commission);
      
      } else {
        const dailyData = {};
        let currentDate = new Date(startDate);
        let finalEndDate = new Date(endDate);
        finalEndDate.setHours(23, 59, 59, 999);

        while (currentDate <= finalEndDate) {
            const dayKey = currentDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            dailyData[dayKey] = { revenue: 0, cogs: 0, operationalCost: 0, commission: 0 };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        transactions.forEach(tx => {
            const dayKey = new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            if (dailyData[dayKey]) {
              const revenue = tx.revenue || 0;
              const cogs = tx.cost_of_goods || 0;
              const profit = revenue - cogs;
              const commissionPercentage = tx.commission_percentage || 0;

              dailyData[dayKey].revenue += revenue;
              dailyData[dayKey].cogs += cogs;
              if(profit > 0) {
                dailyData[dayKey].commission += profit * (commissionPercentage / 100);
              }
            }
        });
        
        expenses.forEach(ex => {
            const dayKey = new Date(ex.expense_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
             if (dailyData[dayKey]) {
              dailyData[dayKey].operationalCost += (ex.amount || 0);
            }
        });

        trendLabels = Object.keys(dailyData);
        trendPendapatan = Object.values(dailyData).map(d => d.revenue);
        trendLaba = Object.values(dailyData).map(d => (d.revenue - d.cogs) - d.operationalCost - d.commission);
      }
      
      setChartData({
          category: {
            labels: Object.keys(categoryData),
            datasets: [{ 
                label: 'Pendapatan per Kategori',
                data: Object.values(categoryData), 
                backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] 
            }]
          },
          trend: {
            labels: trendLabels,
            datasets: [
              { label: 'Pendapatan', data: trendPendapatan, backgroundColor: 'rgba(54, 162, 235, 0.6)' },
              { label: 'Laba Bersih', data: trendLaba, backgroundColor: 'rgba(40, 167, 69, 0.6)' }
            ]
          }
      });

    } catch (err) {
      setError('Gagal memuat data. Periksa koneksi Anda.');
      console.error('Fetch error:', err);
    } finally { 
      setLoading(false); 
    }
  }, [view, selectedDate, selectedMonth, selectedYear]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const getTitle = () => {
    if (loading && !summaryData) return "Memuat Analytics...";
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (view === 'weekly') return `Ringkasan 7 Hari Terakhir (Hingga ${formattedDate})`;
    if (view === 'monthly') return `Ringkasan Laporan Bulan ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
    if (view === 'annual') return `Ringkasan Laporan Tahun ${selectedYear}`;
    return "Halaman Analytics";
  };

  const renderFilters = () => {
    return (
      <div className="filter-controls">
        {view === 'weekly' && ( <div className="filter-item"> <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} /> </div> )}
        {view === 'monthly' && (
          <div className="analytics-date-filters">
            <div className="filter-item"> <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}> {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)} </select> </div>
            <div className="filter-item"> <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}> {years.map(y => <option key={y} value={y}>{y}</option>)} </select> </div>
          </div>
        )}
        {view === 'annual' && ( <div className="filter-item"> <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}> {years.map(y => <option key={y} value={y}>{y}</option>)} </select> </div> )}
      </div>
    );
  };
  
  const renderContent = () => {
    if (loading) return <p>Memuat data...</p>;
    if (error) return <p className="error">{error}</p>;
    if (!summaryData || !chartData) return <p>Tidak ada data untuk ditampilkan pada rentang waktu ini.</p>;
    
    const isMobile = window.innerWidth <= 768;

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            datalabels: { display: false },
            legend: {
                position: isMobile ? 'bottom' : 'top',
            }
        },
        scales: {
            x: {
                ticks: {
                    // === PERBAIKAN UTAMA DI SINI ===
                    autoSkip: true,       // Izinkan Chart.js untuk melewati beberapa label
                    maxTicksLimit: isMobile ? 8 : 31, // Batasi jumlah maksimum label di mobile
                    maxRotation: 90, 
                    minRotation: 90,
                }
            },
            y: {
                ticks: {
                    // Format angka menjadi lebih ringkas (misal: 10jt)
                    callback: function(value) {
                        if (value >= 1000000) {
                            return (value / 1000000) + 'jt';
                        }
                        return formatToRupiah(value).replace('Rp', '').trim();
                    }
                }
            }
        }
    };

    const doughnutChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: isMobile ? 'bottom' : 'right', 
            },
            datalabels: {
                formatter: (value, context) => {
                    let sum = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    if (sum === 0) return '0.00%';
                    let percentage = (value * 100 / sum).toFixed(2) + "%";
                    return percentage;
                },
                color: '#fff',
            }
        },
    };

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '30px' }}>
                <div className="chart-container">
                    <h3 className="chart-title">{view === 'annual' ? `Tren Bulanan ${selectedYear}` : `Tren Harian`}</h3>
                    <div className="chart-wrapper" style={{height: '350px', position: 'relative'}}>
                      <Bar options={barChartOptions} data={chartData.trend} />
                    </div>
                </div>
                <div className="chart-container">
                    <h3 className="chart-title">Pendapatan per Kategori</h3>
                    <div className="chart-wrapper" style={{height: '300px', position: 'relative'}}>
                      <Doughnut options={doughnutChartOptions} data={chartData.category} />
                    </div>
                </div>
            </div>

            <h2>Ringkasan Keuangan</h2>
            <div className="report-grid">
              <div className="report-card primary-card">
                <h3 style={{color: summaryData.laba_bersih_final < 0 ? '#e74c3c' : '#27ae60' }}>Laba Bersih Final</h3>
                <p style={{ color: summaryData.laba_bersih_final < 0 ? '#e74c3c' : '#27ae60' }}>{formatToRupiah(summaryData.laba_bersih_final)}</p>
              </div>
              <div className="report-card">
                <h3>Total Pendapatan</h3>
                <p style={{ color: '#2980b9' }}>{formatToRupiah(summaryData.total_pendapatan)}</p>
              </div>
              <div className="report-card">
                <h3>Laba Kotor</h3>
                <p style={{ color: '#27ae60' }}>{formatToRupiah(summaryData.laba_kotor)}</p>
              </div>
               <div className="report-card">
                <h3>Total Modal (HPP)</h3>
                <p style={{ color: '#e67e22' }}>{formatToRupiah(summaryData.total_modal_terjual)}</p>
              </div>
              <div className="report-card">
                <h3>Beban Operasional</h3>
                <p style={{ color: '#c0392b' }}>{formatToRupiah(summaryData.total_beban_operasional)}</p>
              </div>
              <div className="report-card">
                <h3>Total Komisi</h3>
                <p style={{ color: '#c0392b' }}>{formatToRupiah(summaryData.total_komisi)}</p>
              </div>
            </div>
        </>
    );
  };

  return (
    <div className="container analytics-page-layout">
      <div className="analytics-header">
        <h1>{getTitle()}</h1>
        <div className="analytics-filters">
            {renderFilters()}
            <div className="view-toggle-buttons">
                <button onClick={() => setView('weekly')} className={view === 'weekly' ? 'active' : ''}>Mingguan</button>
                <button onClick={() => setView('monthly')} className={view === 'monthly' ? 'active' : ''}>Bulanan</button>
                <button onClick={() => setView('annual')} className={view === 'annual' ? 'active' : ''}>Tahunan</button>
            </div>
        </div>
      </div>
      
      <div className="analytics-content-wrapper">
        {renderContent()}
      </div>
    </div>
  );
}

export default AnalyticsPage;