// frontend/src/App.jsx (Versi Baru dengan Supabase Session Management)

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // <- Impor Supabase

// Impor semua komponen halaman dan layout
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ManageUsersPage from './pages/ManageUsersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MainLayout from './MainLayout';
import KasirPage from './pages/KasirPage';

// Impor file CSS global
import './index.css';
import './MainLayout.css';

// Impor Provider UserContext
import { UserProvider } from './UserContext'; // <- Kita akan tetap pakai ini, tapi dengan cara baru

// Komponen Pembungkus untuk Rute yang Dilindungi (SEKARANG BERDASARKAN SESSION)
const ProtectedRoute = ({ session, children }) => {
  if (!session) {
    // Jika tidak ada sesi, lempar ke halaman login
    return <Navigate to="/login" replace />;
  }

  // Jika ada sesi, tampilkan layout utama dengan konten di dalamnya
  return <MainLayout>{children}</MainLayout>;
};

function App() {
  // Ganti state 'token' dengan state 'session' dari Supabase
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // State untuk loading awal

  useEffect(() => {
    // Cek sesi yang aktif saat aplikasi pertama kali dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // Selesai loading
    });

    // Ini adalah "pendengar" utama. Ia akan berjalan setiap kali user login atau logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup: Berhenti mendengarkan saat komponen tidak lagi ditampilkan
    return () => subscription.unsubscribe();
  }, []);

  // Tampilkan loading screen saat sesi sedang diperiksa
  if (loading) {
    return <div>Memeriksa sesi...</div>;
  }

  return (
    <Router>
      {/* UserProvider sekarang mendapatkan `session` sebagai prop */}
      <UserProvider session={session}>
        <Routes>
          {/* Rute Login: Hanya tampil jika TIDAK ada sesi */}
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

          {/* Rute Analytics */}
          <Route 
            path="/analytics"
            element={
              <ProtectedRoute session={session}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Rute Kelola Staf */}
          <Route 
            path="/manage-users"
            element={
              <ProtectedRoute session={session}>
                <ManageUsersPage />
              </ProtectedRoute>
            }
          />
          
          {/* Rute "Catch-all" */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;