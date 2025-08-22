// frontend/src/MainLayout.jsx (KODE LENGKAP - DENGAN PEMBATASAN NAVIGASI)

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiUsers, FiLogOut, FiBarChart2, FiChevronsLeft, FiChevronsRight, FiShoppingCart } from 'react-icons/fi';
import { useUser } from './UserContext';
import './MainLayout.css';

const MainLayout = ({ onLogout, children }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentUser = useUser();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setIsCollapsed(true);
      }
    };
    handleResize();
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
		
        <NavLink to="/kasir" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          <FiShoppingCart />
          <span>Kasir</span>
        </NavLink>
        
        <NavLink to="/" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          <FiGrid />
          <span>Dashboard</span>
        </NavLink>
        
        {/* --- PERBAIKAN 1: Sembunyikan Analytics dari Kasir --- */}
        {currentUser && currentUser.role !== 'kasir' && (
            <NavLink to="/analytics" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <FiBarChart2 />
              <span>Analytics</span>
            </NavLink>
        )}
        
        {/* --- PERBAIKAN 2: Sembunyikan Kelola Staf dari Admin & Kasir --- */}
        {currentUser && currentUser.role === 'pengelola' && (
            <NavLink to="/manage-users" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <FiUsers />
              <span>Kelola Staf</span>
            </NavLink>
        )}
        
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

export default MainLayout;