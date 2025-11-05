// frontend/src/pages/ManageUsersPage.jsx (Lengkap dengan Penyempurnaan UI dan data-label untuk mobile)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { FiUserPlus, FiTrash2, FiEdit, FiUsers } from 'react-icons/fi';
import EditUserModal from './EditUserModal';
import './ManageUsersPage.css';

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('kasir');
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: true });

      if (fetchError) throw fetchError;
      setUsers(data);
    } catch (err) {
      setError('Gagal memuat data user.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
        setError('Username dan Password tidak boleh kosong.');
        return;
    }
    const payload = {
      username: username,
      email: `${username}@tazakkagroupservice.com`,
      password: password,
      full_name: fullName,
      role: role,
    };
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-user', {
        body: payload,
      });
      if (functionError) throw functionError;
      if (functionData.error) throw new Error(functionData.error);
      setUsername('');
      setPassword('');
      setFullName('');
      setRole('kasir');
      await fetchUsers();
    } catch (err) {
      setError(err.message || "Gagal menambah user. Username mungkin sudah ada.");
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId, userUsername) => {
    if (window.confirm(`Anda yakin ingin menghapus user "${userUsername}"? Aksi ini sangat permanen dan tidak dapat dibatalkan.`)) {
      setError('');
      try {
        const { data: functionData, error: functionError } = await supabase.functions.invoke('delete-user', {
          body: { userId: userId },
        });
        if (functionError) throw functionError;
        if (functionData.error) throw new Error(functionData.error);
        await fetchUsers();
      } catch (err)
 {
        setError(err.message || 'Gagal menghapus user.');
        console.error(err);
      }
    }
  };
  
  const handleOpenEditModal = (user) => setEditingUser(user);
  const handleCloseEditModal = () => setEditingUser(null);
  const handleSaveEdit = async () => {
    handleCloseEditModal();
    await fetchUsers();
  };

  if (loading) return <p>Loading...</p>;
  if (error && users.length === 0) return <p className="error">{error}</p>;

  return (
    <div className="container">
      <header className="page-header">
        <h1>
          <FiUsers /> Kelola Staf
        </h1>
      </header>
      
      <div className="manage-users-layout">
        <div className="form-container card-style">
          <h2 className="card-title">
            <FiUserPlus /> Tambah Staf Baru
          </h2>
          <form onSubmit={handleAddUser}>
            <div className="form-grid">
              <div>
                <label className="form-label">Username</label>
                <input type="text" placeholder="contoh: olik" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Nama Lengkap</label>
                <input type="text" placeholder="contoh: Olik Alfarizqi" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Password Baru</label>
                <input type="password" placeholder="Minimal 6 karakter" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Peran (Role)</label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                  <option value="kasir">Staf Kasir</option>
                  <option value="admin">Staf Admin</option>
                  <option value="pengelola">Pengelola</option>
                  <option value="pemilik">Pemilik</option> 
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Tambah User</button>
            </div>
            {error && <p className="error" style={{marginTop: '15px'}}>{error}</p>}
          </form>
        </div>

        <div className="user-list-container card-style">
          <h2 className="card-title">Daftar Pengguna Saat Ini</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Nama Lengkap</th>
                  <th>Peran</th>
                  <th style={{textAlign: 'center', width: '120px'}}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    {/* --- KODE BARU DIMULAI DI SINI: Atribut data-label ditambahkan --- */}
                    <td data-label="ID" title={user.id}>{user.id.substring(0, 8)}...</td>
                    <td data-label="Username">{user.username}</td>
                    <td data-label="Nama Lengkap">{user.full_name || '-'}</td>
                    <td data-label="Peran">{user.role}</td>
                    <td data-label="Aksi">
                      <div className="action-button-container">
                        <button onClick={() => handleOpenEditModal(user)} className="action-button edit-button" title="Edit User">
                          <FiEdit />
                        </button>
                        <button onClick={() => handleDeleteUser(user.id, user.username)} className="action-button delete-button" title="Hapus User">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                    {/* --- AKHIR DARI KODE BARU --- */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default ManageUsersPage;