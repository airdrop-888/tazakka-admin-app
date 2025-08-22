// frontend/src/pages/ManageUsersPage.jsx (KODE LENGKAP - DENGAN UI/UX MODERN)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUserPlus, FiTrash2, FiEdit, FiUsers } from 'react-icons/fi';
import EditUserModal from './EditUserModal';
import './ManageUsersPage.css'; // <-- TAMBAHKAN BARIS INI UNTUK MENGIMPOR CSS

const ManageUsersPage = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('kasir');
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://127.0.0.1:8000/users/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (err) {
      setError('Gagal memuat data user. Anda mungkin tidak memiliki hak akses.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
        setError('Username dan Password tidak boleh kosong.');
        return;
    }
    try {
      await axios.post('http://127.0.0.1:8000/users/', 
        { username, password, role, full_name: fullName }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsername('');
      setPassword('');
      setFullName('');
      setRole('kasir');
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menambah user. Username mungkin sudah ada.");
    }
  };

  const handleDeleteUser = async (userId, userUsername) => {
    if (window.confirm(`Anda yakin ingin menghapus user "${userUsername}"?`)) {
      setError('');
      try {
        await axios.delete(`http://127.0.0.1:8000/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchUsers();
      } catch (err) {
        setError(err.response?.data?.detail || 'Gagal menghapus user.');
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
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <FiUsers /> Kelola Staf
      </h1>
      
      <div className="manage-users-layout">
        
        <div className="form-container card-style">
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
            <FiUserPlus /> Tambah Staf Baru
          </h3>
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
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Daftar Pengguna Saat Ini</h2>
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
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.full_name || '-'}</td>
                    <td>{user.role}</td>
                    <td>
                      <div className="action-button-container">
                        <button onClick={() => handleOpenEditModal(user)} className="action-button edit-button" title="Edit User">
                          <FiEdit />
                        </button>
                        <button onClick={() => handleDeleteUser(user.id, user.username)} className="action-button delete-button" title="Hapus User">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      
      {editingUser && (
        <EditUserModal 
          token={token}
          user={editingUser}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default ManageUsersPage;