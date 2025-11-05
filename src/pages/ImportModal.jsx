// frontend/src/pages/ImportModal.jsx (KODE FINAL LENGKAP - dengan Supabase Storage)

import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Ganti axios dengan Supabase

// Hapus prop `token` dari komponen
function ImportModal({ onClose, onImportSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    setMessage('');
    setSelectedFile(event.target.files[0]);
  };

  // --- PEROMBAKAN UTAMA DI SINI: FUNGSI handleUpload ---
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Pilih file Excel terlebih dahulu.');
      return;
    }

    setUploading(true);
    setMessage('Mengupload file ke Supabase Storage...');

    try {
      // Membuat nama file yang unik untuk menghindari file tertimpa
      // Contoh: import-1678886400000-laporan.xlsx
      const fileName = `import-${Date.now()}-${selectedFile.name}`;
      
      // Mengupload file ke bucket 'imports' di Supabase Storage
      // PENTING: Anda harus membuat bucket bernama 'imports' terlebih dahulu di dashboard Supabase Anda!
      const { data, error: uploadError } = await supabase.storage
        .from('imports') // Nama bucket penyimpanan Anda
        .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
        });

      if (uploadError) {
        throw uploadError; // Jika ada error dari Supabase, lemparkan
      }

      console.log('File berhasil diupload:', data);
      setMessage('File berhasil diupload! Pemrosesan data akan dilakukan oleh backend.');
      
      // Catatan: Karena pemrosesan file terjadi di backend (nantinya via Edge Function),
      // memanggil onImportSuccess() di sini mungkin tidak langsung menampilkan data baru.
      // Untuk saat ini, kita anggap upload berhasil sudah cukup.
      // onImportSuccess(); 

    } catch (error) {
      const errorMessage = error.message || 'Gagal mengupload file.';
      setMessage(`Error: ${errorMessage}`);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Import Data dari Excel</h2>
        <p>Upload file Excel Anda ke Supabase Storage untuk diproses.</p>
        <p style={{color: '#e74c3c'}}><strong>Penting:</strong> Pastikan Anda sudah membuat bucket bernama 'imports' di Supabase.</p>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        <div style={styles.buttonGroup}>
          <button onClick={handleUpload} disabled={uploading || !selectedFile} className="btn-primary">
            {uploading ? 'Mengupload...' : 'Upload File'}
          </button>
          <button onClick={onClose} disabled={uploading} className="btn-secondary">Tutup</button>
        </div>
        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

// Styling Anda sudah bagus, tidak perlu diubah.
const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', minWidth: '400px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
    buttonGroup: { marginTop: '20px', display: 'flex', gap: '10px' },
    message: { marginTop: '15px', fontWeight: 'bold' }
};

export default ImportModal;