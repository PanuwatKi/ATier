import React, { useState } from 'react';
import { 
  Plus, 
  ExternalLink, 
  X, 
  Shield, 
  FolderGit2, 
  Calendar, 
  Users, 
  Code,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Import useAuth มาใช้

const INITIAL_PROJECTS = [
  {
    id: 1,
    title: "DNosis AI Smart Classroom Platform",
    description: "An advanced ecosystem utilizing computer vision and predictive analytics to optimize classroom layouts, track learning engagement metrics, and streamline multi-media academic delivery structures.",
    longDescription: "DNosis redefines educational spaces by transforming traditional classrooms into data-aware hubs. Built for the modern educational standard, it integrates seamlessly with cameras and audio inputs to calculate real-time concentration indexes, optimize ambient environmental lighting, and generate automated, micro-topic study summaries for students.",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
    demoUrl: "https://demo.atier.org/dnosis",
    tags: ["React", "Tailwind", "Python", "FastAPI", "OpenCV"],
    team: ["Thanapat S.", "Chayanon K.", "Nutthamon R."],
    date: "March 2026"
  },
  {
    id: 2,
    title: "NanoScribe Bio-Synthesis Analyzer",
    description: "A machine-learning dashboard processing spectroscopic data to evaluate the structural purity and crystalline efficiency of green-synthesized iron oxide nanoparticles.",
    longDescription: "Designed for modern biochemistry laboratories, NanoScribe automates the complex kinetics evaluation of eco-friendly nanoparticle production.",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9d39d6618?q=80&w=600&auto=format&fit=crop",
    demoUrl: "https://demo.atier.org/nanoscribe",
    tags: ["Data Science", "Python", "D3.js", "Tailwind CSS"],
    team: ["Kornkanok P.", "Teerapat N.", "Pitchapa W."],
    date: "January 2026"
  }
];

export default function Projects() {
  const { user } = useAuth(); // ดึงข้อมูลผู้ใช้
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ตรวจสอบสิทธิ์ Admin (ระบุอีเมล Admin ที่นี่)
  const adminEmails = ['in.klang2551@gmail.com', 'example@gmail.com'];
  const isAdmin = user && adminEmails.includes(user.email);

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLongDesc, setFormLongDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDemo, setFormDemo] = useState('');
  const [formTags, setFormTags] = useState('');

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!formTitle || !formDesc || !formImage || !formDemo) return;

    const newProject = {
      id: Date.now(),
      title: formTitle,
      description: formDesc,
      longDescription: formLongDesc || formDesc,
      imageUrl: formImage,
      demoUrl: formDemo,
      tags: formTags ? formTags.split(',').map(t => t.trim()) : ["React", "Tailwind"],
      team: ["Admin Contributor"],
      date: "Newly Added"
    };

    setProjects([newProject, ...projects]);
    setIsAddModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 py-12">
      <div className="max-w-6xl mx-auto px-4 mb-12 flex justify-between items-center">
        <div>
          <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm tracking-wider uppercase flex items-center gap-2">
            <FolderGit2 className="w-4 h-4" /> ATier Repositories
          </div>
          <h1 className="text-4xl font-extrabold mt-1">Engineering Initiatives</h1>
        </div>

        {/* แสดงปุ่ม Admin เฉพาะคนที่เป็น Admin เท่านั้น */}
        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        )}
      </div>

      {/* Projects List */}
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {projects.map((project) => (
          <div key={project.id} onClick={() => setSelectedProject(project)} className="group flex flex-col md:flex-row bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all">
             {/* รายละเอียดโปรเจกต์ */}
             <div className="flex-1">
                <h3 className="text-2xl font-bold">{project.title}</h3>
                <p className="text-slate-600 dark:text-zinc-400 mt-2">{project.description}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Admin Modal - เปิดได้เฉพาะ Admin */}
      {isAdmin && isAddModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            {/* ใส่ฟอร์ม Add Project ของคุณตรงนี้ */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Add New Project</h2>
                {/* ... ฟอร์มของคุณ ... */}
                <button onClick={() => setIsAddModalOpen(false)}>Close</button>
            </div>
         </div>
      )}
    </div>
  );
}