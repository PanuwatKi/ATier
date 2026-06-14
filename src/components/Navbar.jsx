import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, X, Shield, User, LogOut } from 'lucide-react';

export default function Navbar() {
  // 👑 ดึงค่า role มาจาก AuthContext โดยตรง เพื่อให้แสดงสิทธิ์ Super Admin จาก Supabase
  const { user, role, loading, loginWithGoogle, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // ตรวจสอบสิทธิ์จากฐานข้อมูลก่อน หากไม่มีค่อยดึงจาก metadata หรือ fallback เป็น User
  const displayRole = role || user?.user_metadata?.role || "User";

  const isAdmin = role === 'Admin' || role === 'Super Admin' || role === 'admin' || role === 'super_admin';
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Projects', path: '/projects' },
    { name: 'Courses', path: '/courses' },
    { name: 'Mock Exam', path: '/mock' },
    { name: 'Promotions', path: '/promotions' },
    { name: 'Posts', path: '/posts' },
    ...(isAdmin ? [{ name: 'Admin', path: '/payments' }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-950/80 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-black tracking-wider bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
              Adusaurus
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-250 ${
                  isActive(link.path)
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-900 hover:scale-105 transition-all text-amber-500 dark:text-indigo-400"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300 dark:bg-gray-700" />
            ) : user ? (
              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-900/50 pl-3 pr-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold max-w-[100px] truncate">
                    {user.user_metadata?.full_name || user.email.split('@')[0]}
                  </span>
                  <span className="flex items-center text-[10px] font-bold text-emerald-500">
                    <Shield size={10} className="mr-0.5" /> {displayRole}
                  </span>
                </div>
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="profile" className="h-8 w-8 rounded-full border border-blue-500" />
                ) : (
                  <div className="p-1.5 bg-blue-500 rounded-full text-white"><User size={16} /></div>
                )}
                <button
                  onClick={logout}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-200"
              >
                Login with Google
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 md:hidden">
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-amber-500 dark:text-indigo-400">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 text-gray-600 dark:text-gray-300">
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* 📱 Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium transition-all ${
                isActive(link.path)
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300'
              }`}
            >
              {link.name}
            </Link>
          ))}

          {/* 🔐 ส่วนล็อกอิน/โปรไฟล์สำหรับจอมือถือ (เดิมอยู่ในโซนเดสก์ท็อปเท่านั้น ทำให้มือถือล็อกอินไม่ได้) */}
          <div className="pt-3 mt-2 border-t border-gray-200 dark:border-gray-800">
            {loading ? (
              <div className="h-10 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
            ) : user ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="profile" className="h-9 w-9 rounded-full border border-blue-500" />
                  ) : (
                    <div className="p-2 bg-blue-500 rounded-full text-white"><User size={16} /></div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate">
                      {user.user_metadata?.full_name || user.email.split('@')[0]}
                    </span>
                    <span className="flex items-center text-[10px] font-bold text-emerald-500">
                      <Shield size={10} className="mr-0.5" /> {displayRole}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut size={16} /> ออกจากระบบ
                </button>
              </div>
            ) : (
              <button
                onClick={() => { loginWithGoogle(); setIsOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl active:scale-95 transition-all"
              >
                Login with Google
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}