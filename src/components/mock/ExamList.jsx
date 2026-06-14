import React, { useState } from 'react';
import {
  Clock, ListChecks, Play, RotateCcw, Plus, Pencil, Eye, EyeOff,
  Trash2, History, Award, X, Loader2, LogIn, Tag,
} from 'lucide-react';
import * as mock from '../../lib/mockApi';
import { effectivePrice, hasActiveDiscount, discountPercent, formatTHB } from '../../lib/pricing';

function fmtDuration(seconds) {
  if (!seconds || seconds <= 0) return 'ไม่จำกัดเวลา';
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} นาที`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} ชม. ${r} นาที` : `${h} ชม.`;
}

export default function ExamList({
  exams, loading, isAdmin, user, onStart, onViewResults, onCreate, onEdit, onChanged, onLogin, onBuy,
}) {
  const [historyExam, setHistoryExam] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const openHistory = async (exam) => {
    setHistoryExam(exam);
    setHistoryLoading(true);
    try {
      setHistory(await mock.myAttempts(exam.id));
    } catch (e) {
      console.error(e);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleHidden = async (exam) => {
    try {
      await mock.updateExam(exam.id, { is_hidden: !exam.is_hidden });
      onChanged();
    } catch (e) {
      alert('เปลี่ยนสถานะไม่สำเร็จ: ' + e.message);
    }
  };

  const remove = async (exam) => {
    if (!window.confirm(`ลบข้อสอบ "${exam.title}" และสถิติทั้งหมดถาวร?`)) return;
    try {
      await mock.deleteExam(exam.id);
      onChanged();
    } catch (e) {
      alert('ลบไม่สำเร็จ: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-400">กำลังโหลดรายการข้อสอบ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          เลือกชุดข้อสอบเพื่อฝึกทำ {!user && '· ต้องเข้าสู่ระบบด้วย Google ก่อนเริ่มทำ'}
        </p>
        {isAdmin && (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/10 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> สร้างข้อสอบใหม่
          </button>
        )}
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-900">
          <ListChecks className="mx-auto text-slate-300 dark:text-zinc-700 mb-3" size={40} />
          <p className="text-sm font-medium text-slate-400">ยังไม่มีข้อสอบในระบบ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className={`flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
                exam.is_hidden
                  ? 'border-dashed border-amber-500/40'
                  : 'border-slate-200/70 dark:border-zinc-800/70'
              }`}
            >
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100 line-clamp-2">
                    {exam.title}
                  </h3>
                  {exam.is_hidden && (
                    <span className="shrink-0 text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded">
                      HIDDEN
                    </span>
                  )}
                </div>
                {exam.description && (
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {exam.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] text-slate-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <ListChecks className="w-3.5 h-3.5" /> {exam.question_count} ข้อ
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {fmtDuration(exam.time_limit_seconds)}
                  </span>
                  {exam.my_attempts > 0 && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Award className="w-3.5 h-3.5" /> Best {Math.round(exam.my_best ?? 0)}%
                    </span>
                  )}
                  {exam.is_paid && !exam.has_access && (
                    <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                      <Tag className="w-3.5 h-3.5" />
                      {hasActiveDiscount(exam) && <span className="line-through text-slate-400 font-normal">{formatTHB(exam.price)}</span>}
                      {formatTHB(effectivePrice(exam))}
                      {hasActiveDiscount(exam) && <span className="text-[9px] bg-red-500 text-white px-1 rounded">-{discountPercent(exam)}%</span>}
                    </span>
                  )}
                  {exam.is_paid && exam.has_access && !isAdmin && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">ซื้อแล้ว</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 pt-2 border-t border-slate-50 dark:border-zinc-800/60 space-y-2">
                {!user ? (
                  <button
                    onClick={onLogin}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold transition-colors"
                  >
                    <LogIn className="w-4 h-4" /> เข้าสู่ระบบเพื่อเริ่มทำ
                  </button>
                ) : exam.is_paid && !exam.has_access ? (
                  <button
                    onClick={() => onBuy(exam)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                  >
                    <Tag className="w-4 h-4" /> ซื้อ {formatTHB(effectivePrice(exam))}
                  </button>
                ) : (
                  <button
                    onClick={() => onStart(exam.id)}
                    disabled={exam.question_count === 0}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:dark:bg-zinc-700 text-white text-xs font-bold transition-colors"
                  >
                    {exam.has_active ? (
                      <><RotateCcw className="w-4 h-4" /> ทำต่อ (Resume)</>
                    ) : exam.my_attempts > 0 ? (
                      <><RotateCcw className="w-4 h-4" /> ทำอีกครั้ง</>
                    ) : (
                      <><Play className="w-4 h-4" /> เริ่มทำข้อสอบ</>
                    )}
                  </button>
                )}

                <div className="flex items-center gap-2">
                  {user && exam.my_attempts > 0 && (
                    <button
                      onClick={() => openHistory(exam)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <History className="w-3.5 h-3.5" /> ประวัติ ({exam.my_attempts})
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => onEdit(exam.id)}
                        title="แก้ไขข้อสอบ"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleHidden(exam)}
                        title={exam.is_hidden ? 'เผยแพร่ข้อสอบ' : 'ซ่อนข้อสอบ'}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        {exam.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => remove(exam)}
                        title="ลบข้อสอบ"
                        className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History modal */}
      {historyExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-slate-800 dark:text-zinc-100">
                ประวัติการทำ · {historyExam.title}
              </h3>
              <button
                onClick={() => setHistoryExam(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-2">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">ยังไม่มีประวัติ</p>
              ) : (
                history.map((a, i) => (
                  <button
                    key={a.attempt_id}
                    onClick={() => {
                      setHistoryExam(null);
                      onViewResults(a.attempt_id);
                    }}
                    disabled={a.status !== 'submitted'}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        รอบที่ {history.length - i}
                        {a.auto_submitted && (
                          <span className="ml-2 text-[9px] text-amber-500 font-bold">หมดเวลา</span>
                        )}
                        {a.status !== 'submitted' && (
                          <span className="ml-2 text-[9px] text-blue-500 font-bold">ยังทำไม่จบ</span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {a.submitted_at
                          ? new Date(a.submitted_at).toLocaleString('th-TH')
                          : new Date(a.started_at).toLocaleString('th-TH')}
                      </p>
                    </div>
                    {a.status === 'submitted' && (
                      <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                        {Math.round(a.percent ?? 0)}%
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
