// frontend/src/UserContext.jsx (VERSI FINAL YANG DIREKOMENDASIKAN)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const UserContext = createContext(null);

export const UserProvider = ({ session, children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      // Hanya jalankan jika ada sesi
      if (session?.user) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('users')
            .select('username, full_name, role') // Ambil data profil
            .eq('id', session.user.id)          // yang cocok dengan ID user login
            .single();                         // dan harapkan hanya satu hasil

          if (error) throw error;

          if (data) {
            // Gabungkan data profil dengan data sesi
            setUserProfile({
              ...session.user, // id, email, dll. dari Auth
              ...data,         // username, full_name, role dari tabel 'users'
            });
          }
        } catch (error) {
          console.error("Gagal mengambil data profil user:", error);
          setUserProfile(null);
        } finally {
          setLoading(false);
        }
      } else {
        // Jika tidak ada sesi (logout), pastikan profil kosong
        setUserProfile(null);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [session]); // Jalankan ulang setiap kali sesi berubah

  // --- PERBAIKAN DI SINI ---
  // Selalu sediakan value ke provider.
  // Komponen anak (seperti MainLayout) akan menampilkan "Memuat..." jika value-nya masih null.
  return (
    <UserContext.Provider value={userProfile}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};