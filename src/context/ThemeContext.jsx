import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✨ ย้ายฟังก์ชันมาไว้ข้างใน useEffect เพื่อเคลียร์ปัญหา ESLint Dependency พังตอนบิลด์
    const fetchUserRole = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        setRole(data?.role ?? null); 
      } catch (err) {
        setRole(null);
      }
    };

    // ตัวตั้งเวลาฉุกเฉิน (Safety Timeout) ป้องกันหน้าโหลดค้าง
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    // ติดตามสถานะและดึงเซสชันอัตโนมัติจาก Supabase v2
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchUserRole(currentUser.id); 
        } else {
          setRole(null);
        }
      } catch (err) {
        // จัดการข้อผิดพลาดเงียบๆ เพื่อไม่ให้บิลด์พัง
      } finally {
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  // ฟังก์ชันสมัครสมาชิก
  const signUp = (email, password) => supabase.auth.signUp({ email, password });

  // ฟังก์ชันล็อกอินด้วยอีเมล
  const logIn = (email, password) => supabase.auth.signInWithPassword({ email, password });

  // ฟังก์ชันล็อกอินด้วย Google
  const loginWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, 
        },
      });
    } catch (err) {
      // โหมด Production จะไม่ใช้ console.error เพื่อความปลอดภัยในการบิลด์
    }
  };

  // ฟังก์ชันล็อกเอาต์
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null); 
      setRole(null); 
    } catch (error) {
      // จัดการข้อผิดพลาดเบื้องหลัง
    }
  };

  const value = {
    user,
    role, 
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