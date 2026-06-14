import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { subscribe, getToasts, dismiss, push } from '../lib/toast';

// Guess toast tone from a legacy alert() string.
function classify(msg) {
  if (/❌|ล้มเหลว|ไม่สามารถ|ไม่สำเร็จ|ขัดข้อง|error|failed|denied|forbidden/i.test(msg)) return 'error';
  if (/🎉|สำเร็จ|เรียบร้อย|บันทึก.*แล้ว|success|approved/i.test(msg)) return 'success';
  return 'info';
}

const STYLES = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-slate-800 dark:bg-zinc-700',
};

export default function Toaster() {
  const [items, setItems] = useState(getToasts());

  useEffect(() => subscribe(setItems), []);

  // Route every legacy window.alert() through the toast UI.
  useEffect(() => {
    const original = window.alert;
    window.alert = (msg) => push(classify(String(msg)), String(msg));
    return () => {
      window.alert = original;
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,360px)]">
      {items.map((t) => {
        const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? XCircle : Info;
        return (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-2 text-white rounded-xl shadow-lg px-4 py-3 text-sm ${STYLES[t.type] || STYLES.info}`}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="flex-1 whitespace-pre-wrap leading-snug">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="opacity-80 hover:opacity-100" aria-label="ปิด">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
