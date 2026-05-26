import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Instagram, 
  MessageSquare, 
  Mail, 
  X, 
  Shield, 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 

// เพิ่มข้อมูลเริ่มต้นให้มีส่วนของรางวัล (awards) และการตั้งค่าสิทธิ์การเห็น (visibility) แยกแต่ละคน
const INITIAL_MEMBERS = [
  { 
    id: 1, 
    name: "Panuwat Kiatteerarat", 
    study: "Computer Engineer Student", 
    university: "--", 
    phone: "063-879-0083", 
    ig: "@pnwiinn", 
    line: "maibok", 
    email: "in.klang2551@gmail.com",
    awards: ["2 Silver Medals - SSYS 2026 (Penang)", "National Software Contest (NSC) Finalist"],
    hidden: false,
    visibility: { phone: true, ig: true, line: true, email: true }
  },
  { 
    id: 2, 
    name: "Kornkanok P.", 
    study: "Engineering Student", 
    university: "Chulalongkorn University", 
    phone: "082-345-6789", 
    ig: "@korn_p", 
    line: "korn_line", 
    email: "kornkanok@atier.org",
    awards: ["Outstanding Youth Innovation Award 2025"],
    hidden: false,
    visibility: { phone: true, ig: true, line: true, email: true }
  },
  { 
    id: 3, 
    name: "Nattakit M.", 
    study: "Computer Science Student", 
    university: "Kasetsart University", 
    phone: "083-456-7890", 
    ig: "@nat_kit", 
    line: "nat_line", 
    email: "nattakit@atier.org",
    awards: ["Thailand Olympiad in Informatics (TOI) Participant"],
    hidden: false,
    visibility: { phone: true, ig: true, line: true, email: true }
  },
  { 
    id: 4, 
    name: "Pimchanok T.", 
    study: "Biomedical Student", 
    university: "Mahidol University", 
    phone: "084-567-8901", 
    ig: "@pim_t", 
    line: "pim_line", 
    email: "pimchanok@atier.org",
    awards: ["Young Biologist Competition 1st Runner-up"],
    hidden: false,
    visibility: { phone: true, ig: true, line: true, email: true }
  }
];

