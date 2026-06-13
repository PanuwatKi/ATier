import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // สิทธิ์ผู้ใช้ ('Super Admin' | 'Admin' | 'General User')
  const [loading, setLoading] = useState(true);

  // 🔍 ดึงค่าสิทธิ์ (role) จากตาราง public.profiles
  // ⚠️ ห้าม await ฟังก์ชันนี้ "ภายใน" callback ของ onAuthStateChange เด็ดขาด
  // เพราะ supabase-js ถือ lock อยู่ระหว่าง callback ทำให้ client ค้าง (deadlock)
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
      console.error('Error fetching user role from profiles:', err.message);
      setRole(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 🛟 กันหน้าจอ Loading หมุนค้างตลอดกาล: ปลดล็อกแน่นอนภายใน 5 วินาที
    const safety = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    // 1) ตรวจ session ปัจจุบันตอนเปิดเว็บครั้งแรก
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          // เรียกแบบไม่ await — ไม่บล็อกการ render และ role จะถูกเติมตามมาทันที
          fetchUserRole(currentUser.id);
        } else {
          setRole(null);
        }
        setLoading(false);
        clearTimeout(safety);
      })
      .catch((err) => {
        console.error('❌ Auth Initialization Error:', err.message);
        if (!mounted) return;
        setUser(null);
        setRole(null);
        setLoading(false);
        clearTimeout(safety);
      });

    // 2) เฝ้าติดตามการเปลี่ยนสถานะ (login / logout / token refresh)
    //    callback นี้ต้อง "เบา" — ห้ามมี await supabase ข้างใน ให้ defer ออกไปแทน
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        // เลื่อนการ query ออกนอก callback เพื่อเลี่ยง deadlock ของ supabase-js
        setTimeout(() => {
          if (mounted) fetchUserRole(currentUser.id);
        }, 0);
      } else {
        setRole(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safety);
      subscription.unsubscribe();
    };
  }, []);

  // ฟังก์ชันสมัครสมาชิกด้วยอีเมล
  const signUp = (email, password) => supabase.auth.signUp({ email, password });

  // ฟังก์ชันล็อกอินด้วยอีเมล
  const logIn = (email, password) => supabase.auth.signInWithPassword({ email, password });

  // ฟังก์ชันล็อกอินด้วย Google
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // กลับมาที่ origin เดิมที่ผู้ใช้กดล็อกอิน (ต้องอยู่ใน Redirect allow-list ของ Supabase)
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Error logging in with Google:', error.message);
  };

  // ฟังก์ชันล็อกเอาต์
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Error logging out:', error.message);
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
    loading,
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
