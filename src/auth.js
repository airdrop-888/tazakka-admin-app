// frontend/src/auth.js (KODE JAVASCRIPT YANG BENAR)

import { jwtDecode } from 'jwt-decode';

export const getUserRole = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }
  try {
    const decodedToken = jwtDecode(token);
    // Pastikan backend Anda menyertakan 'role' di dalam token
    return decodedToken.role; 
  } catch (error) {
    console.error("Invalid token:", error);
    // Hapus token yang tidak valid agar tidak menyebabkan error berulang
    localStorage.removeItem('token'); 
    return null;
  }
};