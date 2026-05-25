import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // ✨ สเตทสำหรับเก็บสิทธิ์ผู้ใช้
  const [loading, setLoading] = useState(true);

  // 🔍 ฟังก์ชันดึงค่าสิทธิ์ (role) จากตาราง public.profiles ข้ามตาราง
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setRole(data?.role ?? null); // บันทึกสิทธิ์ เช่น 'Super Admin' หรือ 'Admin' ลงสเตท
    } catch (err) {
      console.error("Error fetching user role from profiles:", err.message);
      setRole(null);
    }
  };

  useEffect(() => {
    // 1. ตรวจสอบ Session ปัจจุบันเมื่อเปิดเว็บขึ้นมาครั้งแรก
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchUserRole(currentUser.id); // ดึงสิทธิ์มาเก็บก่อนปิด Loading
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error("❌ Auth Initialization Error:", err.message);
        setUser(null);
        setRole(null);
      } finally {
        // 🌟 ปิดหน้าจอโหลดแน่นอน 100% ไม่ว่าจะโหลดสำเร็จหรือเกิด Error
        setLoading(false); 
      }
    };

    initializeAuth();

    // 2. เฝ้าติดตามการเปลี่ยนแปลงสถานะระบบ (เช่น มีการ Login, Logout หรือ Background Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchUserRole(currentUser.id); // ดึงสิทธิ์ใหม่ทันทีที่ล็อกอินสำเร็จ
        } else {
          setRole(null); // ล้างสิทธิ์เมื่อออกจากระบบ
        }
      } catch (err) {
        console.error("❌ Auth State Change Error:", err.message);
      } finally {
        // 🌟 มั่นใจว่าสเตทโหลดจะถูกเคลียร์ออกเมื่อระบบ Auth ทำงานเบื้องหลังเสร็จสิ้น
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ฟังก์ชันสมัครสมาชิก
  const signUp = (email, password) => supabase.auth.signUp({ email, password });

  // ฟังก์ชันล็อกอินด้วยอีเมล
  const logIn = (email, password) => supabase.auth.signInWithPassword({ email, password });

  // ฟังก์ชันล็อกอินด้วย Google
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // ตรวจสอบให้ตรงกับ URL เว็บของคุณ
      },
    });
    if (error) console.error("Error logging in with Google:", error.message);
  };

  // ฟังก์ชันล็อกเอาต์
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null); 
      setRole(null); // เคลียร์ค่าสิทธิ์หลังล็อกเอาต์สำเร็จ
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const value = {
    user,
    role, // ✨ ส่งออกค่า role ไปให้หน้า Home และ Courses นำไปตรวจสอบสิทธิ์
    signUp,
    logIn,
    logout,
    signOut: logout, 
    loginWithGoogle,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900 text-gray-500">
          <div className="text-center space-y-2">
            {/* ใส่ไอคอนหมุน/เอฟเฟกต์ pulse ให้นุ่มนวลขึ้น */}
            <p className="animate-pulse font-medium text-sm">กำลังตรวจสอบสิทธิ์เข้าใช้งานระบบ โปรดรอสักครู่...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}