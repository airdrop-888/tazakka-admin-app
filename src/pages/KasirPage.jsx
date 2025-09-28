// frontend/src/pages/KasirPage.jsx (VERSI FINAL DENGAN UI MOBILE BARU TERINTEGRASI)

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
// PERBAIKAN: Menambahkan FiShoppingCart dan FiArrowLeft untuk UI mobile
import { FiPlusCircle, FiX, FiMinus, FiPlus, FiSearch, FiPackage, FiEdit, FiTrash2, FiUser, FiTool, FiCheckCircle, FiShoppingCart, FiArrowLeft } from 'react-icons/fi';
import './KasirPage.css';

// --- Helper Functions ---
const formatToRupiah = (number) => {
  if (number === null || number === undefined || isNaN(number) || number === '') return 'Rp 0';
  const numericValue = parseInt(String(number).replace(/[^0-9-]/g, ''), 10);
  if (isNaN(numericValue)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericValue);
};

const parseRupiah = (rupiahString) => {
  return String(rupiahString || '').replace(/[^0-9]/g, '');
};

// --- LOGIKA BARU 1: Custom Hook untuk deteksi mobile (konsisten dengan halaman lain) ---
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);
  return matches;
};


// --- Komponen Modal yang Diimplementasikan (Tidak ada perubahan) ---
const AddCustomItemModal = ({ isOpen, onClose, onAddItem }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [device_category, setDeviceCategory] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !price || !device_category) {
      setError('Nama, Harga, dan Kategori wajib diisi.');
      return;
    }
    onAddItem({
      name,
      price: parseFloat(parseRupiah(price)),
      cost: parseFloat(parseRupiah(cost)) || 0,
      device_category,
      part_category: 'Jasa',
    });
    setName(''); setPrice(''); setCost(''); setDeviceCategory(''); setError('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Tambah Jasa / Produk Baru</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <input type="text" placeholder="Nama Jasa / Produk" value={name} onChange={e => setName(e.target.value)} required />
          <input type="text" placeholder="Harga Jual (Rp)" value={formatToRupiah(price)} onChange={e => setPrice(parseRupiah(e.target.value))} required />
          <input type="text" placeholder="Harga Modal (Rp, Opsional)" value={formatToRupiah(cost)} onChange={e => setCost(parseRupiah(e.target.value))} />
          <input type="text" placeholder="Kategori (misal: Hape, Laptop)" value={device_category} onChange={e => setDeviceCategory(e.target.value)} required />
          {error && <p className="error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditProductModal = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState(product);

  useEffect(() => {
    setFormData(product);
  }, [product]);

  if (!isOpen || !formData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e) => {
    const { name } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseRupiah(e.target.value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productToSave = {
      ...formData,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost) || 0,
    };
    onSave(productToSave);
  };
  
  return (
     <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Edit Jasa / Produk</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <input type="text" name="name" placeholder="Nama Jasa / Produk" value={formData.name || ''} onChange={handleChange} required />
          <input type="text" name="price" placeholder="Harga Jual (Rp)" value={formatToRupiah(formData.price)} onChange={handlePriceChange} required />
          <input type="text" name="cost" placeholder="Harga Modal (Rp, Opsional)" value={formatToRupiah(formData.cost)} onChange={handlePriceChange} />
          <input type="text" name="device_category" placeholder="Kategori" value={formData.device_category || ''} onChange={handleChange} required />
          <input type="text" name="part_category" placeholder="Kategori Part" value={formData.part_category || ''} onChange={handleChange} required />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary">Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SuccessModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-content success-modal">
        <FiCheckCircle className="success-icon" />
        <h2>Transaksi Berhasil!</h2>
        <p>Transaksi telah berhasil disimpan.</p>
        <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Tutup</button>
            <button type="button" className="btn-primary" onClick={onConfirm}>Cetak Struk</button>
        </div>
      </div>
    </div>
  );
};


// --- Komponen Utama KasirPage ---
const KasirPage = () => {
  const currentUser = useUser();
  const [productList, setProductList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [amountPaid, setAmountPaid] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- LOGIKA BARU 2: State untuk mengontrol UI mobile ---
  const isMobile = useMediaQuery('(max-width: 1200px)');
  const [isCartVisibleMobile, setIsCartVisibleMobile] = useState(false);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      console.error("Gagal mengambil data produk:", error);
      setError("Gagal memuat daftar produk.");
    } else {
      setProductList(data);
    }
    setLoadingProducts(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddCustomItem = async (newItem) => {
    const { error } = await supabase.from('products').insert([newItem]).select();
    if (error) { 
      console.error(error); 
      setError("Gagal menambah produk: " + error.message);
    } else { 
      await fetchProducts(); 
      setIsModalOpen(false);
    }
  };
  
  const handleSaveEdit = async (updatedProduct) => {
    const { id, ...productData } = updatedProduct;
    const { error } = await supabase.from('products').update(productData).eq('id', id);
    if (error) { 
      console.error(error); 
      setError("Gagal menyimpan perubahan: " + error.message);
    } else { 
      await fetchProducts(); 
      setIsEditModalOpen(false);
    }
  };

  const handleDeleteProduct = async (e, productId) => {
    e.stopPropagation();
    if (window.confirm("Anda yakin ingin menghapus produk ini dari daftar?")) {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) { 
        console.error(error); 
        setError("Gagal menghapus produk: " + error.message);
      } else { 
        await fetchProducts(); 
        handleRemoveFromCart(productId); 
      }
    }
  };

  const filteredProducts = useMemo(() => {
    let result = productList;
    if (activeCategory !== 'Semua') { result = result.filter(p => p.device_category === activeCategory); }
    if (searchTerm) { result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())); }
    return result;
  }, [searchTerm, activeCategory, productList]);
  
  const handleAddToCart = (product) => { setCart(prevCart => { const existingItem = prevCart.find(item => item.id === product.id); if (existingItem) { return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item); } else { return [...prevCart, { ...product, quantity: 1 }]; } }); };
  const handleRemoveFromCart = (productId) => { setCart(prevCart => prevCart.filter(item => item.id !== productId)); };
  const handleQuantityChange = (productId, newQuantity) => { if (newQuantity < 1) { handleRemoveFromCart(productId); } else { setCart(prevCart => prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item)); } };
  
  // PERBAIKAN: Menambahkan `totalItems` ke kalkulasi summary untuk ditampilkan di FAB
  const summary = useMemo(() => { 
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0); 
    const total = subtotal; 
    const change = parseFloat(parseRupiah(amountPaid)) - total; 
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, total, change, totalItems }; 
  }, [cart, amountPaid]);

  const handleOpenEditModal = (e, product) => { e.stopPropagation(); setEditingProduct(product); setIsEditModalOpen(true); };
  const resetTransaction = () => { setCart([]); setCustomerName(''); setTechnicianName(''); setPaymentMethod('Tunai'); setAmountPaid(''); setError(''); setSearchTerm(''); setActiveCategory('Semua'); };
  
  const handleCheckout = async () => {
    if (cart.length === 0) { setError('Keranjang kosong.'); return; }
    if (!currentUser) { setError('Gagal mendapatkan data user. Silakan login ulang.'); return; }
    
    setIsSaving(true);
    setError('');

    const transactionsToInsert = cart.map(item => {
      return {
        customer_name: customerName || null,
        description: `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`,
        revenue: item.price * item.quantity,
        cost_of_goods: (item.cost || 0) * item.quantity,
        technician_name: technicianName || null,
        payment_method: paymentMethod,
        transaction_date: new Date().toISOString(),
        device_category: item.device_category,
        part_category: item.part_category || 'Lainnya',
        work_category: 'Penjualan',
        recorded_by_user_id: currentUser.id,
      };
    });

    try {
      const { error: insertError } = await supabase.from('transactions').insert(transactionsToInsert).select();
      if (insertError) { throw insertError; }
      
      setShowSuccessModal(true);
      // PERBAIKAN: Otomatis tutup panel keranjang mobile setelah transaksi sukses
      setIsCartVisibleMobile(false);

    } catch (err) {
      console.error('ERROR SAAT CHECKOUT:', err);
      setError(err.message || 'Gagal menyimpan transaksi. Periksa console untuk detail.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const categories = ['Semua', ...new Set(productList.map(p => p.device_category).filter(Boolean))];

  // --- LOGIKA BARU 3: Komponen render terpisah untuk sidebar agar tidak duplikasi kode ---
  const renderSidebarContent = () => (
    <>
      <div className="sidebar-header-section">
        {isMobile && (
          <button className="mobile-cart-back-btn" onClick={() => setIsCartVisibleMobile(false)}>
            <FiArrowLeft /> Kembali ke Produk
          </button>
        )}
        <h2>Ringkasan Transaksi</h2>
        <div className="sidebar-info-section">
          <div className="info-input-group"><FiUser /><input type="text" placeholder="Nama Pelanggan (Opsional)" value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
          <div className="info-input-group"><FiTool /><input type="text" placeholder="Nama Teknisi (Opsional)" value={technicianName} onChange={e => setTechnicianName(e.target.value)} /></div>
        </div>
      </div>
      <div className="sidebar-content">
        <div className="cart-items">
          {cart.length === 0 
            ? <p className="empty-cart">Keranjang masih kosong</p> 
            : cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-details"><p className="item-name">{item.name}</p><p className="item-price">{formatToRupiah(item.price)}</p></div>
                  <div className="quantity-stepper"><button onClick={() => handleQuantityChange(item.id, item.quantity - 1)}><FiMinus /></button><span>{item.quantity}</span><button onClick={() => handleQuantityChange(item.id, item.quantity + 1)}><FiPlus /></button></div>
                  <p className="item-subtotal">{formatToRupiah(item.price * item.quantity)}</p>
                  <button className="remove-item-btn" onClick={() => handleRemoveFromCart(item.id)}><FiX /></button>
                </div>
            ))
          }
        </div>
      </div>
      <div className="sidebar-footer">
        <div className="summary-details">
            <div className="summary-line"><span>Subtotal</span><span>{formatToRupiah(summary.subtotal)}</span></div>
            <div className="total-line"><span>Total Tagihan</span><span>{formatToRupiah(summary.total)}</span></div>
        </div>
        <div className="payment-section">
          <label>Metode Pembayaran</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option>Tunai</option><option>Transfer BCA</option><option>Transfer BSI</option><option>QRIS</option></select>
          <label>Jumlah Bayar</label>
          <div className="payment-controls">
              <input type="text" placeholder="Rp 0" value={formatToRupiah(amountPaid)} onChange={e => setAmountPaid(parseRupiah(e.target.value))} />
              <button className="quick-cash-btn" onClick={() => setAmountPaid(formatToRupiah(summary.total))}>Uang Pas</button>
          </div>
        </div>
        <div className="change-display"><span>Kembalian</span><span>{summary.change >= 0 ? formatToRupiah(summary.change) : '-'}</span></div>
        {error && <p className="error" style={{textAlign: 'center', marginTop: '10px'}}>{error}</p>}
        <button className="checkout-button" onClick={handleCheckout} disabled={isSaving || cart.length === 0}>
          {isSaving ? 'Memproses...' : (<span><FiCheckCircle /> Selesaikan Transaksi</span>)}
        </button>
      </div>
    </>
  );

  return (
    <div className="kasir-layout">
      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => { setShowSuccessModal(false); resetTransaction(); }} 
        onConfirm={() => { alert("Fungsi cetak struk sedang dalam pengembangan."); setShowSuccessModal(false); resetTransaction(); }} 
      />
      <EditProductModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} product={editingProduct} onSave={handleSaveEdit} />
      <AddCustomItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddItem={handleAddCustomItem} />

      <main className="kasir-main-wrapper">
         <div className="product-list-container">
          <div className="product-list-header">
            <h2>Daftar Jasa & Suku Cadang</h2>
            <button className="add-new-service-btn" onClick={() => setIsModalOpen(true)}><FiPackage /><span>Tambah Jasa Baru</span></button>
          </div>
          <div className="product-toolbar">
            <div className="search-bar"><FiSearch /><input type="text" placeholder="Cari jasa atau produk..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            <div className="product-filters">{categories.map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={activeCategory === cat ? 'active' : ''}>{cat}</button>))}</div>
          </div>
          
          <div className="product-grid">
            {loadingProducts ? (
              <p>Memuat daftar produk...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : filteredProducts.length === 0 ? (
              <p>Tidak ada produk yang ditemukan. Coba kata kunci lain atau tambahkan produk baru.</p>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} className="product-card" onClick={() => handleAddToCart(product)}>
                  <div className="product-info"><h4>{product.name}</h4><p>{product.device_category}</p></div>
                  <div className="product-action">
                    <span>{formatToRupiah(product.price)}</span>
                    <div className="action-icons">
                      <button onClick={(e) => handleOpenEditModal(e, product)} className="edit-icon-btn" title="Edit Produk"><FiEdit /></button>
                      <button onClick={(e) => handleDeleteProduct(e, product.id)} className="delete-icon-btn" title="Hapus Produk"><FiTrash2 /></button>
                      <FiPlusCircle className="add-icon"/>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      
      {/* --- LOGIKA BARU 4: Tampilkan sidebar atau FAB + Overlay berdasarkan ukuran layar --- */}
      {!isMobile && (
        <aside className="kasir-sidebar">
          {renderSidebarContent()}
        </aside>
      )}

      {isMobile && cart.length > 0 && (
        <button className="fab-cart-button" onClick={() => setIsCartVisibleMobile(true)}>
          <FiShoppingCart />
          <div className="fab-cart-info">
            <span>{summary.totalItems} Item</span>
            <span>{formatToRupiah(summary.total)}</span>
          </div>
        </button>
      )}

      {isMobile && (
        <div className={`mobile-cart-overlay ${isCartVisibleMobile ? 'visible' : ''}`} onClick={() => setIsCartVisibleMobile(false)}>
           <aside className="kasir-sidebar mobile-view" onClick={e => e.stopPropagation()}>
              {renderSidebarContent()}
           </aside>
        </div>
      )}
      
    </div>
  );
};

export default KasirPage;