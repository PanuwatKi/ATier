import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient'; // นำเข้า supabase client
import { 
  Plus, 
  ExternalLink, 
  X, 
  Shield, 
  FolderGit2, 
  Calendar, 
  Users, 
  Code,
  Sparkles,
  Image as ImageIcon, // นำเข้าไอคอนสำหรับอัปโหลดรูป
  Loader2, // นำเข้าตัวโหลดแอนิเมชัน
  Trash2
} from 'lucide-react';

export default function Projects() {
  // ดึงข้อมูลสิทธิ์จาก AuthContext จริง
  const { role } = useAuth();
  const isAdmin = role === 'Admin' || role === 'Super Admin' || role === 'admin' || role === 'super_admin';

  // State สำหรับจัดการข้อมูลและการแสดงผล
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(true);
  const [isUploading, setIsUploading] = useState(false); // State ตรวจสอบการอัปโหลดรูป

  // ตรวจสอบฟีเจอร์แอดมิน (ต้องเป็นแอดมินจริง และอยู่ในโหมดแอดมินวิว)
  const showAdminFeatures = isAdmin && isAdminView;

  const [selectedProject, setSelectedProject] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // State สำหรับควบคุมฟอร์มกรอกข้อมูลโปรเจกต์ใหม่
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLongDesc, setFormLongDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDemo, setFormDemo] = useState('');
  const [formTags, setFormTags] = useState('');

  // ดึงข้อมูลจาก Supabase เมื่อเปิดหน้าเว็บ
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันช่วยจัดการอัปโหลดรูปภาพขึ้น Supabase Storage
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `project-covers/${fileName}`;

      // 🛠️ แก้ไขจุดนี้: เปลี่ยนชื่อถังเป็น 'project-images' ให้ตรงกับระบบของคุณเรียบร้อยแล้ว
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 🛠️ แก้ไขจุดนี้: ดึง Public URL ของรูปภาพจากถัง 'project-images'
      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      setFormImage(publicUrl);
    } catch (error) {
      alert('ไม่สามารถอัปโหลดรูปภาพได้: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ฟังก์ชันบันทึกโปรเจกต์ใหม่ลงฐานข้อมูล (เวอร์ชันแก้ไขอาการกดแล้วนิ่ง)
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (isUploading) return alert("กรุณารอให้อัปโหลดรูปภาพเสร็จสิ้นก่อนครับ");
    if (!formTitle || !formDesc || !formImage || !formDemo) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");

    // ดึงเดือนและปีปัจจุบันมาตั้งค่าให้กับโปรเจกต์อัตโนมัติ
    const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const newProject = {
      title: formTitle,
      description: formDesc,
      longDescription: formLongDesc || formDesc,
      imageUrl: formImage,
      demoUrl: formDemo,
      tags: formTags ? formTags.split(',').map(t => t.trim()).filter(Boolean) : ["React", "Tailwind"],
      team: ["Admin Contributor"],
      date: currentMonthYear
    };

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select();

      // บรรทัดดีบักตรวจสอบค่าใน Console (กด F12 ดูได้)
      console.log("Supabase Data:", data);
      console.log("Supabase Error:", error);

      if (error) throw error;

      if (data && data.length > 0) {
        // กรณีดึงข้อมูลกลับมาได้ทันที
        setProjects(prev => [data[0], ...prev]);
        setIsAddModalOpen(false);
        clearForm();
        alert("บันทึกโปรเจกต์สำเร็จเรียบร้อยครับ! 🎉");
      } else {
        // ดักจับกรณีบันทึกสำเร็จ แต่ค่าอาเรย์ส่งกลับดีเลย์จากสิทธิ์ RLS
        alert("เซฟข้อมูลลงฐานข้อมูลสำเร็จแล้ว! ระบบจะทำการปิดหน้าต่างและดึงข้อมูลใหม่ให้อัตโนมัติครับ");
        setIsAddModalOpen(false);
        clearForm();
        fetchProjects(); // บังคับรีเฟรชเรียกค่าใหม่ล่าสุดจากเซิร์ฟเวอร์
      }
    } catch (error) {
      alert('ไม่สามารถบันทึกโปรเจกต์ได้: ' + error.message);
    }
  };

  // ฟังก์ชันลบโปรเจกต์
  const handleDeleteProject = async (id, e) => {
    e.stopPropagation(); // ป้องกันไม่ให้ไปเปิดกล่อง Modal รายละเอียดโปรเจกต์
    if (!window.confirm('คุณต้องการลบโปรเจกต์นี้ใช่หรือไม่?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
      alert('ลบโปรเจกต์สำเร็จเรียบร้อยครับ!');
    } catch (error) {
      alert('ไม่สามารถลบโปรเจกต์ได้: ' + error.message);
    }
  };

  const clearForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormLongDesc('');
    setFormImage('');
    setFormDemo('');
    setFormTags('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors duration-300 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-900 py-12 px-6 sm:px-12 lg:px-24 transition-colors">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 max-w-7xl mx-auto">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3 border border-blue-100 dark:border-blue-900/30">
              <FolderGit2 size={12} />
              <span>Innovation Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
              Adusaurus Projects
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400 max-w-xl">
              Project Storage
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setIsAdminView(!isAdminView)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                  isAdminView 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <Shield size={14} />
                <span>{isAdminView ? 'Admin Mode: ON' : 'Switch to Admin View'}</span>
              </button>
            )}

            {showAdminFeatures && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/10 active:scale-95 transition-all"
              >
                <Plus size={14} />
                <span>Create Project</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 mt-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-xs text-slate-400">Loading... ถ้านานเกินไปให้ไปที่ atier-rouge.vercel.app แล้วลองอีกครั้งนะครับ...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-900 shadow-sm">
            <FolderGit2 className="mx-auto text-slate-300 dark:text-zinc-700 mb-3" size={40} />
            <p className="text-sm font-medium text-slate-400">There are currently no published project.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group relative flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-900 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-800 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Project Image */}
                <div className="relative aspect-video w-full bg-slate-100 dark:bg-zinc-950 overflow-hidden">
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Delete Button for Admin */}
                  {showAdminFeatures && (
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="absolute top-3 right-3 p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-xl shadow-md backdrop-blur-sm transition-colors"
                      title="ลบโปรเจกต์"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Card Content */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="mt-4 pt-4 border-t border-slate-50 dark:border-zinc-800/50 flex flex-wrap gap-1.5">
                    {project.tags?.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 text-[10px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags?.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-zinc-900 text-slate-400 text-[10px]">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- ADD ASSET MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleAddProject}
            className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Sparkles size={18} />
                <h2 className="font-bold text-lg text-slate-800 dark:text-zinc-100">Publish New System</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Input Form Fields */}
            <div className="space-y-4 py-4 flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Asset Title</label>
                <input
                  type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="เช่น Smart Light for Green Life"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Short Summary (Card View)</label>
                <input
                  type="text" required value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="คำอธิบายโปรเจกต์แบบสั้นๆ สำหรับแสดงบนหน้าการ์ด"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Detailed Documentation (Markdown Support)</label>
                <textarea
                  value={formLongDesc} onChange={(e) => setFormLongDesc(e.target.value)}
                  placeholder="คำอธิบายและข้อมูลเชิงลึกของโปรเจกต์ ข้อมูลจำเพาะทางวิศวกรรม ขั้นตอน และผลการทดลองวิจัย..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors h-24 resize-none"
                />
              </div>

              {/* Upload Covered Image Section */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Cover Image Source</label>
                <div className="flex gap-2">
                  <input
                    type="url" required value={formImage} onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/... หรือกดอัปโหลดรูปภาพด้านขวา"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                  <label className="cursor-pointer flex items-center justify-center p-2.5 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-xl transition-all">
                    {isUploading ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Production Demo URL</label>
                <input
                  type="url" required value={formDemo} onChange={(e) => setFormDemo(e.target.value)}
                  placeholder="https://demo.atier.org/your-project"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Technology Specifications (Comma Separated)</label>
                <input
                  type="text" value={formTags} onChange={(e) => setFormTags(e.target.value)}
                  placeholder="React, AWS, Node.js, PyTorch"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>
            </div>

            {/* Form Actions Footer */}
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white transition-all active:scale-95 shadow-md shadow-blue-500/10 flex items-center gap-1.5"
              >
                {isUploading && <Loader2 className="animate-spin" size={12} />}
                <span>Publish Asset</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- DETAILED VIEW MODAL --- */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Image Header */}
            <div className="relative aspect-video w-full bg-slate-100 dark:bg-zinc-950">
              <img src={selectedProject.imageUrl} alt={selectedProject.title} className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-50">{selectedProject.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs mt-2">
                  <div className="flex items-center gap-1"><Calendar size={13} /> <span>{selectedProject.date}</span></div>
                  <div className="flex items-center gap-1"><Users size={13} /> <span>{selectedProject.team?.join(', ')}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Code size={13} /> Specification Layer
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.tags?.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Core Architecture / Documentation</h4>
                <p className="text-sm text-slate-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {selectedProject.longDescription}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-100 dark:border-zinc-800/80 flex justify-end">
              <a
                href={selectedProject.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/10 active:scale-95 transition-all"
              >
                <span>Launch Live System</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}