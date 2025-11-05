// frontend/src/components/StatCard.jsx

import React from 'react';
import './StatCard.css';

const StatCard = ({ icon, title, value, color, note }) => {
  const iconStyle = {
    backgroundColor: `rgba(${color}, 0.1)`,
    color: `rgb(${color})`,
  };

  return (
    <div className="key-metric-card">
      <div className="metric-icon" style={iconStyle}>
        {icon}
      </div>
      <div className="metric-info">
        <p className="metric-title">{title}</p>
        <h3 className="metric-value">{value}</h3>
        {note && <span className="metric-note">{note}</span>}
      </div>
    </div>
  );
};

export default StatCard;