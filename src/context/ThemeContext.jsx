import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); 
  const [loading, setLoading] = useState(true);

  // 🔍 ฟังก์ชันดึงค่าสิทธิ์ (role) จากตาราง public.profiles
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
      console.error("Error fetching user role from profiles:", err.message);
      setRole(null);
    }
  };

  useEffect(() => {
    // 🌟 1. Safety Timeout: ป้องกันเว็บค้างหน้า Loading เกิน 2.5 วินาทีในทุกกรณี
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      console.warn("⚠️ Auth checking took too long, forcing loading to false.");
    }, 2500);

    // 🌟 2. ใช้เฉพาะ onAuthStateChange ตามมาตรฐาน Supabase v2 (ลดปัญหาล็อกอิน Google แล้วค้าง)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("⚡ Auth Event Fired:", event);
      
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchUserRole(currentUser.id); 
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error("❌ Auth State Change Error:", err.message);
      } finally {
        // เคลียร์หน้าจอโหลด และยกเลิกตัวนับเวลาฉุกเฉินหากทำงานเสร็จก่อนเวลา
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
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
        redirectTo: window.location.origin, 
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
      setRole(null); 
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error.message);
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