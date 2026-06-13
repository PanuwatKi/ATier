import React from 'react';
import { CheckCircle2, XCircle, Trophy, ArrowLeft, Info, Clock } from 'lucide-react';

function sameSet(a = [], b = []) {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

export default function ExamResults({ results, onClose }) {
  const questions = results.questions || [];
  const percent = Math.round(results.percent ?? 0);
  const passed = percent >= (results.pass_percent ?? 0);

  return (
    <div className="space-y-6">
      <button
        onClick={onClose}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> กลับไปรายการข้อสอบ
      </button>

      {/* Score summary */}
      <div
        className={`rounded-3xl p-8 text-center border shadow-sm ${
          passed
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
        }`}
      >
        <div className={`inline-flex p-3 rounded-2xl mb-3 ${passed ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
          <Trophy className="w-7 h-7" />
        </div>
        <h2 className="text-sm font-bold text-slate-500 dark:text-zinc-400">{results.title}</h2>
        <p className={`text-5xl font-extrabold mt-2 ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {percent}%
        </p>
        <p className="text-sm text-slate-600 dark:text-zinc-300 mt-1">
          ตอบถูก {results.score}/{results.total} ข้อ · เกณฑ์ผ่าน {results.pass_percent}%
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${passed ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
            {passed ? <><CheckCircle2 className="w-3.5 h-3.5" /> ผ่าน</> : <><XCircle className="w-3.5 h-3.5" /> ยังไม่ผ่าน</>}
          </span>
          {results.auto_submitted && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
              <Clock className="w-3.5 h-3.5" /> ส่งอัตโนมัติ (หมดเวลา)
            </span>
          )}
        </div>
      </div>

      {/* Per-question review */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">เฉลยรายข้อ</h3>
        {questions.map((q, i) => {
          const selected = q.selected || [];
          const correct = q.correct_ids || [];
          const qCorrect = sameSet(selected, correct);
          return (
            <div key={q.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-sm font-medium text-slate-800 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
                  <span className="font-bold text-slate-400 mr-1">{i + 1}.</span>
                  {q.question_text}
                </p>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${qCorrect ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-500'}`}>
                  {qCorrect ? <><CheckCircle2 className="w-3 h-3" /> ถูก</> : <><XCircle className="w-3 h-3" /> ผิด</>}
                </span>
              </div>

              {q.image_url && (
                <img src={q.image_url} alt="question" className="mb-3 max-h-56 rounded-xl border border-slate-200 dark:border-zinc-800" />
              )}

              <div className="space-y-2">
                {q.options.map((o) => {
                  const isSel = selected.includes(o.id);
                  const isCor = o.is_correct;
                  let cls = 'border-slate-200 dark:border-zinc-800';
                  if (isCor) cls = 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20';
                  else if (isSel && !isCor) cls = 'border-red-400 bg-red-50/60 dark:bg-red-950/20';
                  return (
                    <div key={o.id} className={`flex items-center gap-3 p-3 rounded-xl border ${cls}`}>
                      <span className="shrink-0">
                        {isCor ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : isSel ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <span className="block w-4 h-4 rounded-full border-2 border-slate-300 dark:border-zinc-600" />
                        )}
                      </span>
                      {o.image_url && (
                        <img src={o.image_url} alt="opt" className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-zinc-800" />
                      )}
                      <span className="text-sm text-slate-700 dark:text-zinc-200 flex-1">{o.option_text}</span>
                      {isSel && (
                        <span className="text-[10px] font-bold text-slate-400">คำตอบของคุณ</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-sm text-slate-700 dark:text-zinc-300">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold uppercase text-blue-500 mb-0.5">เฉลยละเอียด</p>
                    <p className="whitespace-pre-wrap leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
        >
          กลับไปรายการข้อสอบ
        </button>
      </div>
    </div>
  );
}
