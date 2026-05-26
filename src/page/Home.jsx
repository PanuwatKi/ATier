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
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 
import { supabase } from '../supabaseClient'; 

export default function Home() {
  const { role } = useAuth();
  // เช็คสิทธิ์ว่าเป็นแอดมินหรือไม่
  const isAdmin = role === 'Admin' || role === 'Super Admin' || role === 'admin' || role === 'super_admin';

  // State จัดการข้อมูลสมาชิกจาก Database
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State จัดการ Modals และการอัปโหลดรูปภาพ
  const [selectedMember, setSelectedMember] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // State สำหรับฟอร์มเพิ่มสมาชิกใหม่
  const [newMember, setNewMember] = useState({
    name: '',
    study: '',
    university: '',
    imageUrl: '',
    phone: '',
    ig: '',
    line: '',
    email: '',
    awards: ''
  });

  // ฟังก์ชัน 1: ดึงข้อมูลสมาชิกทั้งหมดจาก Supabase Database
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // ฟังก์ชัน 2: จัดการอัปโหลดรูปภาพเข้าสู่ Storage Bucket
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('member-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('member-avatars')
        .getPublicUrl(filePath);

      setNewMember(prev => ({ ...prev, imageUrl: data.publicUrl }));
    } catch (error) {
      alert('อัปโหลดรูปภาพล้มเหลว: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ฟังก์ชัน 3: เพิ่มข้อมูลสมาชิกใหม่ลงฐานข้อมูลจริง
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (isUploading) return alert("กรุณารอให้อัปโหลดรูปภาพเสร็จสิ้นก่อนครับ");
    if (!newMember.name || !newMember.study) return alert("กรุณากรอกชื่อและสาขาวิชา");

    const itemToInsert = {
      name: newMember.name,
      study: newMember.study,
      university: newMember.university || '--',
      imageUrl: newMember.imageUrl || null, 
      phone: newMember.phone || '--',
      ig: newMember.ig || '--',
      line: newMember.line || '--',
      email: newMember.email || '--',
      awards: newMember.awards ? newMember.awards.split(',').map(a => a.trim()).filter(Boolean) : [],
      hidden: false,
      visibility: { phone: true, ig: true, line: true, email: true }
    };

    try {
      const { data, error } = await supabase
        .from('members')
        .insert([itemToInsert])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setMembers(prev => [...prev, data[0]]);
        setIsAddModalOpen(false);
        setNewMember({ name: '', study: '', university: '', imageUrl: '', phone: '', ig: '', line: '', email: '', awards: '' });
      }
    } catch (error) {
      alert('ไม่สามารถเพิ่มข้อมูลสมาชิกได้: ' + error.message);
    }
  };

  // ฟังก์ชัน 4: ลบข้อมูลสมาชิกออกจากฐานข้อมูลจริง
  const handleDeleteMember = async (id, e) => {
    e.stopPropagation(); // ป้องกันไม่ให้ไปเปิดหน้าต่างแสดงรายละเอียดซ้อนขึ้นมา
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิกคนนี้จากระบบ?")) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== id));
      if (selectedMember && selectedMember.id === id) setSelectedMember(null);
    } catch (error) {
      alert('ลบข้อมูลล้มเหลว: ' + error.message);
    }
  };

  // ฟังก์ชัน 5: เปิด-ปิดการแสดงผลรายบุคคล (ตาบอด/ตาเปิด)
  const toggleVisibility = async (key) => {
    if (!selectedMember) return;
    
    const updatedVisibility = {
      ...selectedMember.visibility,
      [key]: !selectedMember.visibility?.[key]
    };

    try {
      const { error } = await supabase
        .from('members')
        .update({ visibility: updatedVisibility })
        .eq('id', selectedMember.id);

      if (error) throw error;

      const updatedMember = { ...selectedMember, visibility: updatedVisibility };
      setSelectedMember(updatedMember);
      setMembers(prev => prev.map(m => m.id === selectedMember.id ? updatedMember : m));
    } catch (error) {
      console.error('Failed to update visibility:', error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // สร้าง Component การ์ดสมาชิกเพื่อเอาไปใช้ซ้ำในโหมดสไลด์และโหมดปกติ
  const renderMemberCard = (member, uniqueKey) => (
    <div 
      key={uniqueKey}
      onClick={() => setSelectedMember(member)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 w-[300px] sm:w-[340px] md:w-auto flex-shrink-0"
    >
      {isAdmin && (
        <button 
          onClick={(e) => handleDeleteMember(member.id, e)}
          className="absolute top-3 right-3 p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-all z-10"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-zinc-700">
          {member.imageUrl ? (
            <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base truncate text-slate-900 dark:text-zinc-50">{member.name}</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">{member.study}</p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 truncate mt-1 font-medium">{member.university}</p>
        </div>
      </div>

      {member.awards && member.awards.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
          <Award className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{member.awards[0]}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 overflow-hidden">
      
      {/* สไตล์จำลองการทำ Marquee Slider (รันใน Vercel ได้ฉลุย ไม่ต้องพึ่งไลบรารีอื่น) */}
      <style>{`
        @keyframes customMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-custom-marquee {
          display: flex;
          width: max-content;
          animation: customMarquee 25s linear infinite;
        }
        .animate-custom-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Team Members</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">รายชื่อและข้อมูลผู้ติดต่อของสมาชิกภายในทีม</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl active:scale-95 transition-all shadow-md shadow-blue-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสมาชิก</span>
          </button>
        )}
      </div>

      {/* เงื่อนไขแสดงผล: มีมากกว่า 3 คน จะทำการเลื่อน Slide ไปเรื่อยๆ ไร้รอยต่อ */}
      {members.length > 3 ? (
        <div className="relative w-full overflow-hidden py-4 mask-gradient bg-slate-50/30 dark:bg-zinc-950/10 rounded-3xl border border-slate-100 dark:border-zinc-900/50 p-4">
          <div className="animate-custom-marquee space-x-6 pr-6">
            {/* โคลนข้อมูลออกมา 2 ชุดเพื่อให้ Slider วนรอบแบบ Seamless ไร้รอยสะดุด */}
            {members.map((member, index) => renderMemberCard(member, `slide-1-${member.id}-${index}`))}
            {members.map((member, index) => renderMemberCard(member, `slide-2-${member.id}-${index}`))}
          </div>
        </div>
      ) : (
        /* แสดงเป็น Grid ปกติหากสมาชิกมีจำนวนน้อยกว่าหรือเท่ากับ 3 คน */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {members.map((member) => renderMemberCard(member, `grid-${member.id}`))}
        </div>
      )}

      {/* MODAL 1: แสดงรายละเอียดสมาชิก */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl relative border border-slate-100 dark:border-zinc-800">
            <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg">
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100 dark:border-zinc-800">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center mb-3 border">
                {selectedMember.imageUrl ? (
                  <img src={selectedMember.imageUrl} alt={selectedMember.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">{selectedMember.name}</h2>
              <p className="text-xs text-slate-500 mt-1">{selectedMember.study}</p>
              <p className="text-xs font-semibold text-blue-600 mt-0.5">{selectedMember.university}</p>
            </div>

            {/* ส่วนข้อมูลการติดต่อตามความปลอดภัย */}
            <div className="space-y-3 my-5">
              {[
                { key: 'phone', label: 'เบอร์โทรศัพท์', val: selectedMember.phone, icon: Phone },
                { key: 'ig', label: 'Instagram', val: selectedMember.ig, icon: Instagram },
                { key: 'line', label: 'Line ID', val: selectedMember.line, icon: MessageSquare },
                { key: 'email', label: 'อีเมล', val: selectedMember.email, icon: Mail },
              ].map((item) => {
                const isVisible = selectedMember.visibility?.[item.key] !== false;
                if (!isAdmin && !isVisible) return null;

                return (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800/60">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-slate-400 border"><item.icon className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">{item.label}</p>
                        <p className={`text-sm ${!isVisible ? 'line-through text-slate-400 dark:text-zinc-600' : 'font-medium text-slate-800 dark:text-zinc-200'}`}>{item.val}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => toggleVisibility(item.key)} 
                        className={`p-1.5 rounded-lg border transition-colors ${isVisible ? 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800' : 'text-red-500 bg-red-50 dark:bg-red-950/20'}`}
                      >
                        {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ส่วนของรางวัล */}
            {selectedMember.awards && selectedMember.awards.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase text-slate-400 mb-2">ผลงานและรางวัลที่ได้รับ</p>
                <div className="space-y-1.5">
                  {selectedMember.awards.map((award, index) => (
                    <div key={index} className="flex items-start space-x-2 text-xs text-slate-600 dark:text-zinc-300">
                      <Award className="w-3.5 h-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                      <span>{award}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: ฟอร์มเพิ่มสมาชิกใหม่ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl relative border my-8">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-zinc-50">เพิ่มสมาชิกใหม่เข้าระบบ</h2>

            <form onSubmit={handleAddMember} className="space-y-4">
              {/* จุดอัปโหลดรูปภาพ */}
              <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-xl bg-slate-50 dark:bg-zinc-950/20">
                <label className="cursor-pointer flex flex-col items-center justify-center space-y-1">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  ) : newMember.imageUrl ? (
                    <img src={newMember.imageUrl} alt="preview" className="w-16 h-16 rounded-full object-cover border" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                      <span className="text-xs text-blue-600 font-medium">กดเพื่ออัปโหลดรูปภาพโปรไฟล์</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">ชื่อ-นามสกุล *</label>
                  <input type="text" required value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="เช่น นายภาณุวัฒน์" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">ตำแหน่ง/สาขาที่ศึกษา *</label>
                  <input type="text" required value={newMember.study} onChange={e => setNewMember({...newMember, study: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="เช่น Computer Engineer Student" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-slate-400">สถาบันการศึกษา / หน่วยงาน</label>
                  <input type="text" value={newMember.university} onChange={e => setNewMember({...newMember, university: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="เช่น Chulalongkorn University" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">เบอร์โทรศัพท์</label>
                  <input type="text" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="063-xxx-xxxx" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Instagram</label>
                  <input type="text" value={newMember.ig} onChange={e => setNewMember({...newMember, ig: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="@username" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Line ID</label>
                  <input type="text" value={newMember.line} onChange={e => setNewMember({...newMember, line: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="ใส่ไอดีไลน์" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">อีเมล</label>
                  <input type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="example@atier.org" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-slate-400">รางวัลที่ได้รับ (คั่นด้วยเครื่องหมายจุลภาค `,` ถ้ามีหลายรางวัล)</label>
                  <textarea value={newMember.awards} onChange={e => setNewMember({...newMember, awards: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 h-16 text-sm resize-none text-slate-900 dark:text-zinc-100" placeholder="เช่น เหรียญเงิน SSYS 2026, NSC Finalist" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isUploading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-semibold rounded-xl active:scale-95 transition-all mt-2 text-sm shadow-md shadow-blue-500/10"
              >
                บันทึกข้อมูลสมาชิก
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}