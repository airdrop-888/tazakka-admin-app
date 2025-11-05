// frontend/src/pages/EditItemModal.jsx (Lengkap dengan Penambahan Metode Pembayaran)

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FiSave } from 'react-icons/fi';

// Helper functions (Tidak ada perubahan)
const formatToRupiah = (number) => {
    if (number === null || number === undefined) return '';
    const numericValue = parseInt(String(number).replace(/[^0-9-]/g, ''), 10);
    if (isNaN(numericValue)) return '';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericValue);
};
const parseRupiah = (rupiahString) => String(rupiahString).replace(/[^0-9]/g, '');

const EditItemModal = ({ item, type, onClose, onSave }) => {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

  // State dan handler UI (Tidak ada perubahan)
  const deviceCategories = ["Hape", "Laptop", "Printer", "Lainnya"];
  const partsCategoriesMap = {
    Hape: ["LCD", "Battery", "Papan Charger", "Buzzer Speaker", "Fleksibel Board", "Fleksibel Power/Volume", "Pernik", "Software", "Remove Virus", "Pengecekan", "Lainnya"],
    Laptop: ["LCD", "Battery", "Keyboard", "Speaker", "Cleaning, Repasta", "Fan Processor", "Paket Upgrade - Basic", "Paket Upgrade - Premium", "Paket Upgrade - Exclusive", "Paket Upgrade - Excellent", "Lainnya"],
    Printer: ["Cartridge Hitam", "Cartridge Warna", "Head", "Cleaning", "Reset", "Lainnya"],
    Lainnya: ["Jasa", "Penjualan", "Lainnya"]
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleDeviceChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value, part_category: '' }));
  };
  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseRupiah(value) }));
  };

  // --- MODIFIKASI: Menambahkan 'payment_method' saat update ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      let tableName = '';
      let payload = {};

      if (type === 'transactions') {
          tableName = 'transactions';
          payload = {
              customer_name: formData.customer_name || null,
              work_category: formData.work_category,
              device_category: formData.device_category,
              part_category: formData.part_category,
              description: formData.description,
              revenue: parseFloat(formData.revenue || 0),
              cost_of_goods: parseFloat(formData.cost_of_goods || 0),
              technician_name: formData.technician_name || null,
              commission_percentage: formData.commission_percentage ? parseFloat(formData.commission_percentage) : null,
              payment_method: formData.payment_method // <-- BARU: Menambahkan metode pembayaran ke payload
          };
      } else if (type === 'expenses') {
          tableName = 'operational_expenses';
          payload = { description: formData.description, amount: parseFloat(formData.amount || 0) };
      } else if (type === 'stock_purchases') {
          tableName = 'stock_purchases';
          payload = { description: formData.description, amount: parseFloat(formData.amount || 0) };
      } else {
          throw new Error("Tipe data tidak valid untuk disimpan.");
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', item.id);

      if (updateError) {
        throw updateError;
      }
      
      onSave();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan.');
      console.error("Error saving item:", err);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!item) return null;

  const renderFormFields = () => {
    switch (type) {
      case 'transactions':
        return (
          <>
            <label className="form-label">Nama Pelanggan</label>
            <input type="text" name="customer_name" value={formData.customer_name || ''} onChange={handleChange} />
            
            <label className="form-label" style={{marginTop: '10px'}}>Kategori Perangkat</label>
            <select name="device_category" value={formData.device_category || ''} onChange={handleDeviceChange} required>
                <option value="">-- Pilih Kategori Perangkat --</option>
                {deviceCategories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>

            <label className="form-label" style={{marginTop: '10px'}}>Kategori Part/Servis</label>
            <select name="part_category" value={formData.part_category || ''} onChange={handleChange} disabled={!formData.device_category} required>
                <option value="">-- Pilih Kategori Part/Servis --</option>
                {formData.device_category && partsCategoriesMap[formData.device_category]?.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            
            <label className="form-label" style={{marginTop: '10px'}}>Deskripsi</label>
            <input type="text" name="description" value={formData.description || ''} onChange={handleChange} required/>
            
            {/* --- BARU: Input Metode Pembayaran di Modal Edit --- */}
            <label className="form-label" style={{marginTop: '10px'}}>Metode Pembayaran</label>
            <select name="payment_method" value={formData.payment_method || 'Cash'} onChange={handleChange} required>
                <option value="Cash">💵 Cash</option>
                <option value="Transfer">💳 Transfer</option>
            </select>

            <label className="form-label" style={{marginTop: '10px'}}>Pendapatan</label>
            <input type="text" name="revenue" value={formatToRupiah(formData.revenue)} onChange={handleNumericChange} required/>

            <label className="form-label" style={{marginTop: '10px'}}>Modal</label>
            <input type="text" name="cost_of_goods" value={formatToRupiah(formData.cost_of_goods)} onChange={handleNumericChange} />
            
            <label className="form-label" style={{marginTop: '10px'}}>Teknisi</label>
            <input type="text" name="technician_name" value={formData.technician_name || ''} onChange={handleChange} />
            
            <label className="form-label" style={{marginTop: '10px'}}>Komisi %</label>
            <input type="number" name="commission_percentage" value={formData.commission_percentage || ''} onChange={handleChange} />
          </>
        );
      case 'expenses':
      case 'stock_purchases':
        return (
          <>
            <label className="form-label">Deskripsi</label>
            <input type="text" name="description" value={formData.description || ''} onChange={handleChange} required />
            
            <label className="form-label" style={{marginTop: '10px'}}>Jumlah</label>
            <input type="text" name="amount" value={formatToRupiah(formData.amount)} onChange={handleNumericChange} required />
          </>
        );
      default:
        return <p>Tipe data tidak dikenali.</p>;
    }
  };

  // JSX untuk render modal (Tidak ada perubahan)
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '8px', 
          minWidth: '450px', 
          boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
        <h2 style={{marginTop: 0, flexShrink: 0}}>Edit Data</h2>
        <form onSubmit={handleSave} className="form-section" style={{ overflowY: 'auto', paddingRight: '15px' }}>
            {renderFormFields()}
            
            <div style={{marginTop: '20px', display: 'flex', gap: '10px', flexShrink: 0}}>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  <FiSave style={{marginRight: '8px'}} /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button type="button" onClick={onClose} className="btn-secondary" disabled={isSaving}>
                  Batal
                </button>
            </div>
            {error && <p className="error" style={{marginTop: '10px', flexShrink: 0}}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;