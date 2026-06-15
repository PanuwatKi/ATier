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
  Loader2,
  Edit2 // นำเข้าไอคอนแก้ไขข้อมูล
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 
import { supabase } from '../supabaseClient'; 

export default function Home() {
  // เช็คสิทธิ์ว่าเป็นแอดมินหรือไม่ (รวมศูนย์ที่ useAuth)
  const { isAdmin } = useAuth();

  // ✨ State สำหรับสลับโหมดมุมมอง (เปิดให้ Admin สลับเป็น User View ได้)
  const [isAdminView, setIsAdminView] = useState(true);
  const showAdminFeatures = isAdmin && isAdminView;

  // State จัดการข้อมูลสมาชิกจาก Database
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State จัดการ Modals และการอัปโหลดรูปภาพ
  const [selectedMember, setSelectedMember] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // ✨ State ควบคุม Modal แก้ไข
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

  // ✨ State สำหรับฟอร์มแก้ไขข้อมูลสมาชิกเก่า
  const [editForm, setEditForm] = useState({
    id: null,
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

  // ฟังก์ชัน 2: จัดการอัปโหลดรูปภาพเข้าสู่ Storage Bucket (รอบนี้รองรับทั้งตอนเพิ่มและแก้ไข)
  const handleImageUpload = async (e, type = 'add') => {
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

      if (type === 'add') {
        setNewMember(prev => ({ ...prev, imageUrl: data.publicUrl }));
      } else {
        setEditForm(prev => ({ ...prev, imageUrl: data.publicUrl }));
      }
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

  // ✨ ฟังก์ชันสำหรับส่งข้อมูลอัปเดตสมาชิกเดิมไปยัง Supabase
  const handleUpdateMember = async (e) => {
    e.preventDefault();
    if (isUploading) return alert("กรุณารอให้อัปโหลดรูปภาพเสร็จสิ้นก่อนครับ");
    if (!editForm.name || !editForm.study) return alert("กรุณากรอกชื่อและสาขาวิชา");

    const itemToUpdate = {
      name: editForm.name,
      study: editForm.study,
      university: editForm.university || '--',
      imageUrl: editForm.imageUrl || null, 
      phone: editForm.phone || '--',
      ig: editForm.ig || '--',
      line: editForm.line || '--',
      email: editForm.email || '--',
      awards: editForm.awards ? editForm.awards.split(',').map(a => a.trim()).filter(Boolean) : []
    };

    try {
      const { data, error } = await supabase
        .from('members')
        .update(itemToUpdate)
        .eq('id', editForm.id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        // อัปเดต State รายชื่อหน้าร้านค้าทันที
        setMembers(prev => prev.map(m => m.id === editForm.id ? data[0] : m));
        // ถ้าผู้ใช้กำลังเปิดหน้าต่างรายละเอียดของคนนั้นอยู่ ให้ข้อมูลเปลี่ยนตามด้วย
        if (selectedMember && selectedMember.id === editForm.id) {
          setSelectedMember(data[0]);
        }
        setIsEditModalOpen(false);
      }
    } catch (error) {
      alert('ไม่สามารถแก้ไขข้อมูลสมาชิกได้: ' + error.message);
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

  // เคลื่อนย้ายปุ่มกดแก้ไขข้อมูลมาใส่ไว้ในการ์ด
  const renderMemberCard = (member, uniqueKey) => (
    <div 
      key={uniqueKey}
      onClick={() => setSelectedMember(member)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md transition-all duration-200 w-[300px] sm:w-[340px] md:w-auto flex-shrink-0"
    >
      {/* ส่วนควบคุมความปลอดภัยของแอดมิน */}
      {showAdminFeatures && (
        <div className="absolute top-3 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all z-10">
          {/* ปุ่มแก้ไขข้อมูลตัวการ์ดสั้น */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setEditForm({
                id: member.id,
                name: member.name,
                study: member.study,
                university: member.university === '--' ? '' : member.university,
                imageUrl: member.imageUrl || '',
                phone: member.phone === '--' ? '' : member.phone,
                ig: member.ig === '--' ? '' : member.ig,
                line: member.line === '--' ? '' : member.line,
                email: member.email === '--' ? '' : member.email,
                awards: member.awards ? member.awards.join(', ') : ''
              });
              setIsEditModalOpen(true);
            }}
            className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20"
            title="แก้ไขข้อมูล"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          {/* ปุ่มลบข้อมูล */}
          <button 
            onClick={(e) => handleDeleteMember(member.id, e)}
            className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
            title="ลบสมาชิก"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
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
      
      {/* สไตล์จำลองการทำ Marquee Slider */}
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

      {/* แถบหัวข้อหลักและตัวสลับโหมด View */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Adusaurus Team Members</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Names and contact information of team members</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          {/* ✨ ปุ่มสลับโหมดมุมมองสำหรับแอดมิน */}
          {isAdmin && (
            <button 
              onClick={() => setIsAdminView(!isAdminView)}
              className={`flex items-center space-x-2 px-4 py-2.5 font-semibold rounded-xl active:scale-95 transition-all border text-sm ${
                isAdminView 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{isAdminView ? 'Admin View' : 'User View'}</span>
            </button>
          )}
          {/* แสดงปุ่มเพิ่มสมาชิกเมื่ออยู่ในโหมด Admin Features เท่านั้น */}
          {showAdminFeatures && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl active:scale-95 transition-all shadow-md shadow-blue-500/10 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* เงื่อนไขแสดงผล: มีมากกว่า 3 คน จะทำการเลื่อน Slide ไปเรื่อยๆ ไร้รอยต่อ */}
      {members.length > 3 ? (
        <div className="relative w-full overflow-hidden py-4 mask-gradient bg-slate-50/30 dark:bg-zinc-950/10 rounded-3xl border border-slate-100 dark:border-zinc-900/50 p-4">
          <div className="animate-custom-marquee space-x-6 pr-6">
            {members.map((member, index) => renderMemberCard(member, `slide-1-${member.id}-${index}`))}
            {members.map((member, index) => renderMemberCard(member, `slide-2-${member.id}-${index}`))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {members.map((member) => renderMemberCard(member, `grid-${member.id}`))}
        </div>
      )}

      {/* MODAL 1: แสดงรายละเอียดสมาชิก */}
      {selectedMember && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl relative border border-slate-100 dark:border-zinc-800">
            {/* ปุ่มปิด Modal */}
            <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg">
              <X className="w-5 h-5" />
            </button>

            {/* ✨ ปุ่มแก้ไขข้อมูลด่วนจากหน้า Modal รายละเอียด */}
            {showAdminFeatures && (
              <button 
                onClick={() => {
                  setEditForm({
                    id: selectedMember.id,
                    name: selectedMember.name,
                    study: selectedMember.study,
                    university: selectedMember.university === '--' ? '' : selectedMember.university,
                    imageUrl: selectedMember.imageUrl || '',
                    phone: selectedMember.phone === '--' ? '' : selectedMember.phone,
                    ig: selectedMember.ig === '--' ? '' : selectedMember.ig,
                    line: selectedMember.line === '--' ? '' : selectedMember.line,
                    email: selectedMember.email === '--' ? '' : selectedMember.email,
                    awards: selectedMember.awards ? selectedMember.awards.join(', ') : ''
                  });
                  setIsEditModalOpen(true);
                }}
                className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-blue-500 rounded-lg"
                title="แก้ไขข้อมูลสมาชิกคนนี้"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

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
                if (!showAdminFeatures && !isVisible) return null;

                return (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800/60">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-slate-400 border"><item.icon className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">{item.label}</p>
                        <p className={`text-sm ${!isVisible ? 'line-through text-slate-400 dark:text-zinc-600' : 'font-medium text-slate-800 dark:text-zinc-200'}`}>{item.val}</p>
                      </div>
                    </div>
                    {showAdminFeatures && (
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
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-zinc-50">Add New Member</h2>

            <form onSubmit={handleAddMember} className="space-y-4">
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
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'add')} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Name-Surname *</label>
                  <input type="text" required value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="eg. Panuwat Whatever" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Role / Major *</label>
                  <input type="text" required value={newMember.study} onChange={e => setNewMember({...newMember, study: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="eg. Med Student" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Educational Institution / Organization</label>
                  <input type="text" value={newMember.university} onChange={e => setNewMember({...newMember, university: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="eg. Tokyo University" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Phone Number</label>
                  <input type="text" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="099-xxx-xxxx" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Instagram</label>
                  <input type="text" value={newMember.ig} onChange={e => setNewMember({...newMember, ig: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="@username" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Line ID</label>
                  <input type="text" value={newMember.line} onChange={e => setNewMember({...newMember, line: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="Your ID Line" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Email</label>
                  <input type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" placeholder="example@gmail.com" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Award (คั่นด้วยเครื่องหมายจุลภาค `,` ถ้ามีหลายรางวัล)</label>
                  <textarea value={newMember.awards} onChange={e => setNewMember({...newMember, awards: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 h-16 text-sm resize-none text-slate-900 dark:text-zinc-100" placeholder="eg. Gold Medal, SCiUS Forum 17" />
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

      {/* ✨ MODAL 3: ฟอร์มแก้ไขข้อมูลสมาชิกเดิม (ดึงค่ามาใส่อัตโนมัติ) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl relative border my-8">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-zinc-50">แก้ไขข้อมูลสมาชิก</h2>

            <form onSubmit={handleUpdateMember} className="space-y-4">
              {/* เปลี่ยนรูปภาพสำหรับแก้ไข */}
              <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-xl bg-slate-50 dark:bg-zinc-950/20">
                <label className="cursor-pointer flex flex-col items-center justify-center space-y-1">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  ) : editForm.imageUrl ? (
                    <img src={editForm.imageUrl} alt="preview" className="w-16 h-16 rounded-full object-cover border" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                      <span className="text-xs text-blue-600 font-medium">กดเพื่อเปลี่ยนรูปภาพโปรไฟล์</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'edit')} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">ชื่อ-นามสกุล *</label>
                  <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">ตำแหน่ง/สาขาที่ศึกษา *</label>
                  <input type="text" required value={editForm.study} onChange={e => setEditForm({...editForm, study: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-slate-400">สถาบันการศึกษา / หน่วยงาน</label>
                  <input type="text" value={editForm.university} onChange={e => setEditForm({...editForm, university: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">เบอร์โทรศัพท์</label>
                  <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Instagram</label>
                  <input type="text" value={editForm.ig} onChange={e => setEditForm({...editForm, ig: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Line ID</label>
                  <input type="text" value={editForm.line} onChange={e => setEditForm({...editForm, line: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">อีเมล</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 text-sm text-slate-900 dark:text-zinc-100" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-slate-400">รางวัลที่ได้รับ (คั่นด้วยเครื่องหมายจุลภาค `,` )</label>
                  <textarea value={editForm.awards} onChange={e => setEditForm({...editForm, awards: e.target.value})} className="w-full p-2.5 rounded-xl border bg-transparent focus:outline-none focus:border-blue-500 h-16 text-sm resize-none text-slate-900 dark:text-zinc-100" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isUploading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-semibold rounded-xl active:scale-95 transition-all mt-2 text-sm shadow-md shadow-blue-500/10"
              >
                อัปเดตข้อมูลสมาชิก
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}