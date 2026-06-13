import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock, ChevronLeft, ChevronRight, Flag, CheckCircle2, Circle,
  AlertTriangle, Loader2, X, Send,
} from 'lucide-react';
import * as mock from '../../lib/mockApi';

function fmtClock(sec) {
  if (sec == null) return '∞';
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}

export default function ExamRunner({ initialAttempt, onSubmitted, onExit }) {
  const attemptId = initialAttempt.attempt_id;
  const questions = initialAttempt.questions || [];
  const hasTimer = initialAttempt.remaining_seconds != null;

  const [answers, setAnswers] = useState(() => initialAttempt.answers || {});
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(initialAttempt.remaining_seconds);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const q = questions[current];
  const selectedFor = (qid) => answers[qid] || [];
  const isAnswered = (qid) => (answers[qid] || []).length > 0;
  const answeredCount = questions.filter((qq) => isAnswered(qq.id)).length;

  const selectOption = (qid, optionId, allowMultiple) => {
    setAnswers((prev) => {
      const cur = prev[qid] || [];
      if (allowMultiple) {
        const next = cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId];
        return { ...prev, [qid]: next };
      }
      return { ...prev, [qid]: [optionId] };
    });
  };

  // ---- submit (manual or auto on timeout) ----
  const doSubmit = useCallback(
    async (auto) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const results = await mock.submitAttempt(attemptId, answers, auto);
        onSubmitted(results);
      } catch (e) {
        submittedRef.current = false;
        setSubmitting(false);
        alert('ส่งข้อสอบไม่สำเร็จ: ' + e.message);
      }
    },
    [attemptId, answers, onSubmitted]
  );

  // ---- countdown timer ----
  useEffect(() => {
    if (!hasTimer) return;
    if (remaining <= 0) {
      doSubmit(true);
      return;
    }
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          doSubmit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTimer]);

  // ---- autosave progress (debounced) for resume ----
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (!submittedRef.current) {
        mock.saveProgress(attemptId, answers).catch((e) => console.warn('autosave failed:', e.message));
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [answers, attemptId]);

  const lowTime = hasTimer && remaining <= 60;

  if (!q) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-slate-400">ข้อสอบนี้ยังไม่มีคำถาม</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 text-xs font-bold">
          กลับ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sticky header: title + timer + progress */}
      <div className="sticky top-16 z-30 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md -mx-4 px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-sm text-slate-800 dark:text-zinc-100 truncate">{initialAttempt.title}</h2>
          <p className="text-[11px] text-slate-400">ตอบแล้ว {answeredCount}/{questions.length} ข้อ</p>
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm font-mono ${
            lowTime ? 'bg-red-500/15 text-red-500 animate-pulse' : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200'
          }`}
        >
          <Clock className="w-4 h-4" /> {fmtClock(remaining)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Question */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">ข้อ {current + 1}</span>
              <span className="text-[10px] font-bold uppercase text-slate-400">
                {q.allow_multiple ? 'เลือกได้หลายข้อ' : 'เลือกข้อเดียว'}
              </span>
            </div>
            <p className="text-base font-medium text-slate-800 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
              {q.question_text}
            </p>
            {q.image_url && (
              <img src={q.image_url} alt="question" className="mt-4 max-h-72 rounded-xl border border-slate-200 dark:border-zinc-800" />
            )}

            <div className="mt-5 space-y-2.5">
              {q.options.map((o) => {
                const selected = selectedFor(q.id).includes(o.id);
                return (
                  <button
                    key={o.id}
                    onClick={() => selectOption(q.id, o.id, q.allow_multiple)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span
                      className={`shrink-0 w-5 h-5 flex items-center justify-center border-2 ${
                        q.allow_multiple ? 'rounded-md' : 'rounded-full'
                      } ${selected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 dark:border-zinc-600 text-transparent'}`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                    {o.image_url && (
                      <img src={o.image_url} alt="opt" className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-zinc-800" />
                    )}
                    <span className="text-sm text-slate-700 dark:text-zinc-200">{o.option_text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prev / Next */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> ก่อนหน้า
            </button>
            {current < questions.length - 1 ? (
              <button
                onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                ถัดไป <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowReview(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                <Flag className="w-4 h-4" /> ตรวจทาน & ส่ง
              </button>
            )}
          </div>
        </div>

        {/* Palette */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm lg:sticky lg:top-32">
            <p className="text-[11px] font-bold uppercase text-slate-400 mb-3">สถานะการตอบ</p>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((qq, i) => {
                const answered = isAnswered(qq.id);
                return (
                  <button
                    key={qq.id}
                    onClick={() => setCurrent(i)}
                    className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                      i === current
                        ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-900'
                        : ''
                    } ${answered ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-3 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> ตอบแล้ว</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 dark:bg-zinc-800 inline-block" /> ยังไม่ตอบ</span>
            </div>
            <button
              onClick={() => setShowReview(true)}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              <Send className="w-3.5 h-3.5" /> ส่งข้อสอบ
            </button>
          </div>
        </div>
      </div>

      {/* Review & submit modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-slate-800 dark:text-zinc-100">ตรวจทานก่อนส่ง</h3>
              <button onClick={() => setShowReview(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-around text-center">
                <div>
                  <p className="text-2xl font-extrabold text-emerald-500">{answeredCount}</p>
                  <p className="text-[11px] text-slate-400">ตอบแล้ว</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-amber-500">{questions.length - answeredCount}</p>
                  <p className="text-[11px] text-slate-400">ยังไม่ตอบ</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-700 dark:text-zinc-200">{questions.length}</p>
                  <p className="text-[11px] text-slate-400">ทั้งหมด</p>
                </div>
              </div>

              {answeredCount < questions.length && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>ยังมีข้อที่ยังไม่ได้ตอบ ข้อที่ไม่ตอบจะถือว่าผิด</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {questions.map((qq, i) => (
                  <button
                    key={qq.id}
                    onClick={() => { setShowReview(false); setCurrent(i); }}
                    className={`w-8 h-8 rounded-lg text-[11px] font-bold ${
                      isAnswered(qq.id) ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3">
              <button onClick={() => setShowReview(false)} className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
                ทำต่อ
              </button>
              <button
                onClick={() => doSubmit(false)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                ยืนยันส่งคำตอบ
              </button>
            </div>
          </div>
        </div>
      )}

      {submitting && !showReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl px-6 py-5 flex items-center gap-3 shadow-xl">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm font-semibold">กำลังส่งและตรวจคำตอบ...</span>
          </div>
        </div>
      )}
    </div>
  );
}
