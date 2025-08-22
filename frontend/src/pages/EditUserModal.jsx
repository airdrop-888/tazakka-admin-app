// frontend/src/pages/EditUserModal.jsx (KODE LENGKAP DAN FUNGSIONAL)

import React, { useState } from 'react';
import axios from 'axios';
import { FiSave } from 'react-icons/fi';

const EditUserModal = ({ token, user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    full_name: user.full_name || '',
    password: '', // Password dikosongkan secara default
    role: user.role,
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
  e.preventDefault();
  setIsSaving(true);
  setError('');

  const payload = {
      username: formData.username,
      full_name: formData.full_name,
      role: formData.role
  };
  
  if (formData.password && formData.password.trim() !== '') {
      payload.password = formData.password;
  }

  try {
    // BARIS-BARIS YANG DIPERBAIKI ADA DI SINI
    const endpoint = `/users/${user.id}`; // Tentukan endpoint di sini
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}${endpoint}`;
    
    await axios.put(apiUrl, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // AKHIR PERBAIKAN

    onSave();
  } catch (err) {
    setError(err.response?.data?.detail || 'Gagal menyimpan perubahan.');
    console.error("Error saving user:", err.response?.data || err);
  } finally {
    setIsSaving(false);
  }
};
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', minWidth: '450px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
        <h2 style={{marginTop: 0}}>Edit User: {user.username}</h2>
        <form onSubmit={handleSave} className="form-section">
            <label className="form-label">Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
            
            <label className="form-label" style={{marginTop: '10px'}}>Nama Lengkap</label>
            <input type="text" name="full_name" placeholder="Nama Lengkap Staf" value={formData.full_name} onChange={handleChange} />
            
            <label className="form-label" style={{marginTop: '10px'}}>Password Baru (Opsional)</label>
            <input type="password" name="password" placeholder="Kosongkan jika tidak diubah" value={formData.password} onChange={handleChange} />
            
            <label className="form-label" style={{marginTop: '10px'}}>Peran (Role)</label>
            <select name="role" value={formData.role} onChange={handleChange}>
                <option value="admin">Staf Admin</option>
                <option value="pengelola">Pengelola</option>
            </select>
            
            <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                <button type="submit" disabled={isSaving}>
                  <FiSave /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button type="button" onClick={onClose} style={{backgroundColor: '#7f8c8d'}} disabled={isSaving}>
                  Batal
                </button>
            </div>
            {error && <p className="error" style={{marginTop: '10px'}}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;