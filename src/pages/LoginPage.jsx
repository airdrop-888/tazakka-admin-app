// frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // <- Ganti axios dengan supabase
import './LoginPage.css';
import loginImage from '../assets/tech-illustration.png';

// Hapus prop setToken, karena Supabase akan mengelola session secara otomatis
function LoginPage() { 
  // Ganti username menjadi email, karena ini standar Supabase
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Gunakan fungsi sign in dari Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      // Jika ada error dari Supabase, tampilkan pesannya
      if (error) throw error;

      // Jika berhasil, Supabase akan otomatis menyimpan session.
      // Anda tidak perlu melakukan apa-apa lagi di sini.
      // Redirect ke dashboard akan di-handle oleh komponen parent (App.jsx)
      console.log('Login berhasil!', data);

    } catch (err) {
      // Tampilkan pesan error yang lebih spesifik dari Supabase
      setError(err.message || 'Email atau password salah.');
      console.error(err);
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
              {/* Ganti ke email untuk konsistensi */}
              <label htmlFor="email">Email</label> 
              <input
                id="email"
                type="email" // Gunakan type="email" untuk validasi browser
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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