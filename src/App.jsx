import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Import Pages
import Home from './page/Home';
import About from './page/About';
import Posts from './page/Posts';
import Projects from './page/Projects';
import Courses from './page/Courses';
import SignUp from './page/SignUp';
import LogIn from './page/LogIn'; // สะกดด้วย I ตัวใหญ่ ตรงกับชื่อไฟล์จริง

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="flex min-h-screen flex-col justify-between bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <div>
              {/* แถบเมนูด้านบน */}
              <Navbar />
              
              {/* พื้นที่แสดงเนื้อหาของแต่ละหน้า */}
              <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/posts" element={<Posts />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/login" element={<LogIn />} />
                </Routes>
              </main>
            </div>
            
            {/* แถบเครดิตด้านล่างสุด */}
            <Footer />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}