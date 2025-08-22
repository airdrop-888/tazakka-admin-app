// frontend/src/AnalyticsPage.jsx (KODE FINAL - FIX TYPO BLANK SCREEN)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ChartDataLabels);

const formatToRupiah = (number) => {
    if (number === null || number === undefined) return 'Rp 0';
    const numericValue = parseInt(String(number).replace(/[^0-9-]/g, ''), 10);
    if (isNaN(numericValue)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericValue);
};

const getLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function AnalyticsPage({ token }) {
  const [view, setView] = useState('weekly');
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
    setSummaryData(null);
    setChartData(null);

    let endpoint = '';
    let params = {};
    try {
        if (view === 'weekly') {
            endpoint = '/reports/weekly/';
            params = { for_date: selectedDate };
        } else if (view === 'monthly') {
            endpoint = '/reports/monthly/';
            params = { year: selectedYear, month: selectedMonth };
        } else if (view === 'annual') {
            endpoint = '/reports/annual/';
            params = { year: selectedYear };
        }
        
        const chartParams = {};
        if (view === 'monthly') {
            chartParams.year = selectedYear;
            chartParams.month = selectedMonth;
        }
        
        const summaryPromise = axios.get(`http://127.0.0.1:8000${endpoint}`, { headers: { Authorization: `Bearer ${token}` }, params });
        const chartPromise = axios.get('http://127.0.0.1:8000/reports/chart-data/', { 
            headers: { Authorization: `Bearer ${token}` },
            params: chartParams
        });

        const [summaryResponse, chartResponse] = await Promise.all([summaryPromise, chartPromise]);

        setSummaryData(summaryResponse.data);
        const chartApiData = chartResponse.data;

        let annualChartData = null;
        if (view === 'annual' && summaryResponse.data.monthly_breakdown) {
            annualChartData = {
                labels: summaryResponse.data.monthly_breakdown.labels,
                datasets: [{
                    label: `Pendapatan Bulanan ${selectedYear}`,
                    data: summaryResponse.data.monthly_breakdown.revenue,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)'
                }]
            };
        }

        setChartData({
            trend: {
              labels: chartApiData?.trend?.labels || [],
              datasets: [
                {
                  label: 'Pendapatan',
                  data: chartApiData?.trend?.pendapatan || [],
                  backgroundColor: 'rgba(54, 162, 235, 0.6)',
                },
                {
                  label: 'Laba Bersih',
                  data: chartApiData?.trend?.laba_bersih || [], 
                  backgroundColor: 'rgba(40, 167, 69, 0.6)',
                }
              ]
            },
            category: {
              labels: chartApiData?.category?.labels || [],
              datasets: [{
                label: 'Pendapatan per Kategori',
                data: chartApiData?.category?.pendapatan || [],
                backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
              }]
            },
            annual: annualChartData
        });
    } catch (err) {
      setError('Gagal memuat data. Coba refresh halaman atau periksa koneksi.');
      console.error('Fetch error:', err);
    } finally { 
      setLoading(false); 
    }
  }, [view, token, selectedDate, selectedMonth, selectedYear]);

  useEffect(() => { 
    if (token) { 
      fetchData(); 
    } 
  }, [fetchData, token]);

  const getTitle = () => {
    if (loading && !summaryData) return "Memuat Analytics...";
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (view === 'weekly') return `Ringkasan Laporan Minggu Ini (Mencakup ${formattedDate})`;
    if (view === 'monthly') return `Ringkasan Laporan Bulan ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
    if (view === 'annual') return `Ringkasan Laporan Tahun ${selectedYear}`;
    return "Halaman Analytics";
  };

  const renderFilters = () => {
    return (
      <div className="filter-controls">
        {view === 'weekly' && (
          <div className="filter-item">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
        )}
        {view === 'monthly' && (
          <>
            <div className="filter-item">
              <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="filter-item">
              <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </>
        )}
        {view === 'annual' && (
          <div className="filter-item">
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
      </div>
    );
  };
  
  const renderContent = () => {
    if (!token) return <p>Silakan login untuk melihat Analytics.</p>;
    if (loading) return <p>Memuat data...</p>;
    if (error) return <p className="error">{error}</p>;
    if (!summaryData || !chartData) return <p>Tidak ada data untuk ditampilkan.</p>;
    
    return (
        <>
            {(view === 'monthly' || view === 'weekly') && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px', marginBottom: '30px' }}>
                    <div className="chart-container">
                        <h3 className="chart-title">Tren 30 Hari Terakhir</h3>
                        {chartData?.trend?.datasets?.[0]?.data?.length > 0 ? (
                          <div className="chart-wrapper" style={{height: '300px', position: 'relative'}}>
                            <Bar 
                              options={{ responsive: true, maintainAspectRatio: false, plugins: { datalabels: { display: false } } }} 
                              data={chartData.trend} 
                            />
                          </div>
                        ) : <p>Belum ada data pendapatan yang cukup untuk ditampilkan.</p>}
                    </div>
                    <div className="chart-container">
                        <h3 className="chart-title">Pendapatan per Kategori Perangkat</h3>
                        {chartData?.category?.datasets?.[0]?.data?.length > 0 ? (
                          <div className="chart-wrapper" style={{height: '300px', position: 'relative'}}>
                            <Doughnut 
                              options={{ 
                                responsive: true, 
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { display: true, position: 'right' },
                                  datalabels: {
                                    formatter: (value, context) => context.chart.data.labels[context.dataIndex],
                                    color: '#ffffff', font: { weight: 'bold', size: 12 },
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 4, padding: 6,
                                  },
                                },
                              }} 
                              data={chartData.category} 
                            />
                          </div>
                        ) : <p>Belum ada data kategori untuk ditampilkan.</p>}
                    </div>
                </div>
            )}
            {view === 'annual' && chartData.annual && (
                <div className="chart-container" style={{ marginBottom: '30px' }}>
                    <h3 className="chart-title">Pendapatan Bulanan Tahun {selectedYear}</h3>
                    <div className="chart-wrapper" style={{height: '300px', position: 'relative', maxWidth: '100%'}}>
                      <Bar options={{ responsive: true, maintainAspectRatio: false }} data={chartData.annual} />
                    </div>
                </div>
            )}

            <h2>Ringkasan</h2>
            <div className="report-grid">
              <div className="report-card"><h3 style={{color: summaryData.laba_bersih_final < 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>Laba Bersih Final</h3><p style={{ color: summaryData.laba_bersih_final < 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>{formatToRupiah(summaryData.laba_bersih_final)}</p></div>
              {/* --- PERBAIKAN TYPO DI SINI --- */}
              <div className="report-card"><h3>Total Pendapatan</h3><p>{formatToRupiah(summaryData.total_pendapatan)}</p></div>
              <div className="report-card"><h3>Total Pengeluaran</h3><p style={{ color: '#e74c3c' }}>{formatToRupiah(summaryData.total_pengeluaran)}</p></div>
              <div className="report-card"><h3>Beban Operasional</h3><p>{formatToRupiah(summaryData.total_beban_operasional)}</p></div>
            </div>
        </>
    );
  };

  return (
    <div className="container analytics-page-layout">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
        <h1>{getTitle()}</h1>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            {renderFilters()}
        </div>
      </div>

      <div className="view-toggle-buttons">
        <button onClick={() => setView('weekly')} className={view === 'weekly' ? 'active' : ''}>
          Mingguan
        </button>
        <button onClick={() => setView('monthly')} className={view === 'monthly' ? 'active' : ''}>
          Bulanan
        </button>
        <button onClick={() => setView('annual')} className={view === 'annual' ? 'active' : ''}>
          Tahunan
        </button>
      </div>
      
      <div className="analytics-content-wrapper">
        {renderContent()}
      </div>
    </div>
  );
}

export default AnalyticsPage;