// frontend/src/pages/ImportModal.jsx

import React, { useState } from 'react';
import axios from 'axios';

function ImportModal({ token, onClose, onImportSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    setMessage('');
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Pilih file Excel terlebih dahulu.');
      return;
    }

    setUploading(true);
    setMessage('Mengupload dan memproses file...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://127.0.0.1:8000/import/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage(response.data.message);
      onImportSuccess(); // Memberitahu dashboard untuk refresh data
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Gagal mengupload file.';
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Import Data dari Excel</h2>
        <p>Upload file Excel Anda untuk mengisi database secara otomatis.</p>
        <p><strong>Penting:</strong> Pastikan nama sheet adalah 'Pengeluaran'.</p>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        <div style={styles.buttonGroup}>
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Memproses...' : 'Upload & Proses'}
          </button>
          <button onClick={onClose} disabled={uploading} style={{backgroundColor: '#7f8c8d'}}>Tutup</button>
        </div>
        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

// Simple styling
const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', minWidth: '400px' },
    buttonGroup: { marginTop: '20px', display: 'flex', gap: '10px' },
    message: { marginTop: '15px', fontWeight: 'bold' }
};

export default ImportModal;