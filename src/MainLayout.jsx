// frontend/src/MainLayout.jsx (KODE FINAL DENGAN LOGOUT TETAP DI BAWAH + LINK SERVISAN)

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
    FiGrid, 
    FiUsers, 
    FiLogOut, 
    FiBarChart2, 
    FiChevronsLeft, 
    FiChevronsRight, 
    FiShoppingCart,
    FiTool, // <-- Ikon untuk servisan sudah diimpor
    FiMenu,
    FiX
} from 'react-icons/fi';
import { useUser } from './UserContext';
import './MainLayout.css';

// Custom hook untuk deteksi ukuran layar (tidak ada perubahan)
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
};

const MainLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const currentUser = useUser();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleLogoutClick = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error saat logout:', error);
    }
  };

  const toggleDesktopSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="layout-container">
      <nav className={`sidebar ${isCollapsed && !isMobile ? 'collapsed' : ''} ${isMobile && isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="brand">Tazakka Admin</h2>
          {!isMobile && (
            <button onClick={toggleDesktopSidebar} className="toggle-button">
              {isCollapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
            </button>
          )}
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
		
        {/* Div ini akan menjadi area scroll, memisahkan link dari tombol logout */}
        <div className="sidebar-nav">
          {currentUser && currentUser.role !== 'pemilik' && (<NavLink to="/kasir" className="nav-link"><FiShoppingCart /><span>Kasir</span></NavLink>)}
          <NavLink to="/" end className="nav-link"><FiGrid /><span>Dashboard</span></NavLink>
          
          {/* Link Navigasi untuk Halaman Servisan sudah ditambahkan di sini */}
          {currentUser && currentUser.role !== 'pemilik' && (
            <NavLink to="/servisan" className="nav-link">
              <FiTool />
              <span>Servisan</span>
            </NavLink>
          )}

          {currentUser && currentUser.role !== 'kasir' && (<NavLink to="/analytics" className="nav-link"><FiBarChart2 /><span>Analytics</span></NavLink>)}
          {currentUser && currentUser.role === 'pengelola' && (<NavLink to="/manage-users" className="nav-link"><FiUsers /><span>Kelola Staf</span></NavLink>)}
        </div>
        
        {/* Tombol logout sekarang berada di luar div .sidebar-nav */}
        <button onClick={handleLogoutClick} className="logout-button">
          <FiLogOut />
          <span>Logout</span>
        </button>
      </nav>

      <div 
          className={`sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`}
          onClick={toggleMobileSidebar}
      ></div>

      <main className="main-content">
        {children}
      </main>

      {isMobile && (
        <button 
          className={`mobile-fab ${isMobileSidebarOpen ? 'open' : ''}`} 
          onClick={toggleMobileSidebar}
          aria-label="Toggle sidebar"
        >
          <FiMenu className="fab-icon-menu" />
          <FiX className="fab-icon-close" />
        </button>
      )}
    </div>
  );
};

export default MainLayout;