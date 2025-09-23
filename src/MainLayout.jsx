// frontend/src/MainLayout.jsx (KODE FINAL DAN LENGKAP)

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Diimpor untuk fungsi logout
import { FiGrid, FiUsers, FiLogOut, FiBarChart2, FiChevronsLeft, FiChevronsRight, FiShoppingCart } from 'react-icons/fi';
import { useUser } from './UserContext'; // Digunakan untuk mendapatkan data user
import './MainLayout.css';

// Komponen tidak lagi menerima prop `onLogout`
const MainLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentUser = useUser(); // Mengambil data user (role, nama) dari context

  // Fungsi logout yang modern, langsung memanggil Supabase
  const handleLogoutClick = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error saat logout:', error);
    }
    // Tidak perlu navigasi, App.jsx akan menangani redirect secara otomatis
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // useEffect untuk menangani sidebar collapse di layar kecil
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="layout-container">
      <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2 className="brand">Tazakka Admin</h2>
          <button onClick={toggleSidebar} className="toggle-button">
            {isCollapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
          </button>
        </div>
        
        <div className="user-info">
          {currentUser ? (
            <>
              <div className="user-name">{currentUser.full_name || currentUser.username}</div>
              <div className="user-role">{currentUser.role}</div>
            </>
          ) : (
            <div className="user-name">Memuat...</div>
          )}
        </div>
		
        {/* === AWAL BLOK NAVIGASI DENGAN LOGIKA YANG SUDAH DIVERIFIKASI === */}

        {/* Menu Kasir: Ditampilkan untuk semua role KECUALI 'pemilik'. */}
        {currentUser && currentUser.role !== 'pemilik' && (
          <NavLink to="/kasir" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            <FiShoppingCart />
            <span>Kasir</span>
          </NavLink>
        )}
                
        {/* Menu Dashboard: Ditampilkan untuk semua role. */}
        <NavLink to="/" end className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          <FiGrid />
          <span>Dashboard</span>
        </NavLink>
                
        {/* Menu Analytics: Ditampilkan untuk semua role KECUALI 'kasir'. */}
        {currentUser && currentUser.role !== 'kasir' && (
            <NavLink to="/analytics" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <FiBarChart2 />
              <span>Analytics</span>
            </NavLink>
        )}
                
        {/* Menu Kelola Staf: Ditampilkan HANYA untuk role 'pengelola'. */}
        {currentUser && currentUser.role === 'pengelola' && (
            <NavLink to="/manage-users" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <FiUsers />
              <span>Kelola Staf</span>
            </NavLink>
        )}

        {/* === AKHIR BLOK NAVIGASI === */}
        
        <button onClick={handleLogoutClick} className="logout-button">
          <FiLogOut />
          <span>Logout</span>
        </button>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;```