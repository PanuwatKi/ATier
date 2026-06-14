import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import Toaster from './components/Toaster';

// Code-split each route so the initial bundle stays small and pages load on demand.
const Home = lazy(() => import('./page/Home'));
const About = lazy(() => import('./page/About'));
const Posts = lazy(() => import('./page/Posts'));
const Projects = lazy(() => import('./page/Projects'));
const Courses = lazy(() => import('./page/Courses'));
const MockExam = lazy(() => import('./page/MockExam'));
const Promotions = lazy(() => import('./page/Promotions'));
const Payments = lazy(() => import('./page/Payments'));
const SignUp = lazy(() => import('./page/SignUp'));
const LogIn = lazy(() => import('./page/LogIn'));
const Account = lazy(() => import('./page/Account'));
const Terms = lazy(() => import('./page/Terms'));

function PageLoader() {
  return (
    <div className="flex justify-center py-24">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="text-center py-24">
      <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
      <p className="text-sm text-slate-400 mt-2">ไม่พบหน้าที่คุณต้องการ</p>
      <Link to="/" className="inline-block mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">
        กลับหน้าแรก
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="flex min-h-screen flex-col justify-between bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <Toaster />
            <div>
              <Navbar />
              <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/posts" element={<Posts />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/courses" element={<Courses />} />
                      <Route path="/mock" element={<MockExam />} />
                      <Route path="/promotions" element={<Promotions />} />
                      <Route path="/payments" element={<Payments />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/login" element={<LogIn />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </main>
            </div>
            <Footer />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
