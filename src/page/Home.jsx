import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Instagram, 
  MessageSquare, 
  Mail, 
  X, 
  Shield, 
  GraduationCap, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 

const MOCK_MEMBERS = [
  { id: 1, name: "Panuwat Kiatteerarat", study: "Computer Engineer Student", university: "--", phone: "063-879-0083", ig: "@pnwiinn", line: "maibok", email: "in.klang2551@gmail.com" },
  { id: 2, name: "Kornkanok P.", study: "Engineering Student", university: "Chulalongkorn University", phone: "082-345-6789", ig: "@korn_p", line: "korn_line", email: "kornkanok@atier.org" },
  { id: 3, name: "Nattakit M.", study: "Computer Science Student", university: "Kasetsart University", phone: "083-456-7890", ig: "@nat_kit", line: "nat_line", email: "nattakit@atier.org" },
  { id: 4, name: "Pimchanok T.", study: "Biomedical Student", university: "Mahidol University", phone: "084-567-8901", ig: "@pim_t", line: "pim_line", email: "pimchanok@atier.org" },
  { id: 5, name: "Chayanon K.", study: "Data Science Student", university: "KMUTT", phone: "085-678-9012", ig: "@chayanon_k", line: "chaya_line", email: "chayanon@atier.org" },
  { id: 6, name: "Sarisa O.", study: "Architecture Student", university: "Chulalongkorn University", phone: "086-789-0123", ig: "@sarisa_o", line: "sa_line", email: "sarisa@atier.org" },
  { id: 7, name: "Teerapat N.", study: "Physics Student", university: "Chiang Mai University", phone: "087-890-1234", ig: "@teera_n", line: "teera_line", email: "teerapat@atier.org" },
  { id: 8, name: "Pitchapa W.", study: "Chemistry Student", university: "Khon Kaen University", phone: "088-901-2345", ig: "@pitcha_w", line: "pitcha_line", email: "pitchapa@atier.org" },
  { id: 9, name: "Nutthamon R.", study: "Software Engineer Student", university: "KMUTL", phone: "089-012-3456", ig: "@nuttha_r", line: "nuttha_line", email: "nutthamon@atier.org" },
  { id: 10, name: "Phuriwat B.", study: "Robotics Student", university: "KMUTT", phone: "081-111-2222", ig: "@phuri_b", line: "phuri_line", email: "phuriwat@atier.org" },
  { id: 11, name: "Alisa C.", study: "Economics Student", university: "Thammasat University", phone: "082-222-3333", ig: "@alisa_c", line: "alisa_line", email: "alisa@atier.org" },
  { id: 12, name: "Ratthaphum M.", study: "AI Engineering Student", university: "CMU", phone: "083-333-4444", ig: "@rattha_m", line: "rattha_line", email: "ratthaphum@atier.org" },
  { id: 13, name: "Pannawat S.", study: "Mathematics Student", university: "Chulalongkorn University", phone: "084-444-5555", ig: "@panna_s", line: "panna_line", email: "pannawat@atier.org" },
  { id: 14, name: "Kittitouch P.", study: "Aerospace Student", university: "Kasetsart University", phone: "085-555-6666", ig: "@kit_p", line: "kit_line", email: "kittitouch@atier.org" },
  { id: 15, name: "Chutimon V.", study: "Business Analytics Student", university: "Thammasat University", phone: "086-666-7777", ig: "@chuti_v", line: "chuti_line", email: "chutimon@atier.org" },
  { id: 16, name: "Thanakorn L.", study: "Electrical Engineer Student", university: "KMUTL", phone: "087-777-8888", ig: "@thanakorn_l", line: "thana_line", email: "thanakorn@atier.org" },
  { id: 17, name: "Varitsara K.", study: "Biotechnology Student", university: "Mahidol University", phone: "088-888-9999", ig: "@vari_k", line: "vari_line", email: "varitsara@atier.org" }
];

export default function Home() {
  // --- SECURE AUTHORIZATION STATES (Single Declaration) ---
  const { user, role } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  const [visibilitySettings, setVisibilitySettings] = useState({
    phone: true, ig: true, line: true, email: true,
  });

  useEffect(() => {
    // ดักฟังค่าสิทธิ์ที่เปลี่ยนมาจาก Supabase ใน Database เท่านั้น
    const hasAdminRole = role === 'Admin' || role === 'Super Admin' || role === 'admin' || role === 'super_admin';

    if (hasAdminRole) {
      setIsAdminUser(true);
      setIsAdmin(true); // เปิดวิวมุมมองหลังบ้านให้อัตโนมัติเมื่อตรวจสอบสิทธิ์ผ่าน
    } else {
      setIsAdminUser(false);
      setIsAdmin(false);
    }
  }, [role]); // ทำงานซ้ำทุกครั้งเมื่อบทบาทในฐานข้อมูลเปลี่ยนไป

  const openModal = (member) => setSelectedMember(member);
  const closeModal = () => setSelectedMember(null);
  const toggleVisibility = (field) => {
    setVisibilitySettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 py-12 transition-colors duration-200 relative overflow-hidden">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee-infinite { animation: marquee 35s linear infinite; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
            ATier Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Our elite ecosystem of change-makers.</p>
        </div>
        
        {isAdminUser && (
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium border text-sm transition-all shadow-sm ${
              isAdmin 
                ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400' 
                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{isAdmin ? 'Admin View: Active' : 'Public View'}</span>
          </button>
        )}
      </div>

      <div className="w-full relative py-6 bg-white dark:bg-zinc-900/40 border-y border-slate-200/60 dark:border-zinc-800/60 shadow-inner">
        <div className="flex overflow-hidden select-none group">
          <div className="flex shrink-0 gap-6 px-3 animate-marquee-infinite group-hover:[animation-play-state:paused]">
            {[...MOCK_MEMBERS, ...MOCK_MEMBERS].map((member, index) => (
              <div key={`${member.id}-${index}`} onClick={() => openModal(member)} className="w-64 shrink-0 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-500/40 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center"><User className="w-6 h-6" /></div>
                  <div className="overflow-hidden">
                    <h3 className="font-semibold truncate">{member.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{member.study}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-6 relative z-10">
            <h2 className="text-2xl font-bold mb-4">{selectedMember.name}</h2>
            <div className="space-y-3">
              {[
                { key: 'phone', label: 'Phone', val: selectedMember.phone, icon: Phone },
                { key: 'ig', label: 'Instagram', val: selectedMember.ig, icon: Instagram },
                { key: 'line', label: 'Line ID', val: selectedMember.line, icon: MessageSquare },
                { key: 'email', label: 'Email', val: selectedMember.email, icon: Mail },
              ].map((item) => {
                const isVisible = visibilitySettings[item.key];
                if (!isAdmin && !isVisible) return null;
                return (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">{item.label}</p>
                      <p className="text-sm font-medium">{item.val}</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => toggleVisibility(item.key)} className="p-1.5 rounded-lg border">
                        {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}