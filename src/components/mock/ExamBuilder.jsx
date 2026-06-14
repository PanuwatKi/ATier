import React, { useState, useEffect } from 'react';
import {
  Save, Plus, Trash2, Image as ImageIcon, Loader2, ArrowLeft, X,
  CheckCircle2, Eye, EyeOff, ChevronUp, ChevronDown, Pencil,
} from 'lucide-react';
import * as mock from '../../lib/mockApi';

const toLocalInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
const toISO = (local) => (local ? new Date(local).toISOString() : null);

/* --------------------------- Question editor --------------------------- */
function QuestionEditor({ examId, question, orderIndex, onSaved, onCancel }) {
  const [text, setText] = useState(question?.question_text || '');
  const [imageUrl, setImageUrl] = useState(question?.image_url || '');
  const [allowMultiple, setAllowMultiple] = useState(question?.allow_multiple || false);
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [explanationVisible, setExplanationVisible] = useState(
    question?.explanation_visible ?? true
  );
  const [options, setOptions] = useState(
    (question?.exam_options && question.exam_options.length
      ? question.exam_options.map((o) => ({
          option_text: o.option_text,
          image_url: o.image_url || '',
          is_correct: o.is_correct,
        }))
      : [
          { option_text: '', image_url: '', is_correct: false },
          { option_text: '', image_url: '', is_correct: false },
        ])
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const setOption = (i, patch) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const markCorrect = (i) => {
    if (allowMultiple) {
      setOption(i, { is_correct: !options[i].is_correct });
    } else {
      setOptions((prev) => prev.map((o, idx) => ({ ...o, is_correct: idx === i })));
    }
  };

  const addOption = () =>
    setOptions((prev) => [...prev, { option_text: '', image_url: '', is_correct: false }]);
  const removeOption = (i) => setOptions((prev) => prev.filter((_, idx) => idx !== i));

  const uploadImage = async (file, target) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await mock.uploadExamImage(file);
      if (target === 'question') setImageUrl(url);
      else setOption(target, { image_url: url });
    } catch (e) {
      alert('อัปโหลดรูปไม่สำเร็จ: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!text.trim()) return alert('กรุณาใส่โจทย์คำถาม');
    const filled = options.filter((o) => o.option_text.trim() || o.image_url);
    if (filled.length < 2) return alert('ต้องมีตัวเลือกอย่างน้อย 2 ตัว');
    if (!filled.some((o) => o.is_correct)) return alert('กรุณาเลือกคำตอบที่ถูกอย่างน้อย 1 ข้อ');
    if (!allowMultiple && filled.filter((o) => o.is_correct).length > 1)
      return alert('ข้อนี้เป็นแบบเลือกคำตอบเดียว กรุณาเลือกคำตอบที่ถูกเพียงข้อเดียว');

    setSaving(true);
    try {
      await mock.saveQuestion(examId, {
        id: question?.id,
        question_text: text.trim(),
        image_url: imageUrl,
        explanation,
        explanation_visible: explanationVisible,
        allow_multiple: allowMultiple,
        order_index: question?.order_index ?? orderIndex,
        options: filled,
      });
      onSaved();
    } catch (e) {
      alert('บันทึกคำถามไม่สำเร็จ: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="font-bold text-slate-800 dark:text-zinc-100">
            {question ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}
          </h3>
          <button onClick={onCancel} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Question text */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">โจทย์คำถาม</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows="3"
              placeholder="พิมพ์โจทย์คำถามที่นี่..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Question image */}
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="question" className="h-20 rounded-xl border border-slate-200 dark:border-zinc-800 object-cover" />
                <button
                  onClick={() => setImageUrl('')}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <X size={12} />
                </button>
              </div>
            ) : null}
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {imageUrl ? 'เปลี่ยนรูปโจทย์' : 'แนบรูปประกอบโจทย์'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files[0], 'question')} />
            </label>
          </div>

          {/* Answer type */}
          <div className="flex items-center gap-4 text-xs">
            <span className="font-bold text-slate-500 dark:text-zinc-400">ประเภทคำตอบ:</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="radio" checked={!allowMultiple} onChange={() => setAllowMultiple(false)} />
              เลือกข้อเดียว
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="radio" checked={allowMultiple} onChange={() => setAllowMultiple(true)} />
              เลือกได้หลายข้อ
            </label>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase text-slate-400">
              ตัวเลือก (กดวงกลม/สี่เหลี่ยมเพื่อทำเครื่องหมายข้อที่ถูก)
            </label>
            {options.map((o, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 p-2 rounded-xl border ${
                  o.is_correct
                    ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-zinc-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => markCorrect(i)}
                  title="ทำเครื่องหมายว่าเป็นคำตอบที่ถูก"
                  className={`shrink-0 w-6 h-6 flex items-center justify-center transition-colors ${
                    allowMultiple ? 'rounded-md' : 'rounded-full'
                  } ${o.is_correct ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-transparent'}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={o.option_text}
                  onChange={(e) => setOption(i, { option_text: e.target.value })}
                  placeholder={`ตัวเลือกที่ ${i + 1}`}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
                {o.image_url && (
                  <img src={o.image_url} alt="opt" className="h-9 w-9 rounded-lg object-cover border border-slate-200 dark:border-zinc-800" />
                )}
                <label className="cursor-pointer p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-zinc-700" title="แนบรูปตัวเลือก">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files[0], i)} />
                </label>
                {options.length > 2 && (
                  <button onClick={() => removeOption(i)} className="p-1.5 text-slate-400 hover:text-red-500" title="ลบตัวเลือก">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addOption}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700"
            >
              <Plus className="w-3.5 h-3.5" /> เพิ่มตัวเลือก
            </button>
          </div>

          {/* Explanation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase text-slate-400">เฉลยละเอียด (อธิบายเหตุผล)</label>
              <button
                type="button"
                onClick={() => setExplanationVisible((v) => !v)}
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                  explanationVisible
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                }`}
              >
                {explanationVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {explanationVisible ? 'แสดงเฉลยให้ผู้ใช้' : 'ซ่อนเฉลยจากผู้ใช้'}
              </button>
            </div>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows="3"
              placeholder="อธิบายว่าทำไมข้อนี้ถึงถูก/ผิด (จะแสดงหลังส่งข้อสอบ ถ้าเปิดการมองเห็น)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
            ยกเลิก
          </button>
          <button
            onClick={save}
            disabled={saving || uploading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            บันทึกคำถาม
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Exam builder ---------------------------- */
export default function ExamBuilder({ examId, onDone, onCancel }) {
  const [id, setId] = useState(examId);
  const [meta, setMeta] = useState({
    title: '',
    description: '',
    time_limit_minutes: 60,
    shuffle_questions: true,
    shuffle_options: true,
    pass_percent: 50,
    is_hidden: false,
    is_paid: false,
    price: 0,
    discount_type: '',
    discount_value: 0,
    discount_starts_at: '',
    discount_ends_at: '',
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(!!examId);
  const [savingMeta, setSavingMeta] = useState(false);
  const [editing, setEditing] = useState(null); // question obj | 'new' | null

  useEffect(() => {
    if (examId) load(examId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  async function load(eid) {
    setLoading(true);
    try {
      const { exam, questions } = await mock.getExamFull(eid);
      setMeta({
        title: exam.title,
        description: exam.description || '',
        time_limit_minutes: Math.round((exam.time_limit_seconds || 0) / 60),
        shuffle_questions: exam.shuffle_questions,
        shuffle_options: exam.shuffle_options,
        pass_percent: exam.pass_percent,
        is_hidden: exam.is_hidden,
        is_paid: exam.is_paid,
        price: exam.price || 0,
        discount_type: exam.discount_type || '',
        discount_value: exam.discount_value || 0,
        discount_starts_at: toLocalInput(exam.discount_starts_at),
        discount_ends_at: toLocalInput(exam.discount_ends_at),
      });
      setQuestions(questions);
    } catch (e) {
      alert('โหลดข้อสอบไม่สำเร็จ: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveMeta() {
    if (!meta.title.trim()) return alert('กรุณาใส่ชื่อข้อสอบ');
    setSavingMeta(true);
    try {
      const payload = {
        title: meta.title.trim(),
        description: meta.description,
        time_limit_seconds: Math.max(0, Math.round(Number(meta.time_limit_minutes) * 60)),
        shuffle_questions: meta.shuffle_questions,
        shuffle_options: meta.shuffle_options,
        pass_percent: Number(meta.pass_percent) || 0,
        is_hidden: meta.is_hidden,
        is_paid: !!meta.is_paid,
        price: Number(meta.price) || 0,
        discount_type: meta.discount_type || null,
        discount_value: Number(meta.discount_value) || 0,
        discount_starts_at: toISO(meta.discount_starts_at),
        discount_ends_at: toISO(meta.discount_ends_at),
      };
      if (id) {
        await mock.updateExam(id, payload);
      } else {
        const created = await mock.createExam(payload);
        setId(created.id);
      }
      alert('บันทึกข้อมูลข้อสอบเรียบร้อย');
    } catch (e) {
      alert('บันทึกไม่สำเร็จ: ' + e.message);
    } finally {
      setSavingMeta(false);
    }
  }

  async function reloadQuestions() {
    if (!id) return;
    const { questions } = await mock.getExamFull(id);
    setQuestions(questions);
  }

  async function removeQuestion(q) {
    if (!window.confirm('ลบคำถามนี้?')) return;
    try {
      await mock.deleteQuestion(q.id);
      reloadQuestions();
    } catch (e) {
      alert('ลบไม่สำเร็จ: ' + e.message);
    }
  }

  async function moveQuestion(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= questions.length) return;
    const a = questions[index];
    const b = questions[target];
    try {
      await Promise.all([
        mock.saveQuestion(id, mapForReorder(a, b.order_index ?? target)),
        mock.saveQuestion(id, mapForReorder(b, a.order_index ?? index)),
      ]);
      reloadQuestions();
    } catch (e) {
      alert('จัดลำดับไม่สำเร็จ: ' + e.message);
    }
  }

  function mapForReorder(q, newIndex) {
    return {
      id: q.id,
      question_text: q.question_text,
      image_url: q.image_url,
      explanation: q.explanation,
      explanation_visible: q.explanation_visible,
      allow_multiple: q.allow_multiple,
      order_index: newIndex,
      options: (q.exam_options || []).map((o) => ({
        option_text: o.option_text,
        image_url: o.image_url,
        is_correct: o.is_correct,
      })),
    };
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> กลับไปรายการข้อสอบ
      </button>

      {/* Exam meta */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="font-bold text-slate-800 dark:text-zinc-100">
          {id ? 'ตั้งค่าข้อสอบ' : 'สร้างข้อสอบใหม่'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">ชื่อข้อสอบ</label>
            <input
              type="text"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
              placeholder="เช่น ข้อสอบ Cybersecurity ชุดที่ 1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">คำอธิบาย</label>
            <input
              type="text"
              value={meta.description}
              onChange={(e) => setMeta({ ...meta, description: e.target.value })}
              placeholder="คำอธิบายสั้น ๆ ของข้อสอบชุดนี้"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">เวลาทำ (นาที, 0 = ไม่จำกัด)</label>
            <input
              type="number" min="0"
              value={meta.time_limit_minutes}
              onChange={(e) => setMeta({ ...meta, time_limit_minutes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">เกณฑ์ผ่าน (%)</label>
            <input
              type="number" min="0" max="100"
              value={meta.pass_percent}
              onChange={(e) => setMeta({ ...meta, pass_percent: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-5 text-xs font-semibold text-slate-600 dark:text-zinc-300">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={meta.shuffle_questions} onChange={(e) => setMeta({ ...meta, shuffle_questions: e.target.checked })} />
            สลับลำดับข้อ
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={meta.shuffle_options} onChange={(e) => setMeta({ ...meta, shuffle_options: e.target.checked })} />
            สลับลำดับตัวเลือก
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={meta.is_hidden} onChange={(e) => setMeta({ ...meta, is_hidden: e.target.checked })} />
            ซ่อนข้อสอบ (ยังไม่เผยแพร่)
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={meta.is_paid} onChange={(e) => setMeta({ ...meta, is_paid: e.target.checked })} />
            เก็บเงินข้อสอบนี้
          </label>
        </div>

        {meta.is_paid && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">ราคา (บาท)</label>
              <input type="number" min="0" value={meta.price} onChange={(e) => setMeta({ ...meta, price: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">ส่วนลด</label>
                <select value={meta.discount_type} onChange={(e) => setMeta({ ...meta, discount_type: e.target.value })} className="w-full px-2 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs">
                  <option value="">ไม่มี</option>
                  <option value="percent">ลด %</option>
                  <option value="amount">ลดบาท</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">มูลค่า</label>
                <input type="number" min="0" value={meta.discount_value} onChange={(e) => setMeta({ ...meta, discount_value: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            {meta.discount_type && (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">เริ่มโปร (เว้นว่าง=ทันที)</label>
                  <input type="datetime-local" value={meta.discount_starts_at} onChange={(e) => setMeta({ ...meta, discount_starts_at: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">สิ้นสุดโปร (เว้นว่าง=ไม่จำกัด)</label>
                  <input type="datetime-local" value={meta.discount_ends_at} onChange={(e) => setMeta({ ...meta, discount_ends_at: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs" />
                </div>
              </>
            )}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={saveMeta}
            disabled={savingMeta}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white"
          >
            {savingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {id ? 'บันทึกการตั้งค่า' : 'สร้างข้อสอบ'}
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 dark:text-zinc-100">คำถาม ({questions.length})</h2>
          <button
            onClick={() => (id ? setEditing('new') : alert('กรุณากด "สร้างข้อสอบ" ด้านบนก่อน เพื่อบันทึกข้อสอบ แล้วจึงเพิ่มคำถามได้'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> เพิ่มคำถาม
          </button>
        </div>

        {questions.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">ยังไม่มีคำถาม — กด "เพิ่มคำถาม"</p>
        ) : (
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="flex flex-col items-center pt-0.5">
                  <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                  <button onClick={() => moveQuestion(i, 1)} disabled={i === questions.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-zinc-200 line-clamp-2">{q.question_text}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                    <span>{q.exam_options?.length || 0} ตัวเลือก</span>
                    <span>{q.allow_multiple ? 'หลายคำตอบ' : 'คำตอบเดียว'}</span>
                    {q.image_url && <span>มีรูป</span>}
                    {q.explanation && <span className={q.explanation_visible ? 'text-emerald-500' : 'text-slate-400'}>มีเฉลย{q.explanation_visible ? '' : ' (ซ่อน)'}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditing(q)} className="p-1.5 text-slate-400 hover:text-blue-500" title="แก้ไข">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeQuestion(q)} className="p-1.5 text-slate-400 hover:text-red-500" title="ลบ">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {id && questions.length > 0 && (
          <div className="pt-3 flex justify-end">
            <button onClick={onDone} className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
              เสร็จสิ้น
            </button>
          </div>
        )}
      </div>

      {editing && (
        <QuestionEditor
          examId={id}
          question={editing === 'new' ? null : editing}
          orderIndex={questions.length}
          onSaved={() => {
            setEditing(null);
            reloadQuestions();
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
