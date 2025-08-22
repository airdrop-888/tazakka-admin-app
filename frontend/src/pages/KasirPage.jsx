// frontend/src/pages/KasirPage.jsx (KODE LENGKAP - SUDAH DIPERBAIKI)

import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { FiPlusCircle, FiX, FiMinus, FiPlus, FiSearch, FiPackage, FiEdit, FiTrash2, FiUser, FiTool, FiCheckCircle } from 'react-icons/fi';
import './KasirPage.css';

const formatToRupiah = (number) => { if (number === null || number === undefined || isNaN(number)) return ''; return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number); };
const parseRupiah = (rupiahString) => { return String(rupiahString || '').replace(/[^0-9]/g, ''); };
const EditProductModal = ({ isOpen, onClose, product, onSave }) => { const [formData, setFormData] = useState({ name: '', price: '', device_category: '' }); useEffect(() => { if (product) { setFormData({ name: product.name, price: product.price.toString(), device_category: product.device_category }); } }, [product, isOpen]); if (!isOpen || !product) return null; const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); }; const handlePriceChange = (e) => { setFormData(prev => ({ ...prev, price: parseRupiah(e.target.value) })); }; const handleSubmit = (e) => { e.preventDefault(); if (!formData.name || !formData.price) { alert("Nama dan Harga tidak boleh kosong."); return; } onSave({ ...product, name: formData.name, price: parseFloat(formData.price), device_category: formData.device_category }); onClose(); }; return (<div className="modal-overlay"><div className="modal-content"><h2>Edit Jasa / Produk</h2><form onSubmit={handleSubmit}><div className="form-group"><label>Nama Jasa / Produk</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div><div className="form-group"><label>Kategori Perangkat</label><select name="device_category" value={formData.device_category} onChange={handleChange}><option>Hape</option><option>Laptop</option><option>Printer</option><option>Lainnya</option></select></div><div className="form-group"><label>Harga Jual</label><input type="text" name="price" value={formatToRupiah(formData.price)} onChange={handlePriceChange} required /></div><div className="modal-actions"><button type="button" className="btn-secondary" onClick={onClose}>Batal</button><button type="submit" className="btn-primary">Simpan Perubahan</button></div></form></div></div>); };
const AddCustomItemModal = ({ isOpen, onClose, onAddItem }) => { const [name, setName] = useState(''); const [price, setPrice] = useState(''); const [cost, setCost] = useState(''); const [deviceCategory, setDeviceCategory] = useState('Lainnya'); const handleSubmit = (e) => { e.preventDefault(); if (!name || !price) { alert("Nama Jasa dan Harga Jual harus diisi."); return; } const newItem = { id: `custom-${Date.now()}`, name, price: parseFloat(parseRupiah(price)), cost: parseFloat(parseRupiah(cost) || 0), device_category: deviceCategory, part_category: 'Lainnya', }; onAddItem(newItem); onClose(); }; useEffect(() => { if (!isOpen) { setName(''); setPrice(''); setCost(''); setDeviceCategory('Lainnya'); } }, [isOpen]); if (!isOpen) return null; return (<div className="modal-overlay"><div className="modal-content"><h2>Tambah Jasa / Produk Baru</h2><form onSubmit={handleSubmit}><div className="form-group"><label>Nama Jasa / Produk</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="cth: Ganti Konektor Charger Vivo Y12" required /></div><div className="form-group"><label>Harga Jual</label><input type="text" value={price} onChange={e => setPrice(formatToRupiah(parseRupiah(e.target.value)))} placeholder="Rp 0" required /></div><div className="form-group"><label>Harga Modal (Opsional)</label><input type="text" value={cost} onChange={e => setCost(formatToRupiah(parseRupiah(e.target.value)))} placeholder="Rp 0" /></div><div className="form-group"><label>Kategori Perangkat</label><select value={deviceCategory} onChange={e => setDeviceCategory(e.target.value)}><option>Hape</option><option>Laptop</option><option>Printer</option><option>Lainnya</option></select></div><div className="modal-actions"><button type="button" className="btn-secondary" onClick={onClose}>Batal</button><button type="submit" className="btn-primary">Tambah</button></div></form></div></div>); };
const SuccessModal = ({ isOpen, onClose, onConfirm }) => { if (!isOpen) return null; return (<div className="modal-overlay-success"><div className="modal-content-success"><FiCheckCircle className="success-icon" /><h2>Transaksi Berhasil!</h2><p>Data transaksi telah berhasil disimpan.</p><div className="success-actions"><button className="btn-success-cancel" onClick={onClose}>Tutup</button><button className="btn-success-confirm" onClick={onConfirm}>Cetak Struk</button></div></div></div>); };

