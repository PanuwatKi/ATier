import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BookOpen, ListChecks, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import * as mock from '../lib/mockApi';
import { effectivePrice, hasActiveDiscount, discountPercent, formatTHB } from '../lib/pricing';

export default function Promotions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [coursesRes, exams] = await Promise.all([
          supabase
            .from('courses')
            .select('id,title,description,image_url,is_hidden,price,is_paid,discount_type,discount_value,discount_starts_at,discount_ends_at')
            .eq('is_hidden', false),
          mock.listExams(),
        ]);
        const courses = coursesRes.data || [];
        const courseItems = courses
          .filter((c) => c.is_paid && hasActiveDiscount(c))
          .map((c) => ({ kind: 'course', to: '/courses', image: c.image_url, ...c }));
        const examItems = (exams || [])
          .filter((e) => !e.is_hidden && e.is_paid && hasActiveDiscount(e))
          .map((e) => ({ kind: 'exam', to: '/mock', image: null, ...e }));
        setItems([...courseItems, ...examItems]);
      } catch (e) {
        console.error('promotions load failed:', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50">
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-500"><Sparkles className="w-6 h-6" /></div>
          <div>
            <span className="text-[11px] font-bold tracking-widest text-red-500 uppercase">Special Offers</span>
            <h1 className="text-3xl font-extrabold tracking-tight">โปรโมชั่นส่วนลด</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-8">คอร์สเรียนและข้อสอบที่กำลังลดราคาในขณะนี้</p>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-900">
            <Sparkles className="mx-auto text-slate-300 dark:text-zinc-700 mb-3" size={40} />
            <p className="text-sm font-medium text-slate-400">ตอนนี้ยังไม่มีรายการลดราคา</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Link
                to={item.to}
                key={`${item.kind}:${item.id}`}
                className="group flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/70 dark:border-zinc-800/70 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="relative h-40 bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-zinc-700"><ListChecks className="w-12 h-12" /></div>
                  )}
                  <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg shadow">
                    ลด {discountPercent(item)}%
                  </span>
                  <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase px-2 py-1 rounded inline-flex items-center gap-1">
                    {item.kind === 'course' ? <BookOpen className="w-3 h-3" /> : <ListChecks className="w-3 h-3" />}
                    {item.kind === 'course' ? 'คอร์ส' : 'ข้อสอบ'}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed flex-1">{item.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm line-through text-slate-400">{formatTHB(item.price)}</span>
                      <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{formatTHB(effectivePrice(item))}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                      ดูเลย <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
