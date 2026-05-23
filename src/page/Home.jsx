import React, { useState } from 'react';
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

// 17 Mock Members Data
const MOCK_MEMBERS = [
  { id: 1, name: "Thanapat S.", study: "Medical Student", university: "Mahidol University", phone: "081-234-5678", ig: "@thanapat.s", line: "thanapat_line", email: "thanapat@atier.org" },
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Track visibility overrides for contact fields (Admin Mock State)
  const [visibilitySettings, setVisibilitySettings] = useState({
    phone: true,
    ig: true,
    line: true,
    email: true,
  });

  const openModal = (member) => {
    setSelectedMember(member);
    // In a real application, you'd fetch specific visibility configs here
  };

  const closeModal = () => {
    setSelectedMember(null);
  };

  const toggleVisibility = (field) => {
    setVisibilitySettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 py-12 transition-colors duration-200 relative overflow-hidden">
      
      {/* Dynamic Keyframes injected safely for the infinite marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-infinite {
          animation: marquee 35s linear infinite;
        }
      `}</style>

      {/* Admin Mode Toggle Panel */}
      <div className="max-w-7xl mx-auto px-4 mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
            ATier Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Our elite ecosystem of change-makers.</p>
        </div>
        
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
      </div>

      {/* INFINITE AUTO-SCROLLING CAROUSEL */}
      <div className="w-full relative py-6 bg-white dark:bg-zinc-900/40 border-y border-slate-200/60 dark:border-zinc-800/60 shadow-inner">
        
        {/* Soft fading gradient edge overlays */}
        <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-slate-50 to-transparent dark:from-zinc-950 z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-slate-50 to-transparent dark:from-zinc-950 z-10 pointer-events-none" />

        {/* Marquee Wrapper Container */}
        <div className="flex overflow-hidden select-none group">
          
          {/* Double up data list arrays to secure endless loop scrolling anchor point seamlessly */}
          <div className="flex shrink-0 gap-6 px-3 animate-marquee-infinite group-hover:[animation-play-state:paused]">
            {[...MOCK_MEMBERS, ...MOCK_MEMBERS].map((member, index) => (
              <div
                key={`${member.id}-${index}`}
                onClick={() => openModal(member)}
                className="w-64 shrink-0 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-500/40 dark:hover:border-blue-400/40 cursor-pointer transform hover:-translate-y-0.5 transition-all duration-200 group/card"
              >
                <div className="flex items-center gap-4">
                  {/* Circular Avatar Placeholder */}
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-400 dark:text-zinc-500 shrink-0 group-hover/card:bg-blue-50 dark:group-hover/card:bg-blue-950/40 group-hover/card:text-blue-500 dark:group-hover/card:text-blue-400 transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  
                  {/* Identity Context */}
                  <div className="overflow-hidden">
                    <h3 className="font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                      {member.study}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Contextual instruction tooltip summary */}
      <div className="text-center mt-6 text-xs text-slate-400 dark:text-zinc-500">
        💡 Hover over any card to freeze scrolling mechanism • Click to interact
      </div>


      {/* INTERACTIVE PROFILE MODAL DIALOG OVERLAY */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Blur Layer */}
          <div 
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={closeModal}
          />
          
          {/* Modal Architecture Window Box */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10 transform scale-100 opacity-100 transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header / Cover accent profile graphic */}
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar Frame Position Lift Offset */}
            <div className="px-6 pb-6 relative">
              <div className="flex justify-between items-end -mt-12 mb-4">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-zinc-900 p-1 shadow-md border border-slate-100 dark:border-zinc-800">
                  <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500">
                    <User className="w-12 h-12" />
                  </div>
                </div>

                {isAdmin && (
                  <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md mb-1 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin Controls
                  </div>
                )}
              </div>

              {/* Core Text Info Block */}
              <div className="space-y-1 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{selectedMember.name}</h2>
                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-zinc-400 font-medium">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  <span>{selectedMember.study}</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-zinc-500">{selectedMember.university}</p>
              </div>

              {/* Contact Information Dynamic Section mapping fields */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Contact Network Channels</h4>
                
                {[
                  { key: 'phone', label: 'Phone Number', val: selectedMember.phone, icon: Phone, color: 'text-emerald-500' },
                  { key: 'ig', label: 'Instagram', val: selectedMember.ig, icon: Instagram, color: 'text-pink-500' },
                  { key: 'line', label: 'Line ID', val: selectedMember.line, icon: MessageSquare, color: 'text-green-500' },
                  { key: 'email', label: 'Email Address', val: selectedMember.email, icon: Mail, color: 'text-blue-500' },
                ].map((item) => {
                  const isVisible = visibilitySettings[item.key];
                  
                  // Public view condition: If hidden by admin, render completely nothing
                  if (!isAdmin && !isVisible) return null;

                  return (
                    <div 
                      key={item.key} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        !isVisible 
                          ? 'bg-slate-50/50 dark:bg-zinc-950/40 border-slate-100 dark:border-zinc-900/60 opacity-60 line-through' 
                          : 'bg-slate-50 dark:bg-zinc-950/60 border-slate-100 dark:border-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                        <div className="overflow-hidden">
                          <p className="text-[10px] uppercase font-bold tracking-tight text-slate-400 dark:text-zinc-500">{item.label}</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 truncate mt-0.5">{item.val}</p>
                        </div>
                      </div>

                      {/* Admin visibility toggle engine switches interface controls */}
                      {isAdmin && (
                        <button
                          onClick={() => toggleVisibility(item.key)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isVisible 
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400' 
                              : 'bg-slate-200 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
                          }`}
                          title={isVisible ? "Visible to public" : "Hidden from public"}
                        >
                          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}