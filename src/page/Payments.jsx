import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Settings as SettingsIcon, Check, X, Eye, Loader2, Save,
  ShieldAlert, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as pay from '../lib/paymentApi';
import { formatTHB } from '../lib/pricing';

export default function Payments() {
  const { role } = useAuth();
  const isSuperAdmin = role === 'Super Admin' || role === 'super_admin';

  const [tab, setTab] = useState('pending');
  const [filter, setFilter] = useState('pending'); // pending | all
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slipUrls, setSlipUrls] = useState({}); // paymentId -> signed url
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPayments(await pay.adminListPayments(filter === 'all' ? null : 'pending'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin, load]);

  useEffect(() => {
    if (isSuperAdmin && tab === 'settings' && !settings) {
      pay.getSettings().then(setSettings).catch((e) => console.error(e));
    }
  }, [isSuperAdmin, tab, settings]);

  const viewSlip = async (p) => {
    if (!p.slip_url) return alert('ผู้ใช้ยังไม่ได้แนบสลิป');
    try {
      const url = await pay.signedSlipUrl(p.slip_url);
      setSlipUrls((prev) => ({ ...prev, [p.payment_id]: url }));
    } catch (e) {
      alert('เปิดสลิปไม่สำเร็จ: ' + e.message);
    }
  };

  const review = async (p, approve) => {
    let note = null;
    if (!approve) {
      note = window.prompt('เหตุผลที่ปฏิเสธ (ผู้ใช้จะเห็น):', '');
      if (note === null) return;
    } else if (!window.confirm(`อนุมัติการชำระเงินของ ${p.user_email || p.user_id} และเปิดสิทธิ์เข้าเรียน?`)) {
      return;
    }
    try {
      await pay.adminReviewPayment(p.payment_id, approve, note);
      load();
    } catch (e) {
      alert('ดำเนินการไม่สำเร็จ: ' + e.message);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await pay.updateSettings({
        promptpay_id: settings.promptpay_id || '',
        promptpay_name: settings.promptpay_name || '',
        payment_instructions: settings.payment_instructions || '',
      });
      alert('บันทึกการตั้งค่าเรียบร้อย');
    } catch (e) {
      alert('บันทึกไม่สำเร็จ: ' + e.message);
    } finally {
      setSavingSettings(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <ShieldAlert className="w-12 h-12 text-amber-500 mb-3" />
        <h1 className="text-lg font-bold">เฉพาะผู้ดูแลระบบ</h1>
        <p className="text-sm text-slate-400 mt-1">หน้านี้สำหรับ Super Admin เท่านั้น</p>
      </div>
    );
  }

  const statusBadge = (s) => {
    const map = {
      pending: ['bg-amber-500/15 text-amber-600 dark:text-amber-400', 'รอตรวจสอบ', Clock],
      approved: ['bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', 'อนุมัติแล้ว', CheckCircle2],
      rejected: ['bg-red-500/15 text-red-500', 'ปฏิเสธ', XCircle],
    };
    const [cls, label, Icon] = map[s] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
        <Icon className="w-3 h-3" /> {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <Receipt className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">ระบบการชำระเงิน (Admin)</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            ['pending', 'รายการชำระเงิน', Receipt],
            ['settings', 'ตั้งค่า PromptPay', SettingsIcon],
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                tab === key ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {tab === 'pending' && (
          <>
            <div className="flex gap-2 mb-4">
              {[['pending', 'รอตรวจสอบ'], ['all', 'ทั้งหมด']].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${filter === k ? 'bg-slate-800 dark:bg-zinc-200 text-white dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>
            ) : payments.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-900">
                <p className="text-sm text-slate-400">ไม่มีรายการ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.payment_id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">{p.item_title}</p>
                          <span className="text-[9px] uppercase font-bold text-slate-400">{p.item_type}</span>
                          {statusBadge(p.status)}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                          {p.user_name || p.user_email || p.user_id}
                          {p.user_email && p.user_name ? ` · ${p.user_email}` : ''}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(p.created_at).toLocaleString('th-TH')}</p>
                        {p.note && <p className="text-[11px] text-amber-600 mt-1">หมายเหตุ: {p.note}</p>}
                      </div>
                      <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{formatTHB(p.amount)}</p>
                    </div>

                    {slipUrls[p.payment_id] && (
                      <a href={slipUrls[p.payment_id]} target="_blank" rel="noreferrer">
                        <img src={slipUrls[p.payment_id]} alt="slip" className="mt-3 max-h-72 rounded-xl border border-slate-200 dark:border-zinc-800" />
                      </a>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => viewSlip(p)}
                        disabled={!p.slip_url}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[11px] font-bold disabled:opacity-40"
                      >
                        <Eye className="w-3.5 h-3.5" /> {p.slip_url ? 'ดูสลิป' : 'ยังไม่มีสลิป'}
                      </button>
                      {p.status === 'pending' && (
                        <>
                          <button onClick={() => review(p, true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold">
                            <Check className="w-3.5 h-3.5" /> อนุมัติ
                          </button>
                          <button onClick={() => review(p, false)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold">
                            <X className="w-3.5 h-3.5" /> ปฏิเสธ
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'settings' && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 max-w-lg">
            {!settings ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">เบอร์ PromptPay / เลขบัตรประชาชน</label>
                  <input
                    type="text"
                    value={settings.promptpay_id || ''}
                    onChange={(e) => setSettings({ ...settings, promptpay_id: e.target.value })}
                    placeholder="เช่น 0812345678 หรือ 1234567890123"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">ชื่อบัญชี</label>
                  <input
                    type="text"
                    value={settings.promptpay_name || ''}
                    onChange={(e) => setSettings({ ...settings, promptpay_name: e.target.value })}
                    placeholder="ชื่อผู้รับเงินที่จะแสดงให้ผู้ใช้เห็น"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">คำแนะนำการชำระเงิน (ไม่บังคับ)</label>
                  <textarea
                    rows="3"
                    value={settings.payment_instructions || ''}
                    onChange={(e) => setSettings({ ...settings, payment_instructions: e.target.value })}
                    placeholder="เช่น โอนแล้วแนบสลิป ระบบจะเปิดสิทธิ์ภายใน 24 ชม."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs font-bold"
                >
                  {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} บันทึกการตั้งค่า
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
