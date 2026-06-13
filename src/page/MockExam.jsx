import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as mock from '../lib/mockApi';
import ExamList from '../components/mock/ExamList';
import ExamBuilder from '../components/mock/ExamBuilder';
import ExamRunner from '../components/mock/ExamRunner';
import ExamResults from '../components/mock/ExamResults';

export default function MockExam() {
  const { user, role, loginWithGoogle } = useAuth();
  const isAdmin =
    role === 'Admin' || role === 'Super Admin' || role === 'admin' || role === 'super_admin';

  const [view, setView] = useState('list'); // 'list' | 'build' | 'take' | 'result'
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [editExamId, setEditExamId] = useState(null); // null = create new
  const [attempt, setAttempt] = useState(null); // sanitized payload for the runner
  const [results, setResults] = useState(null); // graded payload for the results screen

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setExams(await mock.listExams());
    } catch (e) {
      console.error('listExams failed:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- handlers ----
  const handleStart = async (examId) => {
    if (!user) {
      alert('กรุณาเข้าสู่ระบบด้วย Google ก่อนเริ่มทำข้อสอบ');
      return;
    }
    setBusy(true);
    try {
      const payload = await mock.startAttempt(examId);
      setAttempt(payload);
      setView('take');
    } catch (e) {
      alert('ไม่สามารถเริ่มข้อสอบได้: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleViewResults = async (attemptId) => {
    setBusy(true);
    try {
      const payload = await mock.getResults(attemptId);
      setResults(payload);
      setView('result');
    } catch (e) {
      alert('ไม่สามารถเปิดผลสอบได้: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () => {
    setEditExamId(null);
    setView('build');
  };
  const handleEdit = (examId) => {
    setEditExamId(examId);
    setView('build');
  };

  const handleSubmitted = (resultsPayload) => {
    setResults(resultsPayload);
    setAttempt(null);
    setView('result');
    refresh();
  };

  const backToList = () => {
    setAttempt(null);
    setResults(null);
    setEditExamId(null);
    setView('list');
    refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
              Practice & Assessment
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Mock Exam</h1>
          </div>
        </div>

        {busy && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}

        {view === 'list' && (
          <ExamList
            exams={exams}
            loading={loading}
            isAdmin={isAdmin}
            user={user}
            onStart={handleStart}
            onViewResults={handleViewResults}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onChanged={refresh}
            onLogin={loginWithGoogle}
          />
        )}

        {view === 'build' && isAdmin && (
          <ExamBuilder examId={editExamId} onDone={backToList} onCancel={backToList} />
        )}

        {view === 'take' && attempt && (
          <ExamRunner initialAttempt={attempt} onSubmitted={handleSubmitted} onExit={backToList} />
        )}

        {view === 'result' && results && (
          <ExamResults results={results} onClose={backToList} />
        )}
      </div>
    </div>
  );
}
