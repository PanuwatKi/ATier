import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 1. ตั้งค่าเริ่มต้นให้เป็น 'light' หรือ 'dark' ไปก่อน เพื่อป้องกัน Error ตอน Render ครั้งแรก
  const [theme, setTheme] = useState('light');

  // 2. ใช้ useEffect ในการโหลดค่าจาก localStorage เพื่อให้มั่นใจว่ารันเฉพาะในเบราว์เซอร์เท่านั้น
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    setTheme(savedTheme || systemTheme);
  }, []);

  // 3. ใช้ useEffect แยกสำหรับอัปเดต DOM
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}