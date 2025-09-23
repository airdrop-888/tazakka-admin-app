// frontend/src/pages/EditTransactionModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditTransactionModal = ({ token, transaction, onClose, onSave }) => {
  const [formData, setFormData] = useState(transaction);

  const handleChange = (e) => { /* ... logika untuk update form ... */ };

  const handleSave = async () => {
    // Panggil endpoint PUT /transactions/{id} dengan formData
    await axios.put(`.../transactions/${transaction.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
    onSave(); // Memberitahu dashboard untuk refresh
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Edit Transaksi Pemasukan</h2>
        {/* Form yang sudah diisi dengan data dari formData */}
        <button onClick={handleSave}>Simpan Perubahan</button>
        <button onClick={onClose}>Batal</button>
      </div>
    </div>
  );
};

export default EditTransactionModal;