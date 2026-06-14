import React, { useState, useEffect } from 'react';
import { X, Loader2, UploadCloud, CheckCircle2, AlertTriangle, QrCode } from 'lucide-react';
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import * as pay from '../lib/paymentApi';
import { formatTHB } from '../lib/pricing';

// item: { type: 'course'|'exam', id, title }
export default function CheckoutModal({ item, onClose, onEnrolled }) {
  const [phase, setPhase] = useState('init'); // init | pay | owned | submitted | error
  const [error, setError] = useState('');
  const [payment, setPayment] = useState(null); // { payment_id, amount }
  const [settings, setSettings] = useState(null);
  const [qr, setQr] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await pay.createPayment(item.type, item.id);
        if (!active) return;
        if (res.already_enrolled || res.granted_free) {
          onEnrolled?.();
          setPhase('owned');
          return;
        }
        const s = await pay.getSettings();
        if (!active) return;
        setSettings(s);
        setPayment(res);
        setPhase('pay');
        if (s?.promptpay_id) {
          try {
            const payload = generatePayload(s.promptpay_id, { amount: Number(res.amount) });
            const url = await QRCode.toDataURL(payload, { margin: 1, width: 280 });
            if (active) setQr(url);
          } catch (e) {
            console.warn('QR generation failed:', e.message);
          }
        }
      } catch (e) {
        if (active) {
          setError(e.message || 'เกิดข้อผิดพลาด');
          setPhase('error');
        }
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickSlip = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSlipFile(f);
    setSlipPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!slipFile) return alert('กรุณาแนบสลิปการโอนเงิน');
    setBusy(true);
    try {
      const path = await pay.uploadSlip(slipFile);
      await pay.submitSlip(payment.payment_id, path);
      setPhase('submitted');
    } catch (e) {
      alert('ส่งสลิปไม่สำเร็จ: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="font-bold text-slate-800 dark:text-zinc-100">ชำระเงินเพื่อเข้าเรียน</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {phase === 'init' && (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
              <p className="text-xs text-slate-400">กำลังเตรียมการชำระเงิน...</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <p className="text-sm text-slate-600 dark:text-zinc-300">{error}</p>
              <button onClick={onClose} className="mt-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 text-xs font-bold">ปิด</button>
            </div>
          )}

          {phase === 'owned' && (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">คุณมีสิทธิ์เข้าถึงเนื้อหานี้แล้ว</p>
              <button onClick={onClose} className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">เริ่มเรียนได้เลย</button>
            </div>
          )}

          {phase === 'submitted' && (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">ส่งสลิปเรียบร้อยแล้ว 🎉</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs">
                ระบบจะเปิดสิทธิ์ให้อัตโนมัติเมื่อแอดมินตรวจสอบยอดเงินเรียบร้อย กรุณารอการอนุมัติสักครู่
              </p>
              <button onClick={onClose} className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">รับทราบ</button>
            </div>
          )}

          {phase === 'pay' && payment && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-400">{item.title}</p>
                <p className="text-3xl font-extrabold text-slate-800 dark:text-zinc-100 mt-1">{formatTHB(payment.amount)}</p>
              </div>

              {settings?.promptpay_id ? (
                <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    <QrCode className="w-3.5 h-3.5" /> สแกนจ่ายผ่าน PromptPay
                  </span>
                  {qr ? (
                    <img src={qr} alt="PromptPay QR" className="w-52 h-52 rounded-xl bg-white p-2" />
                  ) : (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 my-10" />
                  )}
                  {settings.promptpay_name && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400">ชื่อบัญชี: {settings.promptpay_name}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>ผู้ดูแลยังไม่ได้ตั้งค่าบัญชี PromptPay กรุณาติดต่อผู้ดูแลระบบ</span>
                </div>
              )}

              {settings?.payment_instructions && (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 whitespace-pre-wrap text-center">
                  {settings.payment_instructions}
                </p>
              )}

              {/* Slip upload */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-slate-400">แนบสลิปการโอนเงิน</label>
                {slipPreview && (
                  <img src={slipPreview} alt="slip" className="max-h-48 rounded-xl border border-slate-200 dark:border-zinc-800 mx-auto" />
                )}
                <label className="cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 text-xs font-semibold hover:border-blue-400">
                  <UploadCloud className="w-4 h-4" /> {slipFile ? 'เปลี่ยนรูปสลิป' : 'เลือกรูปสลิป'}
                  <input type="file" accept="image/*" className="hidden" onChange={pickSlip} />
                </label>
              </div>

              <button
                onClick={submit}
                disabled={busy || !slipFile}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:dark:bg-zinc-700 text-white text-sm font-bold"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                แจ้งโอนเงิน / ส่งสลิป
              </button>
              <p className="text-[10px] text-slate-400 text-center">
                ระบบจะเปิดสิทธิ์ให้หลังแอดมินตรวจสอบยอดเงิน
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
