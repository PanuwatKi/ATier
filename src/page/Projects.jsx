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
  Loader2 // นำเข้าตัวโหลดแอนิเมชัน
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

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLongDesc, setFormLongDesc] = useState('');
  const [formImage, setFormImage] = useState(''); // จะเก็บเป็น Public URL หลังอัปโหลดเสร็จ
  const [formDemo, setFormDemo] = useState('');
  const [formTags, setFormTags] = useState('');

  // ฟังก์ชันดึงข้อมูลโปรเจกต์จาก Supabase
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('id', { ascending: false }); // เอาโปรเจกต์ใหม่ขึ้นก่อน

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // ฟังก์ชันอัปโหลดรูปภาพไปยัง Supabase Storage
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `projects/${fileName}`;

      // อัปโหลดไปยังคลังเก็บภาพชื่อ project-images
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // ดึงลิงก์ Public URL ออกมาใช้งาน
      const { data } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      setFormImage(data.publicUrl);
    } catch (error) {
      alert('อัปโหลดรูปภาพโครงการล้มเหลว: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ฟังก์ชันบันทึกโปรเจกต์ใหม่ลงฐานข้อมูล
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

      if (error) throw error;

      if (data && data.length > 0) {
        setProjects(prev => [data[0], ...prev]);
        setIsAddModalOpen(false);
        
        // Reset fields
        setFormTitle('');
        setFormDesc('');
        setFormLongDesc('');
        setFormImage('');
        setFormDemo('');
        setFormTags('');
      }
    } catch (error) {
      alert('ไม่สามารถบันทึกโปรเจกต์ได้: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 py-12 transition-colors duration-200">
      
      {/* Top Controls Bar */}
      <div className="max-w-6xl mx-auto px-4 mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm tracking-wider uppercase">
            <FolderGit2 className="w-4 h-4" /> Adusaurus Projects
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
            Engineering Initiatives
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* ซ่อนปุ่มสลับมุมมองจาก General User: แสดงให้เห็นเฉพาะแอดมินตัวจริงเท่านั้น */}
          {isAdmin && (
            <button 
              onClick={() => setIsAdminView(!isAdminView)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium border text-xs transition-all shadow-sm ${
                isAdminView 
                  ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400' 
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAdminView ? 'Admin View' : 'User View'}</span>
            </button>
          )}

          {/* ซ่อนปุ่ม Add Project จาก General User */}
          {showAdminFeatures && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-md shadow-blue-500/10 transition-all transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          )}
        </div>
      </div>

      {/* เงื่อนไขตรวจสอบ: ถ้าหากไม่มี Projects ให้ขึ้นว่า There are currently no published project. */}
      {projects.length === 0 ? (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <p className="text-lg font-medium text-slate-400 dark:text-zinc-500">
            There are currently no published project.
          </p>
        </div>
      ) : (
        /* Projects List Layout Grid */
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="group flex flex-col md:flex-row bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-300 overflow-hidden cursor-pointer"
            >
              {/* Left Column: Thumbnail Image Window */}
              <div className="w-full md:w-80 h-52 md:h-auto overflow-hidden relative shrink-0 bg-slate-100 dark:bg-zinc-800">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-500 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Right Column: Text & Content Area */}
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-between relative">
                <div className="space-y-3">
                  {/* Tech Tags Container */}
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags && project.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 border border-slate-200/40 dark:border-zinc-700/40"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Primary Labels */}
                  <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {project.title}
                  </h3>
                  
                  <p className="text-sm text-slate-600 dark:text-zinc-400 font-normal leading-relaxed max-w-3xl line-clamp-3 md:line-clamp-2">
                    {project.description}
                  </p>
                </div>

                {/* Bottom Row Information & Core Action */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/60">
                  <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {project.date}</span>
                  </div>

                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 transition-colors group/btn shadow-sm"
                  >
                    <span>Try Demo</span>
                    <ExternalLink className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PROJECT CASE STUDY / METRICS VIEW MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProject(null)} />
          
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden z-10 transform scale-100 opacity-100 transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Top Frame Banner Img */}
            <div className="h-48 md:h-64 relative bg-slate-200 dark:bg-zinc-800 shrink-0">
              <img src={selectedProject.imageUrl} alt={selectedProject.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <button 
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-500 px-2 py-0.5 rounded-md">Project Case File</span>
                <h2 className="text-xl md:text-3xl font-extrabold tracking-tight mt-1.5">{selectedProject.title}</h2>
              </div>
            </div>

            {/* Scrollable Content Base Layout */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6">
              
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Operational Blueprint
                </h4>
                <p className="text-sm md:text-base text-slate-700 dark:text-zinc-300 leading-relaxed font-normal">
                  {selectedProject.longDescription}
                </p>
              </div>

              {/* Attributes Layout Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-900 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                    <Code className="w-3.5 h-3.5" /> Stack Specifications
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProject.tags && selectedProject.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs font-medium text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 px-2 py-0.5 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-900 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Systems Engineering Team
                  </span>
                  <p className="text-xs font-medium text-slate-700 dark:text-zinc-300 mt-1">
                    {selectedProject.team && selectedProject.team.join(', ')}
                  </p>
                </div>
              </div>

              {/* Footer Anchor Action */}
              <div className="pt-2 flex justify-end">
                <a
                  href={selectedProject.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/10 transition-colors"
                >
                  <span>Launch Live Instance</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

            </div>
          </div>
        </div>
      )}


      {/* ADMIN LEVEL: ADD REPOSITORY DIALOG FORM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden z-10 transform scale-100 opacity-100 transition-all animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 flex justify-between items-center bg-slate-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-100">
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Initialize New Project Asset</span>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Project Title</label>
                <input 
                  type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Nexus Data Matrix Suite"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Brief Description</label>
                <textarea 
                  required rows="2" value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Summarized core concept for the pipeline card display view..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Detailed Blueprint (Case Study)</label>
                <textarea 
                  rows="3" value={formLongDesc} onChange={(e) => setFormLongDesc(e.target.value)}
                  placeholder="Deep-dive architectural layout showing exactly what structural problems the project resolves..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* แก้ไขส่วนกรอก URL รูปภาพ เป็นช่องสำหรับอัปโหลดไฟล์จริง */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Project Cover Image *</label>
                  <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-xl bg-slate-50 dark:bg-zinc-950/20 border-slate-200 dark:border-zinc-800">
                    <label className="cursor-pointer flex flex-col items-center justify-center space-y-1 w-full h-full py-2">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      ) : formImage ? (
                        <div className="flex items-center space-x-2">
                          <img src={formImage} alt="preview" className="w-16 h-12 object-cover rounded-md border" />
                          <span className="text-xs text-green-600 font-medium">อัปโหลดรูปภาพเรียบร้อยแล้ว</span>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                          <span className="text-xs text-blue-600 font-medium">กดเลือกไฟล์รูปภาพเพื่ออัปโหลด</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Live Deployment Link</label>
                  <input 
                    type="url" required value={formDemo} onChange={(e) => setFormDemo(e.target.value)}
                    placeholder="https://demo.atier.org/..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Technology Specifications (Comma Separated)</label>
                <input 
                  type="text" value={formTags} onChange={(e) => setFormTags(e.target.value)}
                  placeholder="React, AWS, Node.js, PyTorch"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 disabled:bg-slate-400"
                >
                  Publish Asset
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}