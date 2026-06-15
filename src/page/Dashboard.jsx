import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, ListChecks, FileText, FolderGit2, GraduationCap,
  Wallet, Clock, MessageSquare, Loader2, ShieldAlert, LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { formatTHB } from '../lib/pricing';

function StatCard({ icon: Icon, label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-600/10 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-600/10 text-violet-600 dark:text-violet-400',
    rose: 'bg-rose-500/10 text-rose-500',
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
      <div className={`inline-flex p-2.5 rounded-xl ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-extrabold mt-3 text-slate-800 dark:text-zinc-100">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    supabase.rpc('admin_dashboard_stats').then(({ data, error }) => {
      if (!error) setStats(data);
      setLoading(false);
    });
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <ShieldAlert className="w-12 h-12 text-amber-500 mb-3" />
        <h1 className="text-lg font-bold">เฉพาะผู้ดูแลระบบ</h1>
        <p className="text-sm text-slate-400 mt-1">หน้านี้สำหรับ Admin / Super Admin เท่านั้น</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">Overview</span>
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : !stats ? (
          <p className="text-sm text-slate-400">โหลดข้อมูลไม่สำเร็จ</p>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">เนื้อหา & ผู้ใช้</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="ผู้ใช้ทั้งหมด" value={stats.users} tone="blue" />
                <StatCard icon={BookOpen} label="คอร์สเรียน" value={stats.courses} tone="violet" />
                <StatCard icon={ListChecks} label="ข้อสอบ Mock" value={stats.exams} tone="violet" />
                <StatCard icon={GraduationCap} label="การลงทะเบียน" value={stats.enrollments} tone="emerald" />
                <StatCard icon={FileText} label="โพสต์" value={stats.posts} tone="blue" />
                <StatCard icon={FolderGit2} label="โปรเจกต์" value={stats.projects} tone="blue" />
                <StatCard icon={Users} label="สมาชิกทีม" value={stats.members} tone="blue" />
              </div>
            </div>

            {stats.is_super && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">การเงิน (Super Admin)</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard icon={Wallet} label="รายได้ (อนุมัติแล้ว)" value={formatTHB(stats.revenue)} tone="emerald" />
                  <StatCard icon={Clock} label="รอตรวจสอบการชำระเงิน" value={stats.pending_payments} tone="amber" />
                  <StatCard icon={MessageSquare} label="แจ้งปัญหา" value={stats.reported_issues} tone="rose" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
