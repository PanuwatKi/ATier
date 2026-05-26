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
  Award,
  Image as ImageIcon,
  Loader2 // เพิ่มไอคอนโหลดสำหรับตอนกำลังอัปโหลดรูป
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 
// ✨ นำเข้าสถาปัตยกรรม supabase client เพื่อใช้จัดการอัปโหลดไฟล์ลง Storage
import { supabase } from '../supabaseClient'; 

const INITIAL_MEMBERS = [
  { 
    id: 1, 
    name: "Panuwat Kiatteerarat", 
    study: "Computer Engineer Student", 
    university: "--", 
    imageUrl: null, 
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
    imageUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=300&auto=format&fit=facearea", 
    phone: "082-345-6789", 
    ig: "@korn_p", 
    line: "korn_line", 
    email: "kornkanok@atier.org",
    awards: ["Outstanding Youth Innovation Award 2025"],
    hidden: false,
    visibility: { phone: true, ig: true, line: true, email: true }
  }
];

export default function Home() {
  const { user, role } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // ✨ สเตทตรวจสอบสถานะการอัปโหลดไฟล์ไปยัง Supabase
  const [isUploading, setIsUploading] = useState(false);

  // Form States สำหรับเพิ่มสมาชิกใหม่
  const [newMember, setNewMember] = useState({
    name: '', study: '', university: '', imageUrl: '', phone: '', ig: '', line: '', email: '', awards: ''
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

  const visibleMembers = members.filter(m => isAdmin || !m.hidden);
  const shouldScroll = visibleMembers.length >= 4;

  const openModal = (member) => setSelectedMember(member);
  const closeModal = () => setSelectedMember(null);

  const toggleHideMember = (id, e) => {
    e.stopPropagation(); 
    setMembers(prev => prev.map(m => m.id === id ? { ...m, hidden: !m.hidden } : m));
  };

  const deleteMember = (id, e) => {
    e.stopPropagation();
    if(window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิกคนนี้?")) {
      setMembers(prev => prev.filter(m => m.id !== id));
      if (selectedMember?.id === id) closeModal();
    }
  };

  const toggleFieldVisibility = (memberId, field) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updatedVisibility = { ...m.visibility, [field]: !m.visibility[field] };
        if (selectedMember && selectedMember.id === memberId) {
          setSelectedMember(current => ({ ...current, visibility: updatedVisibility }));
        }
        return { ...m, visibility: updatedVisibility };
      }
      return m;
    }));
  };

  // ✨ ฟังก์ชันสำหรับอัปโหลดไฟล์ภาพตรงเข้าสู่ Supabase Storage Bucket
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบขนาดไฟล์ (จำกัดไม่เกิน 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดไฟล์ใหญ่เกินไป กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 5MB");
      return;
    }

    try {
      setIsUploading(true);

      // สร้างชื่อไฟล์แบบสุ่มด้วย Timestamp เพื่อป้องกันชื่อไฟล์ซ้ำกันในระบบ
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 1. ส่งไฟล์ขึ้นระบบ Supabase Storage ไปที่ bucket: 'member-avatars'
      const { error: uploadError } = await supabase.storage
        .from('member-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. ดึงลิงก์ถาวร (Public URL) ของรูปภาพที่เพิ่งอัปโหลดสำเร็จ
      const { data } = supabase.storage
        .from('member-avatars')
        .getPublicUrl(filePath);

      // 3. บันทึกลิงก์ที่ได้ลงใน State ฟอร์มสมาชิกใหม่
      setNewMember(prev => ({ ...prev, imageUrl: data.publicUrl }));

    } catch (error) {
      console.error('Upload failed:', error.message);
      alert('ไม่สามารถอัปโหลดรูปภาพได้: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (isUploading) return alert("กรุณารอให้อัปโหลดรูปภาพเสร็จสิ้นก่อนครับ");
    if (!newMember.name || !newMember.study) return alert("กรุณากรอกชื่อและสาขาวิชา");

    const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
    const item = {
      id: newId,
      name: newMember.name,
      study: newMember.study,
      university: newMember.university || '--',
      imageUrl: newMember.imageUrl || null, 
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
    setNewMember({ name: '', study: '', university: '', imageUrl: '', phone: '', ig: '', line: '', email: '', awards: '' });
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
            {(shouldScroll ? [...visibleMembers, ...visibleMembers] : visibleMembers).map((member, index) => (
              <div 
                key={`${member.id}-${index}`} 
                onClick={() => openModal(member)} 
                className={`w-64 shrink-0 bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-500/40 cursor-pointer relative transition-all ${
                  member.hidden ? 'border-dashed border-amber-500/60 opacity-75' : 'border-slate-200/80 dark:border-zinc-800/80'
                }`}
              >
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
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-slate-100 dark:border-zinc-800/60 overflow-hidden">
                    {member.imageUrl ? (
                      <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center rounded-full">
                        <User className="w-6 h-6 text-slate-400 dark:text-zinc-600" />
                      </div>
                    )}
                  </div>
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

      {/* 💳 หน้าต่างรายละเอียดสไตล์ นามบัตรพรีเมียม (Business Card Modal) */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200/80 dark:border-zinc-800 relative z-10 overflow-hidden transition-all">
            <button onClick={closeModal} className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer z-10">
              <X className="w-4 h-4" />
            </button>

            <div className="p-8 border-b border-slate-100 dark:border-zinc-800/80 bg-gradient-to-br from-slate-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
              <div className="flex flex-col sm:flex-row gap-6 items-start justify-between">
                
                <div className="space-y-4 flex-1 order-2 sm:order-1 w-full">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">{selectedMember.name}</h2>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">{selectedMember.study}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedMember.university}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {[
                      { key: 'phone', val: selectedMember.phone, icon: Phone, label: "Phone" },
                      { key: 'ig', val: selectedMember.ig, icon: Instagram, label: "Instagram" },
                      { key: 'line', val: selectedMember.line, icon: MessageSquare, label: "Line ID" },
                      { key: 'email', val: selectedMember.email, icon: Mail, label: "Email" }
                    ].map((item) => {
                      const isVisible = selectedMember.visibility?.[item.key] !== false;
                      if (!isAdmin && !isVisible) return null;

                      return (
                        <div key={item.key} className={`flex items-center justify-between p-2 px-3 rounded-xl border text-xs transition-all ${
                          !isVisible ? 'bg-amber-500/5 border-dashed border-amber-500/30 opacity-60' : 'bg-white dark:bg-zinc-950 border-slate-200/60 dark:border-zinc-800/60'
                        }`}>
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <item.icon className={`w-3.5 h-3.5 shrink-0 ${!isVisible ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className="font-medium text-slate-700 dark:text-zinc-300 truncate">{item.val}</span>
                          </div>
                          
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

                <div className="order-1 sm:order-2 self-center sm:self-start shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-1 shadow-md shadow-blue-500/10 overflow-hidden">
                    <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center">
                      {selectedMember.imageUrl ? (
                        <img src={selectedMember.imageUrl} alt={selectedMember.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <User className="w-12 h-12 text-slate-300 dark:text-zinc-700" />
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

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
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-slate-400">ชื่อ-นามสกุล *</label>
                <input type="text" required value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-blue-500" placeholder="เช่น Panuwat K." />
              </div>
              
              {/* 🛠️ ช่องเลือกอัปโหลดรูปภาพโปรไฟล์สมาชิกจริง ๆ ไร้ความจำเป็นต้องกรอกลิงก์ */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-slate-400 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> รูปภาพโปรไฟล์สมาชิก
                </label>
                <div className="flex items-center gap-4 p-3 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/40 dark:bg-zinc-950/40 relative">
                  
                  {isUploading ? (
                    // แสดงไอคอน Loading หมุน ๆ ระหว่างส่งรูปขึ้นระบบ Supabase Storage
                    <div className="w-16 h-16 rounded-full border border-blue-500/30 flex flex-col items-center justify-center bg-blue-500/5 shrink-0">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="text-[9px] text-blue-500 font-medium mt-1">Uploading</span>
                    </div>
                  ) : newMember.imageUrl ? (
                    // แสดงภาพ Preview จริงที่ดึงมาจากลิงก์ Public URL บนคลาวด์
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-800 shrink-0 group">
                      <img src={newMember.imageUrl} alt="Uploaded Profile" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setNewMember(prev => ({ ...prev, imageUrl: '' }))}
                        className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-semibold cursor-pointer"
                      >
                        เปลี่ยนรูป
                      </button>
                    </div>
                  ) : (
                    // กรณีที่ยังไม่ได้เลือกรูป
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-600 shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={isUploading}
                      onChange={handleFileChange}
                      className="block w-full text-xs text-slate-500 dark:text-zinc-400
                        file:mr-4 file:py-1.5 file:px-3
                        file:rounded-xl file:border-0
                        file:text-xs file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        dark:file:bg-blue-950/40 dark:file:text-blue-400
                        hover:file:bg-blue-100 dark:hover:file:bg-blue-950/60
                        disabled:opacity-50 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">เลือกไฟล์ภาพจากเครื่อง ระบบจะอัปโหลดขึ้นคลาวด์อัตโนมัติ</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">สถานะการศึกษา/สายงาน *</label>
                <input type="text" required value={newMember.study} onChange={e => setNewMember({...newMember, study: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-blue-500" placeholder="เช่น Computer Engineer Student" />
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
              <div className="">
                <label className="block text-xs font-semibold mb-1 text-slate-400">อีเมล</label>
                <input type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-blue-500" placeholder="example@atier.org" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-slate-400">รางวัลที่ได้รับ (คั่นด้วยเครื่องหมายจุลภาค , ถ้ามีหลายรางวัล)</label>
                <textarea value={newMember.awards} onChange={e => setNewMember({...newMember, awards: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:border-blue-500 h-20 resize-none" placeholder="เช่น รางวัลชนะเลิศอันดับ 1, เหรียญเงิน SSYS 2026" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isUploading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors shadow-md cursor-pointer"
            >
              {isUploading ? "กำลังประมวลผลรูปภาพ..." : "บันทึกข้อมูลสมาชิก"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}