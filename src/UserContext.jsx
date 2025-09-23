// frontend/src/UserContext.jsx (VERSI FINAL DENGAN LOGIKA RENDERING YANG DISEMPURNAKAN)

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

          if (error) {
            // Jika ada error (misalnya RLS gagal), lempar error agar bisa ditangkap
            throw error;
          }

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
          // Apapun yang terjadi, proses loading selesai
          setLoading(false);
        }
      } else {
        // Jika tidak ada sesi (logout), pastikan profil kosong dan loading selesai
        setUserProfile(null);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [session]); // Jalankan ulang setiap kali sesi berubah

  // --- PENYEMPURNAAN UTAMA DI SINI ---
  // Kita sekarang menyediakan value ke provider, TAPI kita hanya merender komponen 
  // anak (`children`) setelah proses loading selesai (`!loading`).
  // Ini adalah cara paling aman untuk memastikan MainLayout dan komponen lainnya
  // tidak pernah mencoba mengakses data user sebelum data tersebut benar-benar siap.
  return (
    <UserContext.Provider value={userProfile}>
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};