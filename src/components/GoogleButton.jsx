import React from 'react';
import { supabase } from '../supabaseClient'; // ตรวจสอบ Path ให้แน่ใจว่าชี้ไปที่ไฟล์ supabaseClient.js ของคุณ

export default function GoogleButton() {
  
  const handleGoogleLogin = async () => {
    console.log("ปุ่มถูกกดแล้ว! กำลังเตรียมเรียกใช้ Supabase Auth...");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/', // URL ที่จะกลับมาหลัง Login
      },
    });

    if (error) {
      console.error("Error จาก Supabase:", error.message);
    } else {
      console.log("กำลังนำทางไปที่ Google...");
    }
  };

  return (
    <button 
      onClick={handleGoogleLogin} 
      className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
    >
      เข้าสู่ระบบด้วย Google
    </button>
  );
}