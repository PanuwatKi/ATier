import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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

// Premium Initial Projects Data
const INITIAL_PROJECTS = [
  {
    id: 1,
    title: "DNosis AI Smart Classroom Platform",
    description: "An advanced ecosystem utilizing computer vision and predictive analytics to optimize classroom layouts, track learning engagement metrics, and streamline multi-media academic delivery structures.",
    longDescription: "DNosis redefines educational spaces by transforming traditional classrooms into data-aware hubs. Built for the modern educational standard, it integrates seamlessly with cameras and audio inputs to calculate real-time concentration indexes, optimize ambient environmental lighting, and generate automated, micro-topic study summaries for students. The engineering phase involved rigorous edge-computing deployment and sub-50ms synchronization cycles.",
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
    longDescription: "Designed for modern biochemistry laboratories, NanoScribe automates the complex kinetics evaluation of eco-friendly nanoparticle production. By feeding UV-Vis spectrophotometry outputs into custom regression algorithms, the system estimates particle diameter distributions and surface energy configurations without requiring destructive structural validation assays. It slashes processing cycles down from days to seconds.",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9d39d6618?q=80&w=600&auto=format&fit=crop",
    demoUrl: "https://demo.atier.org/nanoscribe",
    tags: ["Data Science", "Python", "D3.js", "Tailwind CSS"],
    team: ["Kornkanok P.", "Teerapat N.", "Pitchapa W."],
    date: "January 2026"
  },
  {
    id: 3,
    title: "Aegis Network Topology Shield",
    description: "An interactive automated security suite designed to visualize high-throughput subnets, capture rogue packets, and trace synthetic ransomware vector injections.",
    longDescription: "Aegis provides multi-layer tactical monitoring over enterprise subnets. It intercepts packet metadata pipelines via robust low-overhead listeners, rendering real-time geometric graph structures that expose micro-anomalies or structural flaws within routing tables. Includes a simulated sandboxed command terminal designed specifically for CTF red-team training drills and live mitigation testing loops.",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600&auto=format&fit=crop",
    demoUrl: "https://demo.atier.org/aegis-shield",
    tags: ["Next.js", "TypeScript", "Scapy", "WebSockets"],
    team: ["Nattakit M.", "Phuriwat B."],
    date: "April 2026"
  }
];

export default function Projects() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLongDesc, setFormLongDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDemo, setFormDemo] = useState('');
  const [formTags, setFormTags] = useState('');

  // Handle Submission of New Project
  const handleAddProject = (e) => {
    e.preventDefault();
    if (!formTitle || !formDesc || !formImage || !formDemo) return;

    const newProject = {
      id: Date.now(),
      title: formTitle,
      description: formDesc,
      longDescription: formLongDesc || formDesc, // Fallback if long description empty
      imageUrl: formImage,
      demoUrl: formDemo,
      tags: formTags ? formTags.split(',').map(t => t.trim()) : ["React", "Tailwind"],
      team: ["Admin Contributor"],
      date: "Newly Added"
    };

    setProjects([newProject, ...projects]);
    
    // Reset fields
    setFormTitle('');
    setFormDesc('');
    setFormLongDesc('');
    setFormImage('');
    setFormDemo('');
    setFormTags('');
    setIsAddModalOpen(false);
  };

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

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Admin Role Toggle */}
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium border text-xs transition-all shadow-sm ${
              isAdmin 
                ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400' 
                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isAdmin ? 'Admin View' : 'Public View'}</span>
          </button>

          {/* Conditional Admin Action Button */}
          {isAdmin && (
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

      {/* Projects List Layout Grid */}
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
                  {project.tags.map((tag, idx) => (
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

                {/* Stop propagation guarantees button clicks bypass the parent modal modal-open trigger */}
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
                    {selectedProject.tags.map((tag, idx) => (
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
                    {selectedProject.team.join(', ')}
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
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Image Endpoint Unsplash URL</label>
                  <input 
                    type="url" required value={formImage} onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                </div>
                <div>
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
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10"
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