export default function Home() {
  const { user, role } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // เปลี่ยนมาใช้ State จัดการข้อมูลสมาชิกเพื่อให้ เพิ่ม/ลด/ซ่อน ได้แบบ Dynamic
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form States สำหรับเพิ่มสมาชิกใหม่
  const [newMember, setNewMember] = useState({
    name: '', study: '', university: '', phone: '', ig: '', line: '', email: '', awards: ''
  });

  useEffect(() => {
    const hasAdminRole = role === 'Admin' || role === 'Super Admin' || role === 'admin' || role === 'super_admin';
    if (hasAdminRole) {
      setIsAdminUser(true);
      setIsAdmin(true); 
    } else {
      setIsAdminUser(false);
      setIsAdmin(false);
    }
  }, [role]);

  // กรองสมาชิกที่จะแสดงผล (ถ้าไม่ใช่แอดมิน จะไม่เห็นคนที่ถูกซ่อน)
  const visibleMembers = members.filter(m => isAdmin || !m.hidden);
  
  // ตรวจสอบเงื่อนไขการเลื่อน Marquee (ถ้าน้อยกว่า 4 คน ให้หยุดเลื่อน)
  const shouldScroll = visibleMembers.length >= 4;

  const openModal = (member) => setSelectedMember(member);
  const closeModal = () => setSelectedMember(null);

  // ฟังก์ชันสลับการซ่อน/แสดงโปรไฟล์สมาชิกทั้งหมด
  const toggleHideMember = (id, e) => {
    e.stopPropagation(); // ป้องกันไม่ให้ไปเปิดหน้าต่าง Modal
    setMembers(prev => prev.map(m => m.id === id ? { ...m, hidden: !m.hidden } : m));
  };

  // ฟังก์ชันลบสมาชิก
  const deleteMember = (id, e) => {
    e.stopPropagation();
    if(window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิกคนนี้?")) {
      setMembers(prev => prev.filter(m => m.id !== id));
      if (selectedMember?.id === id) closeModal();
    }
  };

  // ฟังก์ชันสลับการซ่อนข้อมูลเฉพาะฟิลด์ในนามบัตร
  const toggleFieldVisibility = (memberId, field) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updatedVisibility = { ...m.visibility, [field]: !m.visibility[field] };
        // อัปเดตข้อมูลใน selectedMember ปัจจุบันด้วยเพื่อให้หน้าจอเปลี่ยนทันที
        if (selectedMember && selectedMember.id === memberId) {
          setSelectedMember(current => ({ ...current, visibility: updatedVisibility }));
        }
        return { ...m, visibility: updatedVisibility };
      }
      return m;
    }));
  };

  // ฟังก์ชันเพิ่มสมาชิกใหม่
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.study) return alert("กรุณากรอกชื่อและสาขาวิชา");

    const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
    const item = {
      id: newId,
      name: newMember.name,
      study: newMember.study,
      university: newMember.university || '--',
      phone: newMember.phone || '--',
      ig: newMember.ig || '--',
      line: newMember.line || '--',
      email: newMember.email || '--',
      awards: newMember.awards ? newMember.awards.split(',').map(a => a.trim()) : [],
      hidden: false,
      visibility: { phone: true, ig: true, line: true, email: true }
    };

    setMembers(prev => [...prev, item]);
    setIsAddModalOpen(false);
    setNewMember({ name: '', study: '', university: '', phone: '', ig: '', line: '', email: '', awards: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 py-12 transition-colors duration-200 relative overflow-hidden">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee-infinite { animation: marquee 35s linear infinite; }
      `}</style>

      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
            Adusaurus Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Our elite ecosystem of change-makers.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdminUser && (
            <>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full font-medium bg-blue-600 hover:bg-blue-500 text-white text-sm transition-all shadow-md shadow-blue-500/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มสมาชิก</span>
              </button>
              
              <button 
                onClick={() => setIsAdmin(!isAdmin)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium border text-sm transition-all shadow-sm cursor-pointer ${
                  isAdmin 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400' 
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>{isAdmin ? 'Admin View: Active' : 'Public View'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Marquee Member Carousel */}
      <div className="w-full relative py-6 bg-white dark:bg-zinc-900/40 border-y border-slate-200/60 dark:border-zinc-800/60 shadow-inner">
        <div className="flex overflow-hidden select-none group">
          <div className={`flex shrink-0 gap-6 px-3 ${shouldScroll ? 'animate-marquee-infinite group-hover:[animation-play-state:paused]' : 'w-full justify-center'}`}>
            {/* หากจำนวนคนน้อยกว่า 4 ไม่ต้องเบิ้ล Array เพื่อทำ Infinite Scroll */}
            {(shouldScroll ? [...visibleMembers, ...visibleMembers] : visibleMembers).map((member, index) => (
              <div 
                key={`${member.id}-${index}`} 
                onClick={() => openModal(member)} 
                className={`w-64 shrink-0 bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-500/40 cursor-pointer relative transition-all ${
                  member.hidden ? 'border-dashed border-amber-500/60 opacity-75' : 'border-slate-200/80 dark:border-zinc-800/80'
                }`}
              >
                {/* ปุ่มจัดการสำหรับการ์ดแต่ละใบ (เฉพาะแอดมิน) */}
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    <button 
                      onClick={(e) => toggleHideMember(member.id, e)}
                      className={`p-1 rounded-md border transition-colors ${member.hidden ? 'bg-amber-500/20 border-amber-400 text-amber-500' : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 hover:text-blue-500'}`}
                      title={member.hidden ? "แสดงโปรไฟล์" : "ซ่อนโปรไฟล์"}
                    >
                      {member.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      onClick={(e) => deleteMember(member.id, e)}
                      className="p-1 rounded-md bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-400 hover:text-red-500 hover:border-red-500/30 transition-colors"
                      title="ลบสมาชิก"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0"><User className="w-6 h-6" /></div>
                  <div className="overflow-hidden pr-12">
                    <h3 className="font-semibold truncate text-sm">{member.name}</h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{member.study}</p>
                    {member.hidden && <span className="text-[10px] text-amber-500 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">Hidden</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 💳 หน้าต่างแสดงรายละเอียดสไตล์ นามบัตรพรีเมียม (Business Card Modal) */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200/80 dark:border-zinc-800 relative z-10 overflow-hidden transition-all">
            
            {/* ปุ่มปิดบนการ์ด */}
            <button onClick={closeModal} className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            {/* ส่วนบนของนามบัตร: Layout ข้อมูลหลัก */}
            <div className="p-8 border-b border-slate-100 dark:border-zinc-800/80 bg-gradient-to-br from-slate-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
              <div className="flex flex-col sm:flex-row gap-6 items-start justify-between">
                
                {/* ฝั่งซ้าย: ข้อมูลรายบุคคล */}
                <div className="space-y-4 flex-1 order-2 sm:order-1 w-full">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">{selectedMember.name}</h2>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">{selectedMember.study}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedMember.university}</p>
                  </div>

                  {/* รายการฟิลด์ติดต่อติดต่อบนหน้าการ์ด */}
                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {[
                      { key: 'phone', val: selectedMember.phone, icon: Phone, label: "Phone" },
                      { key: 'ig', val: selectedMember.ig, icon: Instagram, label: "Instagram" },
                      { key: 'line', val: selectedMember.line, icon: MessageSquare, label: "Line ID" },
                      { key: 'email', val: selectedMember.email, icon: Mail, label: "Email" }
                    ].map((item) => {
                      const isVisible = selectedMember.visibility?.[item.key] !== false;
                      // บุคคลทั่วไปจะไม่เห็นฟิลด์ที่โดนสั่งซ่อนไว้
                      if (!isAdmin && !isVisible) return null;

                      return (
                        <div key={item.key} className={`flex items-center justify-between p-2 px-3 rounded-xl border text-xs transition-all ${
                          !isVisible ? 'bg-amber-500/5 border-dashed border-amber-500/30 opacity-60' : 'bg-white dark:bg-zinc-950 border-slate-200/60 dark:border-zinc-800/60'
                        }`}>
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <item.icon className={`w-3.5 h-3.5 shrink-0 ${!isVisible ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className="font-medium text-slate-700 dark:text-zinc-300 truncate">{item.val}</span>
                          </div>
                          
                          {/* ปุ่มเปิด/ปิดการมองเห็นของแต่ละฟิลด์ (เฉพาะแอดมิน) */}
                          {isAdmin && (
                            <button 
                              onClick={() => toggleFieldVisibility(selectedMember.id, item.key)}
                              className={`p-1 rounded-md border text-[10px] font-semibold transition-all cursor-pointer ${
                                isVisible 
                                  ? 'bg-slate-50 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700 hover:text-amber-500' 
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              }`}
                              title={isVisible ? "ซ่อนฟิลด์นี้จากสาธารณะ" : "แสดงฟิลด์นี้ให้สาธารณะเห็น"}
                            >
                              {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ฝั่งบนขวา: รูปภาพโปรไฟล์ทรงกลม */}
                <div className="order-1 sm:order-2 self-center sm:self-start shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-1 shadow-md shadow-blue-500/10">
                    <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center">
                      <User className="w-12 h-12 text-slate-300 dark:text-zinc-700" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ส่วนล่างของนามบัตร: ส่วนแสดงรางวัลที่ได้รับ (Awards) */}
            <div className="p-8 bg-white dark:bg-zinc-900/60">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-amber-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">รางวัลที่ได้รับ / Achievements</h3>
              </div>
              
              {selectedMember.awards && selectedMember.awards.length > 0 ? (
                <ul className="space-y-2">
                  {selectedMember.awards.map((award, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-950 p-2.5 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{award}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-slate-400 dark:text-zinc-600">ไม่มีข้อมูลรางวัลสำหรับสมาชิกคนนี้</p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ➕ หน้าต่าง Modal สำหรับเพิ่มสมาชิกใหม่ (เฉพาะแอดมิน) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <form onSubmit={handleAddMember} className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg p-6 relative z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">เพิ่มสมาชิกใหม่</h2>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">ชื่อ-นามสกุล *</label>
                <input type="text" required value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-blue-500" placeholder="เช่น Panuwat K." />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">สถานะการศึกษา/สายงาน *</label>
                <input type="text" required value={newMember.study} onChange={e => setNewMember({...newMember, study: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-blue-500" placeholder="เช่น Computer Science Student" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">มหาวิทยาลัย / สถานศึกษา</label>
                <input type="text" value={newMember.university} onChange={e => setNewMember({...newMember, university: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-blue-500" placeholder="เช่น Chulalongkorn University" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">เบอร์โทรศัพท์</label>
                <input type="text" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-blue-500" placeholder="เช่น 063-xxx-xxxx" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Instagram</label>
                <input type="text" value={newMember.ig} onChange={e => setNewMember({...newMember, ig: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-blue-500" placeholder="เช่น @username" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Line ID</label>
                <input type="text" value={newMember.line} onChange={e => setNewMember({...newMember, line: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-blue-500" placeholder="ใส่ไอดีไลน์" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-slate-400">อีเมล</label>
                <input type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-blue-500" placeholder="example@atier.org" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-slate-400">รางวัลที่ได้รับ (คั่นด้วยเครื่องหมายจุลภาค , ถ้ามีหลายรางวัล)</label>
                <textarea value={newMember.awards} onChange={e => setNewMember({...newMember, awards: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-blue-500 h-20 resize-none" placeholder="เช่น รางวัลชนะเลิศอันดับ 1, เหรียญเงิน SSYS 2026" />
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors shadow-md cursor-pointer">
              บันทึกข้อมูลสมาชิก
            </button>
          </form>
        </div>
      )}
    </div>
  );
}