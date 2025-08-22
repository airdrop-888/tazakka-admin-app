// frontend/src/App.jsx (KODE LENGKAP DENGAN ROUTE KASIR)

import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// Impor semua komponen halaman dan layout
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ManageUsersPage from './pages/ManageUsersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MainLayout from './MainLayout';
// --- PERUBAHAN DI SINI: Impor komponen halaman Kasir yang baru ---
import KasirPage from './pages/KasirPage'; // Pastikan Anda membuat file ini nanti

// Impor file CSS global
import './index.css';
import './MainLayout.css';

// Impor fungsi helper dan Provider
import { getUserRole } from './auth';
import { UserProvider } from './UserContext';

// Komponen Pembungkus untuk Rute yang Dilindungi
const ProtectedRoute = ({ token, onLogout, children, allowedRoles }) => {
  const userRole = getUserRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout onLogout={onLogout}>
      {children}
    </MainLayout>
  );
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleSetToken = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <Router>
      <UserProvider token={token}>
        <Routes>
          {/* Rute 1: Halaman Login (Publik) */}
          <Route 
            path="/login" 
            element={token ? <Navigate to="/" /> : <LoginPage setToken={handleSetToken} />} 
          />

          {/* Rute 2: Halaman Dashboard (Dilindungi) */}
          <Route 
            path="/"
            element={
              <ProtectedRoute token={token} onLogout={handleLogout}>
                <DashboardPage token={token} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* --- KODE BARU: Route untuk Halaman Kasir --- */}
          <Route 
            path="/kasir"
            element={
              <ProtectedRoute token={token} onLogout={handleLogout}>
                <KasirPage token={token} />
              </ProtectedRoute>
            }
          />
          {/* --- AKHIR KODE BARU --- */}

          {/* Rute 3: Halaman Analytics (Dilindungi) */}
          <Route 
            path="/analytics"
            element={
              <ProtectedRoute token={token} onLogout={handleLogout}>
                <AnalyticsPage token={token} />
              </ProtectedRoute>
            }
          />

          {/* Rute 4: Halaman Kelola Staf (Dilindungi HANYA untuk 'pengelola') */}
          <Route 
            path="/manage-users"
            element={
              <ProtectedRoute token={token} onLogout={handleLogout} allowedRoles={['pengelola']}>
                <ManageUsersPage token={token} />
              </ProtectedRoute>
            }
          />
          
          {/* Rute "Catch-all": Jika URL lain diketik, arahkan ke halaman utama */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;