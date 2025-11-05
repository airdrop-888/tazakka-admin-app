// frontend/src/App.jsx (Struktur Anda + Integrasi Notifikasi Modern + Rute Servisan)

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

// === PENAMBAHAN: Impor untuk Notifikasi Modern ===
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// === AKHIR PENAMBAHAN ===

// Impor semua komponen halaman dan layout (Struktur Anda dipertahankan)
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ManageUsersPage from './pages/ManageUsersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MainLayout from './MainLayout';
import KasirPage from './pages/KasirPage';
import ServiceJobsPage from './pages/ServiceJobsPage'; // <-- PENAMBAHAN: Impor halaman servisan baru

// Impor file CSS global
import './index.css';
import './MainLayout.css';

// Impor Provider UserContext
import { UserProvider } from './UserContext';

// Komponen Pembungkus untuk Rute yang Dilindungi (Logika Anda dipertahankan)
const ProtectedRoute = ({ session, children }) => {
  if (!session) {
    // Jika tidak ada sesi, lempar ke halaman login
    return <Navigate to="/login" replace />;
  }

  // Jika ada sesi, tampilkan layout utama dengan konten di dalamnya
  return <MainLayout>{children}</MainLayout>;
};

function App() {
  // State 'session' dari Supabase (Logika Anda dipertahankan)
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek sesi yang aktif saat aplikasi pertama kali dimuat (Logika Anda dipertahankan)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listener utama untuk perubahan status login/logout (Logika Anda dipertahankan)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup listener (Logika Anda dipertahankan)
    return () => subscription.unsubscribe();
  }, []);

  // Tampilan loading saat sesi diperiksa (Logika Anda dipertahankan)
  if (loading) {
    return <div>Memeriksa sesi...</div>;
  }

  return (
    <Router>
      {/* === PENAMBAHAN: Komponen Kontainer Notifikasi === */}
      {/* Ini tidak akan merusak UI Anda, hanya menyiapkan 'wadah' untuk notifikasi */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      {/* === AKHIR PENAMBAHAN === */}

      {/* UserProvider sekarang mendapatkan `session` sebagai prop (Logika Anda dipertahankan) */}
      <UserProvider session={session}>
        <Routes>
          {/* Rute Login: Hanya tampil jika TIDAK ada sesi (Struktur Anda dipertahankan) */}
          <Route 
            path="/login" 
            element={!session ? <LoginPage /> : <Navigate to="/" />} 
          />

          {/* Rute Utama (Dashboard) */}
          <Route 
            path="/"
            element={
              <ProtectedRoute session={session}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Rute Kasir */}
          <Route 
            path="/kasir"
            element={
              <ProtectedRoute session={session}>
                <KasirPage />
              </ProtectedRoute>
            }
          />

          {/* <-- PENAMBAHAN BARU DIMULAI --> */}
          {/* Rute untuk Halaman Manajemen Servisan */}
          <Route 
            path="/servisan"
            element={
              <ProtectedRoute session={session}>
                <ServiceJobsPage />
              </ProtectedRoute>
            }
          />
          {/* <-- PENAMBAHAN BARU SELESAI --> */}

          {/* Rute Analytics */}
          <Route 
            path="/analytics"
            element={
              <ProtectedRoute session={session}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Rute Kelola Staf (Nama file disesuaikan menjadi ManageUsersPage) */}
          <Route 
            path="/manage-users"
            element={
              <ProtectedRoute session={session}>
                <ManageUsersPage />
              </ProtectedRoute>
            }
          />
          
          {/* Rute "Catch-all" (Struktur Anda dipertahankan) */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;