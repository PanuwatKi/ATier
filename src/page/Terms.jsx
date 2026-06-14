import React from 'react';
import { FileText, Shield, RotateCcw } from 'lucide-react';

const UPDATED = '14 มิถุนายน 2026';

function Section({ id, icon: Icon, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-zinc-100 mb-3">
        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" /> {title}
      </h2>
      <div className="space-y-2 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">ข้อกำหนดและนโยบาย</h1>
          <p className="text-xs text-slate-400 mt-1">ปรับปรุงล่าสุด: {UPDATED}</p>
        </div>

        <Section id="terms" icon={FileText} title="ข้อกำหนดการใช้งาน (Terms of Service)">
          <p>การใช้งานเว็บไซต์ Adusaurus ถือว่าคุณยอมรับข้อกำหนดเหล่านี้ กรุณาอ่านโดยละเอียด</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>เนื้อหาคอร์สเรียน ข้อสอบ และสื่อทั้งหมดมีไว้เพื่อการศึกษาส่วนบุคคลเท่านั้น ห้ามทำซ้ำ เผยแพร่ หรือจำหน่ายต่อโดยไม่ได้รับอนุญาต</li>
            <li>บัญชีผู้ใช้เป็นของบุคคลเดียว ห้ามแชร์สิทธิ์การเข้าถึงที่ชำระเงินแล้วให้ผู้อื่น</li>
            <li>ผู้ใช้ต้องเข้าสู่ระบบด้วยบัญชี Google ที่ถูกต้องเพื่อเข้าถึงฟีเจอร์บางอย่าง เช่น การทำข้อสอบ Mock Exam</li>
            <li>ทีมงานขอสงวนสิทธิ์ในการปรับปรุง เพิ่ม หรือลบเนื้อหาและฟีเจอร์ได้โดยไม่ต้องแจ้งล่วงหน้า</li>
            <li>ห้ามใช้เว็บไซต์ในทางที่ผิดกฎหมาย หรือพยายามเจาะระบบ/ดึงข้อมูลโดยไม่ได้รับอนุญาต</li>
          </ul>
        </Section>

        <Section id="privacy" icon={Shield} title="นโยบายความเป็นส่วนตัว (Privacy Policy)">
          <p>เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการ และให้ความสำคัญกับความเป็นส่วนตัวของคุณ</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>ข้อมูลที่เก็บ:</strong> ชื่อ อีเมล และรูปโปรไฟล์จากการเข้าสู่ระบบด้วย Google, ประวัติการเรียน/การทำข้อสอบ และข้อมูลการชำระเงิน (รวมถึงสลิป)</li>
            <li><strong>การใช้ข้อมูล:</strong> เพื่อยืนยันตัวตน เปิดสิทธิ์การเข้าถึง บันทึกสถิติการเรียน และตรวจสอบการชำระเงิน</li>
            <li><strong>สลิปการโอนเงิน</strong> ถูกจัดเก็บแบบส่วนตัว และเข้าถึงได้เฉพาะผู้ดูแลระบบที่ได้รับอนุญาตเพื่อการตรวจสอบเท่านั้น</li>
            <li>เราไม่ขายหรือเปิดเผยข้อมูลส่วนบุคคลของคุณให้บุคคลภายนอกเพื่อการตลาด</li>
            <li>คุณสามารถขอลบบัญชีและข้อมูลของคุณได้โดยติดต่อทีมงาน</li>
          </ul>
        </Section>

        <Section id="refund" icon={RotateCcw} title="นโยบายการคืนเงิน (Refund Policy)">
          <p>เนื่องจากคอร์สเรียนและข้อสอบเป็นสินค้าดิจิทัลที่เข้าถึงได้ทันทีหลังได้รับอนุมัติ โปรดพิจารณาก่อนชำระเงิน</p>
          <ul className="list-disc pl-5 space-y-1">
            {/*
            <li>ขอคืนเงินได้ภายใน <strong>7 วัน</strong> นับจากวันที่ได้รับสิทธิ์ <strong>โดยมีเงื่อนไขว่ายังไม่ได้เริ่มเข้าเรียน/ทำข้อสอบ</strong> ในรายการนั้น</li>
            */}
            <li>หากเริ่มเข้าถึงเนื้อหาแล้ว จะไม่สามารถขอคืนเงินได้ ยกเว้นกรณีระบบมีข้อผิดพลาดทำให้ใช้งานไม่ได้</li>
            <li>กรณีโอนเงินผิดจำนวน/ซ้ำซ้อน ทีมงานจะคืนส่วนต่างให้หลังตรวจสอบ</li>
            {/* <li>การขอคืนเงินทำได้โดยกดปุ่ม “แจ้งปัญหา” ในหน้า <strong>บัญชีของฉัน</strong> หรือติดต่อทีมงานพร้อมแนบหลักฐานการชำระเงิน</li>
            */}
            <li>ระยะเวลาดำเนินการคืนเงินประมาณ 3–7 วันทำการหลังได้รับการอนุมัติ</li>
          </ul>
        </Section>

        <p className="text-xs text-slate-400 text-center pt-2">
          มีคำถามเกี่ยวกับข้อกำหนดหรือการชำระเงิน? ติดต่อทีมงาน Adusaurus ได้ผ่านช่องทางในหน้า Home
        </p>
      </div>
    </div>
  );
}