const KasirPage = ({ token }) => {
  const [productList, setProductList] = useState(initialProductList);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [amountPaid, setAmountPaid] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const filteredProducts = useMemo(() => { let result = productList; if (activeCategory !== 'Semua') { result = result.filter(p => p.device_category === activeCategory); } if (searchTerm) { result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())); } return result; }, [searchTerm, activeCategory, productList]);
  const handleAddCustomItem = (newItem) => { setProductList(prevList => [newItem, ...prevList]); handleAddToCart(newItem); };
  const handleAddToCart = (product) => { setCart(prevCart => { const existingItem = prevCart.find(item => item.id === product.id); if (existingItem) { return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item); } else { return [...prevCart, { ...product, quantity: 1 }]; } }); };
  const handleRemoveFromCart = (productId) => { setCart(prevCart => prevCart.filter(item => item.id !== productId)); };
  const handleQuantityChange = (productId, newQuantity) => { if (newQuantity < 1) { handleRemoveFromCart(productId); } else { setCart(prevCart => prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item)); } };
  const summary = useMemo(() => { const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0); const total = subtotal; const change = parseFloat(parseRupiah(amountPaid)) - total; return { subtotal, total, change }; }, [cart, amountPaid]);
  const handleOpenEditModal = (e, product) => { e.stopPropagation(); setEditingProduct(product); setIsEditModalOpen(true); };
  const handleSaveEdit = (updatedProduct) => { setProductList(prevList => prevList.map(p => (p.id === updatedProduct.id ? updatedProduct : p))); setCart(prevCart => prevCart.map(item => (item.id === updatedProduct.id ? { ...item, ...updatedProduct } : item))); setIsEditModalOpen(false); setEditingProduct(null); };
  const handleDeleteProduct = (e, productId) => { e.stopPropagation(); if (window.confirm("Anda yakin ingin menghapus produk ini dari daftar?")) { setProductList(prevList => prevList.filter(p => p.id !== productId)); handleRemoveFromCart(productId); } };
  const resetTransaction = () => { setCart([]); setCustomerName(''); setTechnicianName(''); setPaymentMethod('Tunai'); setAmountPaid(''); setError(''); setSearchTerm(''); setActiveCategory('Semua'); };

  const handleCheckout = async () => {
    if (cart.length === 0) { setError('Keranjang kosong, tidak ada yang bisa diproses.'); return; }
    setIsSaving(true);
    setError('');

    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const transactionPromises = cart.map(item => {
      const transactionData = {
        customer_name: customerName || null,
        description: `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`,
        revenue: item.price * item.quantity,
        cost_of_goods: 0,
        technician_name: technicianName || null,
        payment_method: paymentMethod,
        transaction_date: formattedDate,
        device_category: item.device_category,
        part_category: item.part_category,
        work_category: 'Penjualan',
      };
      
      // --- PERBAIKAN DI SINI ---
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/transactions/`;
      return axios.post(apiUrl, transactionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });

    try {
      await Promise.all(transactionPromises);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Checkout error:', err.response?.data || err);
      setError(err.response?.data?.detail || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Sisa kode tidak perlu diubah...
  const categories = ['Semua', ...new Set(productList.map(p => p.device_category))];
  return (
    <div className="kasir-layout">
      <SuccessModal isOpen={showSuccessModal} onClose={() => { setShowSuccessModal(false); resetTransaction(); }} onConfirm={() => { alert("Fungsi cetak struk sedang dalam pengembangan."); setShowSuccessModal(false); resetTransaction(); }} />
      <EditProductModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} product={editingProduct} onSave={handleSaveEdit} />
      <AddCustomItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddItem={handleAddCustomItem} />
      <main className="kasir-main-wrapper"><div className="product-list-container"><div className="product-list-header"><h2>Daftar Jasa & Suku Cadang</h2><button className="add-new-service-btn" onClick={() => setIsModalOpen(true)}><FiPackage /><span>Tambah Jasa Baru</span></button></div><div className="product-toolbar"><div className="search-bar"><FiSearch /><input type="text" placeholder="Cari jasa atau produk..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><div className="product-filters">{categories.map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={activeCategory === cat ? 'active' : ''}>{cat}</button>))}</div></div><div className="product-grid">{filteredProducts.map(product => (<div key={product.id} className="product-card" onClick={() => handleAddToCart(product)}><div className="product-info"><h4>{product.name}</h4><p>{product.device_category}</p></div><div className="product-action"><span>{formatToRupiah(product.price)}</span><div className="action-icons"><button onClick={(e) => handleOpenEditModal(e, product)} className="edit-icon-btn" title="Edit Produk"><FiEdit /></button><button onClick={(e) => handleDeleteProduct(e, product.id)} className="delete-icon-btn" title="Hapus Produk"><FiTrash2 /></button><FiPlusCircle className="add-icon"/></div></div></div>))}</div></div></main>
      <aside className="kasir-sidebar"><div className="sidebar-header-section"><h2>Ringkasan Transaksi</h2><div className="sidebar-info-section"><div className="info-input-group"><FiUser /><input type="text" placeholder="Nama Pelanggan (Opsional)" value={customerName} onChange={e => setCustomerName(e.target.value)} /></div><div className="info-input-group"><FiTool /><input type="text" placeholder="Nama Teknisi (Opsional)" value={technicianName} onChange={e => setTechnicianName(e.target.value)} /></div></div></div><div className="sidebar-content"><div className="cart-items">{cart.length === 0 ? <p className="empty-cart">Keranjang masih kosong</p> : cart.map(item => (<div key={item.id} className="cart-item"><div className="item-details"><p className="item-name">{item.name}</p><p className="item-price">{formatToRupiah(item.price)}</p></div><div className="quantity-stepper"><button onClick={() => handleQuantityChange(item.id, item.quantity - 1)}><FiMinus /></button><span>{item.quantity}</span><button onClick={() => handleQuantityChange(item.id, item.quantity + 1)}><FiPlus /></button></div><p className="item-subtotal">{formatToRupiah(item.price * item.quantity)}</p><button className="remove-item-btn" onClick={() => handleRemoveFromCart(item.id)}><FiX /></button></div>))}</div></div><div className="sidebar-footer"><div className="summary-details"><div className="summary-line"><span>Subtotal</span><span>{formatToRupiah(summary.subtotal)}</span></div><div className="total-line"><span>Total Tagihan</span><span>{formatToRupiah(summary.total)}</span></div></div><div className="payment-section"><label>Metode Pembayaran</label><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option>Tunai</option><option>Transfer BCA</option><option>Transfer BSI</option><option>QRIS</option></select><label>Jumlah Bayar</label><div className="payment-controls"><input type="text" placeholder="Rp 0" value={amountPaid} onChange={e => setAmountPaid(formatToRupiah(parseRupiah(e.target.value)))} /><button className="quick-cash-btn" onClick={() => setAmountPaid(formatToRupiah(summary.total))}>Uang Pas</button></div></div><div className="change-display"><span>Kembalian</span><span>{summary.change >= 0 ? formatToRupiah(summary.change) : '-'}</span></div>{error && <p className="error">{error}</p>}<button className="checkout-button" onClick={handleCheckout} disabled={isSaving || cart.length === 0}>{isSaving ? 'Memproses...' : 'Selesaikan Transaksi'}</button></div></aside>
    </div>
  );
};

const initialProductList = [{ id: 10, name: 'Upgrade SSD - Paket Premium', device_category: 'Laptop', part_category: 'Paket Upgrade - Premium', price: 750000, cost: 0 }, { id: 11, name: 'Upgrade SSD - Paket Basic', device_category: 'Laptop', part_category: 'Paket Upgrade - Basic', price: 500000, cost: 0 }, { id: 12, name: 'Papan Charger Biasa', device_category: 'Hape', part_category: 'Papan Charger', price: 125000, cost: 0 }, { id: 13, name: 'Papan Charger Ori', device_category: 'Hape', part_category: 'Papan Charger', price: 150000, cost: 0 }, { id: 1, name: 'Ganti LCD STANDAR', device_category: 'Hape', part_category: 'LCD', price: 350000, cost: 0 }, { id: 2, name: 'Ganti Baterai STANDAR', device_category: 'Hape', part_category: 'Battery', price: 200000, cost: 0 }, { id: 23, name: 'Ganti Baterai ORI', device_category: 'Hape', part_category: 'Battery', price: 250000, cost: 0 }, { id: 3, name: 'Install Ulang Windows 11', device_category: 'Laptop', part_category: 'Software', price: 150000, cost: 0 }, { id: 4, name: 'Cleaning & Repasta', device_category: 'Laptop', part_category: 'Cleaning, Repasta', price: 100000, cost: 0 }, { id: 5, name: 'Ganti Keyboard Lenovo Ideapad', device_category: 'Laptop', part_category: 'Keyboard', price: 350000, cost: 0 }, { id: 6, name: 'Reset Printer Epson L3110', device_category: 'Printer', part_category: 'Reset', price: 75000, cost: 0 }, { id: 7, name: 'Jasa Pengecekan', device_category: 'Hape', part_category: 'Pengecekan', price: 50000, cost: 0 }, { id: 24, name: 'Jasa Pengecekan', device_category: 'Hape', part_category: 'Pengecekan', price: 75000, cost: 0 }, { id: 8, name: 'Cartridge Tinta Hitam', device_category: 'Printer', part_category: 'Cartridge Hitam', price: 225000, cost: 0 }, { id: 9, name: 'Software Remove Virus', device_category: 'Hape', part_category: 'Remove Virus', price: 75000, cost: 0 }, { id: 14, name: 'Upgrade SSD - Paket Exlusive', device_category: 'Laptop', part_category: '', price: 1050000, cost: 0 }, { id: 15, name: 'Install Ulang Win 10 - Cracked', device_category: 'Laptop', part_category: '', price: 150000, cost: 0 }, { id: 16, name: 'Install Ulang Win 11 - Cracked', device_category: 'Laptop', part_category: '', price: 150000, cost: 0 }, { id: 17, name: 'Install Ulang Win 10 - Ori', device_category: 'Laptop', part_category: '', price: 350000, cost: 0 }, { id: 18, name: 'Install Ulang Win 11 - Ori', device_category: 'Laptop', part_category: '', price: 350000, cost: 0 }, { id: 19, name: 'Install Ulang Win 10 - Ori', device_category: 'Laptop', part_category: '', price: 350000, cost: 0 }, { id: 20, name: 'Install Ulang Win 10 - Ori', device_category: 'Laptop', part_category: '', price: 350000, cost: 0 }, { id: 21, name: 'Install Ulang Win 10 - Ori', device_category: 'Laptop', part_category: '', price: 350000, cost: 0 }, { id: 22, name: 'Install Ulang Win 10 - Ori', device_category: 'Laptop', part_category: '', price: 350000, cost: 0 },];
export default KasirPage;