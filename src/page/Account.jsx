import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Receipt, BookOpen, ListChecks, Loader2, XCircle, CheckCircle2,
  Clock, Ban, MessageSquare, ArrowRight, LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as pay from '../lib/paymentApi';
import { formatTHB } from '../lib/pricing';
import { toast } from '../lib/toast';

const TZ = 'Asia/Bangkok';
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString('th-TH-u-ca-gregory', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }) : '';

const STATUS = {
  pending: ['bg-amber-500/15 text-amber-600 dark:text-amber-400', 'รอตรวจสอบ', Clock],
  approved: ['bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', 'อนุมัติแล้ว', CheckCircle2],
  rejected: ['bg-red-500/15 text-red-500', 'ถูกปฏิเสธ', XCircle],
  cancelled: ['bg-slate-400/15 text-slate-500', 'ยกเลิกแล้ว', Ban],
};

export default function Account() {
  const { user, loginWithGoogle } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [enr, pmt] = await Promise.all([pay.myEnrollmentsDetailed(), pay.myPayments()]);
      setEnrollments(enr);
      setPayments(pmt);
    } catch (e) {
      toast.error('โหลดข้อมูลบัญชีไม่สำเร็จ: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (p) => {
    if (!window.confirm('ยกเลิกคำขอชำระเงินนี้?')) return;
    try {
      await pay.cancelPayment(p.payment_id);
      toast.success('ยกเลิกคำขอเรียบร้อย');
      load();
    } catch (e) {
      toast.error('ยกเลิกไม่สำเร็จ: ' + e.message);
    }
  };

  const report = async (p) => {
    const msg = window.prompt('แจ้งปัญหา / ข้อความถึงผู้ดูแล:', p.user_message || '');
    if (msg === null) return;
    try {
      await pay.reportPaymentIssue(p.payment_id, msg);
      toast.success('ส่งข้อความถึงผู้ดูแลแล้ว');
      load();
    } catch (e) {
      toast.error('ส่งไม่สำเร็จ: ' + e.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <User className="w-12 h-12 text-slate-300 dark:text-zinc-700 mb-3" />
        <h1 className="text-lg font-bold">บัญชีของฉัน</h1>
        <p className="text-sm text-slate-400 mt-1 mb-4">กรุณาเข้าสู่ระบบเพื่อดูคอร์สและประวัติการชำระเงิน</p>
        <button onClick={loginWithGoogle} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">
          <LogIn className="w-4 h-4" /> เข้าสู่ระบบด้วย Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Profile header */}
        <div className="flex items-center gap-3 mb-8">
          {user.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="profile" className="w-12 h-12 rounded-full border border-blue-500" />
          ) : (
            <div className="p-3 bg-blue-500 rounded-full text-white"><User className="w-5 h-5" /></div>
          )}
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{user.user_metadata?.full_name || user.email.split('@')[0]}</h1>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>
        ) : (
          <div className="space-y-8">
            {/* My courses / exams */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">คอร์ส / ข้อสอบของฉัน</h2>
              {enrollments.length === 0 ? (
                <p className="text-sm text-slate-400 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 text-center">ยังไม่มีรายการที่เป็นเจ้าของ</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {enrollments.map((e) => (
                    <Link
                      key={`${e.item_type}:${e.item_id}`}
                      to={e.item_type === 'course' ? '/courses' : '/mock'}
                      className="group flex items-center gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-blue-400 transition-colors"
                    >
                      <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                        {e.item_type === 'course' ? <BookOpen className="w-5 h-5" /> : <ListChecks className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">{e.title || '(ไม่พบรายการ)'}</p>
                        <p className="text-[10px] text-slate-400">{e.item_type === 'course' ? 'คอร์สเรียน' : 'ข้อสอบ'} · ได้รับสิทธิ์ {fmt(e.created_at)}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Payment history */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" /> ประวัติการชำระเงิน</h2>
              {payments.length === 0 ? (
                <p className="text-sm text-slate-400 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-900 rounded-2xl p-6 text-center">ยังไม่มีประวัติการชำระเงิน</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => {
                    const [cls, label, Icon] = STATUS[p.status] || STATUS.pending;
                    return (
                      <div key={p.payment_id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{p.item_title}</p>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
                                <Icon className="w-3 h-3" /> {label}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{fmt(p.created_at)} · {p.item_type === 'course' ? 'คอร์ส' : 'ข้อสอบ'}</p>
                            {p.note && <p className="text-[11px] text-red-500 mt-1">เหตุผลจากผู้ดูแล: {p.note}</p>}
                            {p.user_message && <p className="text-[11px] text-blue-500 mt-1">ข้อความของคุณ: {p.user_message}</p>}
                          </div>
                          <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400 shrink-0">{formatTHB(p.amount)}</p>
                        </div>
                        {(p.status === 'pending' || p.status === 'rejected') && (
                          <div className="flex items-center gap-2 mt-3">
                            {p.status === 'pending' && (
                              <button onClick={() => cancel(p)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-zinc-700">
                                <Ban className="w-3.5 h-3.5" /> ยกเลิกคำขอ
                              </button>
                            )}
                            <button onClick={() => report(p)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold hover:bg-amber-500/20">
                              <MessageSquare className="w-3.5 h-3.5" /> แจ้งปัญหา
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
