import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 1. ดึงค่าเริ่มต้นจาก localStorage หรือเช็คจากระบบของเครื่องผู้ใช้ (System Preference)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      
      // ถ้าไม่มีการบันทึกไว้ ให้เช็คว่าเครื่องผู้ใช้เปิดโหมดมืดอยู่หรือไม่
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return systemPrefersDark ? 'dark' : 'light';
    }
    return 'light';
  });

  // 2. จัดการเพิ่ม/ลบ class 'dark' ที่ <html> tag ทุกครั้งที่ธีมเปลี่ยน
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    // บันทึกค่าลงใน localStorage เพื่อเปิดเว็บครั้งถัดไปจะได้เป็นธีมเดิม
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 3. ฟังก์ชันสำหรับสลับธีม
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ✨ ส่งออก useTheme แบบ Named Export เพื่อให้ Navbar ดึงไปใช้ผ่าน { useTheme } ได้ถูกต้อง
export function useTheme() {
  return useContext(ThemeContext);
}