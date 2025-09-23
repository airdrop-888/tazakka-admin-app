// frontend/src/pages/EditUserModal.jsx (KODE FINAL LENGKAP - dengan Supabase Edge Function)

import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Ganti axios dengan Supabase
import { FiSave } from 'react-icons/fi';

// Hapus prop `token` dari komponen
const EditUserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    // Username tidak bisa diubah karena merupakan pengenal unik
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

  // Ubah total fungsi handleSave untuk memanggil Edge Function
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    
    // Siapkan payload yang akan dikirim ke Edge Function
    const payload = {
        userId: user.id, // ID user yang akan diubah
        full_name: formData.full_name,
        role: formData.role
    };
    
    // Hanya tambahkan password ke payload jika diisi
    if (formData.password && formData.password.trim() !== '') {
        payload.password = formData.password;
    }

    try {
      // Panggil Edge Function 'update-user' yang aman
      const { data: functionData, error: functionError } = await supabase.functions.invoke('update-user', {
        body: payload
      });
      
      if (functionError) throw functionError;
      if (functionData.error) throw new Error(functionData.error);

      // Jika berhasil, panggil onSave untuk merefresh data di halaman utama
      onSave();

    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan.');
      console.error("Error saving user:", err);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    // Bagian JSX (tampilan) tidak ada yang perlu diubah secara fungsional
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', minWidth: '450px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
        <h2 style={{marginTop: 0}}>Edit User: {user.username}</h2>
        <form onSubmit={handleSave} className="form-section">
            <label className="form-label">Username (Tidak bisa diubah)</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required disabled />
            
            <label className="form-label" style={{marginTop: '10px'}}>Nama Lengkap</label>
            <input type="text" name="full_name" placeholder="Nama Lengkap Staf" value={formData.full_name} onChange={handleChange} />
            
            <label className="form-label" style={{marginTop: '10px'}}>Password Baru (Opsional)</label>
            <input type="password" name="password" placeholder="Kosongkan jika tidak diubah" value={formData.password} onChange={handleChange} />
            
            <label className="form-label" style={{marginTop: '10px'}}>Peran (Role)</label>
            <select name="role" value={formData.role} onChange={handleChange}>
                <option value="kasir">Staf Kasir</option>
                <option value="admin">Staf Admin</option>
                <option value="pengelola">Pengelola</option>
            </select>
            
            <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  <FiSave style={{marginRight: '8px'}}/> 
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button type="button" onClick={onClose} className="btn-secondary" disabled={isSaving}>
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