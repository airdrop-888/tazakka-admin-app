// frontend/src/pages/LoginPage.jsx (KODE LENGKAP - VERSI FINAL)

import React, { useState } from 'react';
import axios from 'axios';
import './LoginPage.css';
import loginImage from '../assets/tech-illustration.png';

function LoginPage({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    try {
      // --- PERBAIKAN PENTING ADA DI SINI ---
      // 1. Kita membuat URL API secara dinamis dari environment variable.
      //    Saat di Vercel, ini akan menjadi "/api/token".
      //    Saat di lokal, ini juga akan menjadi "/api/token" (jika Anda menjalankan dengan Vite dev server).
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/token`;

      // 2. Kita menggunakan apiUrl yang sudah benar, bukan lagi alamat hardcode 'http://127.0.0.1:8000/token'
      const response = await axios.post(apiUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      // --- AKHIR PERBAIKAN ---
      
      setToken(response.data.access_token);
    } catch (err) {
      setError('Username atau password salah.');
      console.error("Login Error:", err); // Pesan log yang lebih baik
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        
        <div className="login-form-section">
          <div className="login-header">
            <h1>Tazakka Group Service</h1>
            <p>Selamat datang kembali, silakan masukkan detail Anda.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Masukkan username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Memproses...' : 'Sign In'}
            </button>

            {error && <p className="error-message">{error}</p>}
          </form>
        </div>

        <div className="login-image-section">
          <img src={loginImage} alt="Tech Illustration" />
        </div>

      </div>
    </div>
  );
}

export default LoginPage;