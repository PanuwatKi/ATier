import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-900 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/*ฝั่งซ้าย: ข้อมูลองค์กร */}
          <div className="text-center md:text-left">
            <span className="text-lg font-black tracking-wider text-gray-900 dark:text-white">
              Adusaurus
            </span>
            <p className="mt-1 text-xs max-w-md text-gray-400 dark:text-gray-500">
              A group of boys
            </p>
          </div>

          {/* ฝั่งขวา: เมนูด่วน */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium">
            <Link to="/" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Home</Link>
            <Link to="/projects" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Projects</Link>
            <Link to="/courses" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Courses</Link>
            <Link to="/posts" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Posts</Link>
          </div>
          
        </div>

        {/* เส้นคั่นลิขสิทธิ์ */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-900 text-center text-[11px] text-gray-400 dark:text-gray-600">
          &copy; {currentYear} Panuwat' Dev. All rights reserved.
        </div>
      </div>
    </footer>
  );
}