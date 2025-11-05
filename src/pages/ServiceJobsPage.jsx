// frontend/src/pages/ServiceJobsPage.jsx (FINAL DENGAN PERBAIKAN LOGIKA UPDATE STATUS)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../UserContext';
import { toast } from 'react-toastify';
import { formatToRupiah } from '../utils';
import { FaWhatsapp } from 'react-icons/fa';
import { FiTool, FiPlus, FiFilter, FiEdit, FiTrash2, FiChevronDown } from 'react-icons/fi';
import './ServiceJobsPage.css';

// --- Helper & Komponen Kecil (Tidak ada perubahan) ---
const parseRupiah = (rupiahString) => String(rupiahString || '').replace(/[^0-9]/g, '');

const generateServiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const randomPart = Math.floor(100 + Math.random() * 900);
    return `TGS-${year}${month}${day}-${randomPart}`;
};

const ALL_STATUSES = ['Menunggu Pengecekan', 'Menunggu Konfirmasi', 'Dalam Pengerjaan', 'Siap Diambil', 'Selesai', 'Dibatalkan'];
const ACTIVE_STATUSES = ['Menunggu Pengecekan', 'Menunggu Konfirmasi', 'Dalam Pengerjaan', 'Siap Diambil'];

const StatusDropdown = ({ job, onStatusChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const statusClass = job.status.replace(/\s+/g, '-').toLowerCase();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleOptionClick = (newStatus) => {
        if (newStatus !== job.status) {
            onStatusChange(job.id, newStatus);
        }
        setIsOpen(false);
    };

    return (
        <div className="status-dropdown-container" ref={dropdownRef}>
            <button className={`status-trigger ${statusClass}`} onClick={() => setIsOpen(!isOpen)}>
                <span>{job.status}</span>
                <FiChevronDown className={`chevron-icon ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="status-options-list">
                    <ul>
                        {ALL_STATUSES.map(status => {
                            const optionStatusClass = `status-option-${status.replace(/\s+/g, '-').toLowerCase()}`;
                            return (
                                <li
                                    key={status}
                                    className={`status-option ${job.status === status ? 'selected' : ''} ${optionStatusClass}`}
                                    onClick={() => handleOptionClick(status)}
                                >
                                    {status}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

const JobModal = ({ job, onClose, onSave }) => {
    const [formData, setFormData] = useState(job || {
        customer_name: '', customer_phone: '', device_description: '',
        estimated_cost: '', cost_of_goods: '', technician_name: '', commission_percentage: ''
    });
    useEffect(() => {
        setFormData(job || {
            customer_name: '', customer_phone: '', device_description: '',
            estimated_cost: '', cost_of_goods: '', technician_name: '', commission_percentage: ''
        });
    }, [job]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleNumericChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseRupiah(value) }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            estimated_cost: parseFloat(formData.estimated_cost || 0),
            cost_of_goods: parseFloat(formData.cost_of_goods || 0),
            commission_percentage: parseInt(formData.commission_percentage || 0)
        };
        onSave(dataToSave);
    };
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{job ? 'Edit Detail Servisan' : 'Tambah Servisan Baru'}</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-grid">
                        <div className="form-group"><label>Nama Pelanggan</label><input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Nomor Telepon (WA)</label><input type="tel" name="customer_phone" placeholder="Contoh: 08123456789" value={formData.customer_phone || ''} onChange={handleChange} /></div>
                    </div>
                    <div className="form-group"><label>Perangkat & Keluhan</label><input type="text" name="device_description" value={formData.device_description} onChange={handleChange} required /></div>
                    <div className="form-grid">
                        <div className="form-group"><label>Biaya Servis</label><input type="text" name="estimated_cost" value={formatToRupiah(formData.estimated_cost)} onChange={handleNumericChange} required /></div>
                        <div className="form-group"><label>Modal Barang</label><input type="text" name="cost_of_goods" value={formatToRupiah(formData.cost_of_goods)} onChange={handleNumericChange} /></div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group"><label>Nama Teknisi</label><input type="text" name="technician_name" value={formData.technician_name || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Komisi Teknisi %</label><input type="number" name="commission_percentage" value={formData.commission_percentage || ''} onChange={handleChange} min="0" max="100"/></div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
                        <button type="submit" className="btn-primary">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Komponen Utama Halaman ---
const ServiceJobsPage = () => {
    const currentUser = useUser();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [statusFilter, setStatusFilter] = useState('Aktif');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTableData = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase.from('service_jobs').select('*');
            if (statusFilter === 'Aktif') {
                query = query.in('status', ACTIVE_STATUSES);
            } else if (statusFilter !== 'Semua') {
                query = query.eq('status', statusFilter);
            }
            if (searchTerm) {
                query = query.or(`customer_name.ilike.%${searchTerm}%,device_description.ilike.%${searchTerm}%,service_number.ilike.%${searchTerm}%`);
            }
            const { data, error } = await query.order('entry_date', { ascending: false }); 
            if (error) throw error;
            setJobs(data);
        } catch (error) {
            toast.error("Gagal memuat data tabel: " + error.message);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, searchTerm]);

    useEffect(() => {
        fetchTableData();
    }, [fetchTableData]);
    
    const handleOpenModal = (job = null) => {
        setEditingJob(job);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingJob(null);
    };

    const handleSaveJob = async (jobData) => {
        if (editingJob) {
            const { id, created_at, entry_date, service_number, ...updateData } = jobData;
            const { error } = await supabase.from('service_jobs').update(updateData).eq('id', editingJob.id);
            if (error) { toast.error("Gagal menyimpan: " + error.message); } 
            else { toast.success("Servisan berhasil diperbarui!"); }
        } else {
            const { error } = await supabase.from('service_jobs').insert([{
                ...jobData, service_number: generateServiceNumber(), status: 'Menunggu Pengecekan', recorded_by_user_id: currentUser.id
            }]);
            if (error) { toast.error("Gagal menambah: " + error.message); }
            else { toast.success("Servisan baru berhasil ditambahkan!"); }
        }
        handleCloseModal();
        fetchTableData();
    };

    const handleDeleteJob = async (jobId, jobName) => {
        if (window.confirm(`Anda yakin ingin menghapus servisan untuk "${jobName}"?`)) {
            const { error } = await supabase.from('service_jobs').delete().eq('id', jobId);
            if (error) { toast.error("Gagal menghapus: " + error.message); }
            else { 
                toast.success("Servisan berhasil dihapus."); 
                fetchTableData();
            }
        }
    };

    const handleStatusChange = async (jobId, newStatus) => {
        const originalJobs = [...jobs];
        // 1. Lakukan pembaruan optimis pada UI
        setJobs(prevJobs => prevJobs.map(job =>
            job.id === jobId ? { ...job, status: newStatus } : job
        ));

        // 2. Kirim perubahan ke database
        const { error } = await supabase
            .from('service_jobs')
            .update({ status: newStatus })
            .eq('id', jobId);

        // 3. Tangani hasilnya
        if (error) {
            toast.error(`Gagal update status: ${error.message}`);
            setJobs(originalJobs); // Kembalikan ke state semula jika gagal
        } else {
            toast.success("Status berhasil diperbarui!");
            // --- PERUBAHAN KUNCI DI SINI ---
            // fetchTableData(); // HAPUS BARIS INI
        }
    };

    const handleSendWhatsAppNotification = (e, job) => {
        e.stopPropagation(); 

        if (!job.customer_phone) {
            toast.warn("Pelanggan ini tidak memiliki nomor telepon.");
            return;
        }
        
        let phoneNumber = job.customer_phone.trim();
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '62' + phoneNumber.substring(1);
        }

        const message = `Yth. Bpk/Ibu ${job.customer_name},\n\nServis perangkat "${job.device_description}" dengan no. servis ${job.service_number} telah SELESAI dan SIAP DIAMBIL.\n\nTerima kasih,\nTazakka Group Service`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="container">
            {isModalOpen && <JobModal job={editingJob} onClose={handleCloseModal} onSave={handleSaveJob} />}
            <header className="page-header">
                <h1><FiTool /> Manajemen Servisan</h1>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <FiPlus /> Tambah Servisan
                    </button>
                </div>
            </header>

            <div className="servisan-page-layout-single">
                <main className="main-content-area card-style">
                    <div className="table-toolbar">
                        <div className="search-box">
                           <FiFilter />
                           <input type="text" placeholder="Cari nama, perangkat, atau no. servis..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="status-filters">
                            <button className={statusFilter === 'Aktif' ? 'active' : ''} onClick={() => setStatusFilter('Aktif')}>Aktif</button>
                            <button className={statusFilter === 'Selesai' ? 'active' : ''} onClick={() => setStatusFilter('Selesai')}>Selesai</button>
                            <button className={statusFilter === 'Dibatalkan' ? 'active' : ''} onClick={() => setStatusFilter('Dibatalkan')}>Dibatalkan</button>
                            <button className={statusFilter === 'Semua' ? 'active' : ''} onClick={() => setStatusFilter('Semua')}>Semua</button>
                        </div>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>No. Servis</th><th>Pelanggan</th><th>Perangkat</th><th>Tgl Masuk</th><th>Biaya</th><th>Status</th><th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" style={{textAlign: 'center'}}>Memuat data...</td></tr>
                                ) : jobs.length === 0 ? (
                                    <tr><td colSpan="7" style={{textAlign: 'center'}}>Tidak ada data servisan yang cocok.</td></tr>
                                ) : (
                                    jobs.map(job => (
                                        <tr key={job.id}>
                                            <td data-label="No. Servis">{job.service_number}</td>
                                            <td data-label="Pelanggan">{job.customer_name}</td>
                                            <td data-label="Perangkat">{job.device_description}</td>
                                            <td data-label="Tgl Masuk">{new Date(job.entry_date).toLocaleDateString('id-ID')}</td>
                                            <td data-label="Biaya">{formatToRupiah(job.estimated_cost)}</td>
                                            <td data-label="Status">
                                                <StatusDropdown job={job} onStatusChange={handleStatusChange} />
                                            </td>
                                            <td data-label="Aksi">
                                                <div className="action-buttons">
                                                    {job.customer_phone && (
                                                        <button 
                                                            onClick={(e) => handleSendWhatsAppNotification(e, job)} 
                                                            className="btn-icon btn-whatsapp" 
                                                            title="Kirim Notifikasi WhatsApp"
                                                        >
                                                            <FaWhatsapp />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleOpenModal(job)} className="btn-icon" title="Edit"><FiEdit /></button>
                                                    <button onClick={() => handleDeleteJob(job.id, job.customer_name)} className="btn-icon btn-delete" title="Hapus"><FiTrash2 /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ServiceJobsPage;