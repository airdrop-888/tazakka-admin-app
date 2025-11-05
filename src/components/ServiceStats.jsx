// frontend/src/components/ServiceStats.jsx

import React from 'react';
import { FiTool, FiAlertCircle, FiSettings, FiThumbsUp } from 'react-icons/fi';
// Kita juga akan membuat file CSS khusus untuk komponen ini
import './ServiceStats.css';

const ServiceStats = ({ stats }) => {
  // Jika data belum siap, jangan render apa-apa
  if (!stats) {
    return null;
  }

  return (
    <div className="service-stats-container card-style">
      <h3 className="stats-title">Statistik Servisan (Aktif)</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-icon icon-total"><FiTool /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Servisan</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon icon-menunggu"><FiAlertCircle /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.menunggu}</span>
            <span className="stat-label">Menunggu</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon icon-pengerjaan"><FiSettings /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.pengerjaan}</span>
            <span className="stat-label">Dikerjakan</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon icon-siap"><FiThumbsUp /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.siap}</span>
            <span className="stat-label">Siap Diambil</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceStats;