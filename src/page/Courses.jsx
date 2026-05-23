import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Play, 
  FileText, 
  Download, 
  CheckCircle, 
  ChevronRight, 
  ChevronDown, 
  ArrowLeft, 
  Bookmark, 
  Shield, 
  Plus, 
  Clock, 
  BookOpen,
  Award,
  Video
} from 'lucide-react';

// Premium Educational Course Mock Data
const INITIAL_COURSES = [
  {
    id: "toi-mastery",
    title: "POSN Computer Camp 2: Advanced Algorithm Design",
    description: "Master dynamic programming, complex bitmask layouts, and shortest path graph algorithms optimized for competitive programming execution.",
    imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=600&auto=format&fit=crop",
    category: "Informatics",
    instructor: "Ajarn ATier",
    lectures: [
      { id: "l1", title: "Tape 1: Bitmask Dynamic Programming Mechanics", duration: "1h 45m", videoId: "dQw4w9WgXcQ", materials: ["Bitmask_DP_Handout.pdf", "Problem_Set_1.pdf"] },
      { id: "l2", title: "Tape 2: Dijkstra vs. Bellman-Ford State Spaces", duration: "2h 10m", videoId: "dQw4w9WgXcQ", materials: ["Graph_Theory_Advanced.pdf"] },
      { id: "l3", title: "Tape 3: Segment Trees and Range Query Optimization", duration: "1h 55m", videoId: "dQw4w9WgXcQ", materials: ["Segment_Tree_Template.cpp", "Queries_HW.pdf"] }
    ]
  },
  {
    id: "nano-synthesis",
    title: "Green Synthesis Kinetics & Nanoparticle Engineering",
    description: "An depth technical layout investigating plant extract reduction pathways to formulate high-stability iron oxide nanoparticles.",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9d39d6618?q=80&w=600&auto=format&fit=crop",
    category: "Science Research",
    instructor: "Dr. Tech Team",
    lectures: [
      { id: "l4", title: "Tape 1: Phytochemical Extraction Protocols", duration: "1h 15m", videoId: "dQw4w9WgXcQ", materials: ["Tecoma_Stans_Extraction.pdf"] },
      { id: "l5", title: "Tape 2: Evaluating Crystalline Stability Matrices", duration: "1h 50m", videoId: "dQw4w9WgXcQ", materials: ["Spectroscopic_Data_Sheet.xlsx"] }
    ]
  },
  {
    id: "cyber-defense",
    title: "Network Archetypes & Threat Vector Mitigation",
    description: "Deep dive structural exploration tracking malicious packet routing, network subnets, and ransomware signature recognition.",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600&auto=format&fit=crop",
    category: "Cybersecurity",
    instructor: "Aegis Lab Staff",
    lectures: [
      { id: "l6", title: "Tape 1: Advanced Packet Analysis with Wireshark", duration: "2h 05m", videoId: "dQw4w9WgXcQ", materials: ["Wireshark_Filters_CheatSheet.pdf"] },
      { id: "l7", title: "Tape 2: Building Scapy Packet Listeners", duration: "1h 40m", videoId: "dQw4w9WgXcQ", materials: ["Scapy_Scripts_Sandbox.zip"] }
    ]
  }
];

export default function Courses() {
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [expandedLecture, setExpandedLecture] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Smart Learning State: Completed tracking maps & simulated video play checkpoints
  const [completedLectures, setCompletedLectures] = useState({});
  const [checkpoints, setCheckpoints] = useState({});
  const [mockTime, setMockTime] = useState("00:00:00");
  const [activeCheckpointMsg, setActiveCheckpointMsg] = useState("");

  // Admin Mock Inputs
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');

  // Reset core view states upon changing modes
  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setCurrentLecture(course.lectures[0]);
    setExpandedLecture(course.lectures[0]?.id || null);
    setActiveCheckpointMsg("");
    
    // Check if a checkpoint already exists for this video frame entry
    if (checkpoints[course.lectures[0]?.id]) {
      setActiveCheckpointMsg(`Resumed from your saved checkpoint at ${checkpoints[course.lectures[0].id]}`);
    }
  };

  const handleSelectLecture = (lecture) => {
    setCurrentLecture(lecture);
    setActiveCheckpointMsg("");
    if (checkpoints[lecture.id]) {
      setActiveCheckpointMsg(`Resumed from your saved checkpoint at ${checkpoints[lecture.id]}`);
    } else {
      // Simulate randomly changing timeline starting marker context
      setMockTime(`00:${Math.floor(Math.random() * 40) + 10}:15`);
    }
  };

  // Toggle dynamic structural checkpoints
  const saveCurrentCheckpoint = () => {
    if (!currentLecture) return;
    const generatedTimestamp = mockTime === "00:00:00" ? "00:34:12" : mockTime;
    setCheckpoints(prev => ({
      ...prev,
      [currentLecture.id]: generatedTimestamp
    }));
    setActiveCheckpointMsg(`Progress checkpoint saved securely at ${generatedTimestamp}!`);
  };

  // Toggle dynamic progress computations
  const toggleLectureCompletion = (lectureId, e) => {
    e.stopPropagation(); // Shield from triggering lecture switch loops
    setCompletedLectures(prev => ({
      ...prev,
      [lectureId]: !prev[lectureId]
    }));
  };

  // Calculate dynamic complete tracking metrics
  const getCourseProgress = (course) => {
    if (!course?.lectures?.length) return 0;
    const finishedCount = course.lectures.filter(l => completedLectures[l.id]).length;
    return Math.round((finishedCount / course.lectures.length) * 100);
  };

  // Admin Data Pipeline Insertion Controls
  const handleAdminAddLecture = (e) => {
    e.preventDefault();
    if (!newLectureTitle || !selectedCourse) return;

    const newLecture = {
      id: `l-added-${Date.now()}`,
      title: `Tape ${selectedCourse.lectures.length + 1}: ${newLectureTitle}`,
      duration: "1h 30m",
      videoId: "dQw4w9WgXcQ",
      materials: newMaterialName ? [newMaterialName] : ["Reference_Guide_Asset.pdf"]
    };

    const updatedCourses = courses.map(c => {
      if (c.id === selectedCourse.id) {
        return { ...c, lectures: [...c.lectures, newLecture] };
      }
      return c;
    });

    setCourses(updatedCourses);
    setSelectedCourse(updatedCourses.find(c => c.id === selectedCourse.id));
    setNewLectureTitle('');
    setNewMaterialName('');
  };

  // Filtering System Operation Rule
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors duration-200">
      
      {/* Top Engineering Controls Segment Bar */}
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-zinc-900/60">
        <div>
          <span className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1.5">
            <Award className="w-4 h-4" /> ATier Learning Management Suite
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Premium Core Repository</h1>
        </div>

        <button 
          onClick={() => setIsAdmin(!isAdmin)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium border text-xs transition-all ${
            isAdmin 
              ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400' 
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{isAdmin ? 'Admin Portal Active' : 'Student Mode View'}</span>
        </button>
      </div>

      {/* VIEW PANEL ROUTING TOGGLE (GRID VIEW vs PLAYER INTERFACE) */}
      {!selectedCourse ? (
        /* GRID VIEW ARCHITECTURE */
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
          
          {/* Real-time search engine query matrix banner */}
          <div className="max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-2 flex items-center gap-2 shadow-sm focus-within:border-blue-500 transition-colors">
            <Search className="w-5 h-5 text-slate-400 ml-2" />
            <input 
              type="text"
              placeholder="Search specified course tracks, concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 dark:text-zinc-200 focus:outline-none pr-2"
            />
          </div>

          {/* Courses Dynamic Layout Card Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const progressPercent = getCourseProgress(course);
              return (
                <div
                  key={course.id}
                  onClick={() => handleSelectCourse(course)}
                  className="group bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-zinc-800 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Course Top Media Window */}
                    <div className="h-44 overflow-hidden relative bg-slate-100 dark:bg-zinc-800">
                      <img 
                        src={course.imageUrl} 
                        alt={course.title} 
                        className="w-full h-full object-cover transform group-hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                        {course.category}
                      </div>
                    </div>

                    {/* Course Identity Metrics */}
                    <div className="p-5 space-y-2">
                      <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">{course.instructor}</p>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal leading-relaxed line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  {/* Operational Tracker Meter bar footer frame */}
                  <div className="px-5 pb-5 pt-2 border-t border-slate-50 dark:border-zinc-800/60 space-y-2 bg-slate-50/50 dark:bg-zinc-900/30">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> {course.lectures.length} Lectures
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{progressPercent}% Done</span>
                    </div>
                    {/* Visual Loading Progression Metrics Indicator */}
                    <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-zinc-500 text-sm">
              No course catalogs matching your search parameters were discovered.
            </div>
          )}

        </div>
      ) : (
        /* PREMIUM COURSE LECTURE PLAYER INTERFACE CONTAINER */
        <div className="max-w-7xl mx-auto px-4 py-8">
          
          {/* Breadcrumbs return route navigation */}
          <button 
            onClick={() => setSelectedCourse(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white mb-6 bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>

          {/* Player Architecture Grid Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT AREA: MAIN VIDEO STREAM PLAYER WRAPPER */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-zinc-800 shadow-xl group">
                
                {/* Simulated YouTube Unlisted Embedded Video Player Interface Box */}
                <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-4 bg-zinc-900/90 text-zinc-300">
                  {/* Top Overlay HUD */}
                  <div className="flex justify-between items-center bg-black/40 backdrop-blur-md p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-400 animate-pulse" />
                      <span className="text-xs font-semibold tracking-tight text-white truncate max-w-md">
                        {currentLecture?.title || "Initializing System Feed..."}
                      </span>
                    </div>
                    <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">Unlisted Stream</span>
                  </div>

                  {/* Core Visual Anchor Play Signal Center Indicator */}
                  <div className="self-center flex flex-col items-center gap-2 cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                      <Play className="w-8 h-8 fill-current ml-1" />
                    </div>
                    <p className="text-xs font-medium text-zinc-400 mt-2">Click to resume unlisted network payload frame</p>
                  </div>

                  {/* Base Playhead Timeline Interface Tool HUD Controls */}
                  <div className="bg-black/60 backdrop-blur-sm p-3 rounded-xl space-y-2">
                    <div className="w-full bg-zinc-700 h-1 rounded-full overflow-hidden relative cursor-pointer">
                      <div className="absolute top-0 left-0 bg-blue-500 h-full w-1/3" />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-zinc-400">
                      <div className="flex items-center gap-4">
                        <span>▶ Play</span>
                        <span>🔊 80%</span>
                        <span className="font-mono text-zinc-300">{mockTime === "00:00:00" ? "00:12:45" : mockTime} / {currentLecture?.duration}</span>
                      </div>
                      <span className="text-xs font-mono tracking-tighter text-blue-400">1080p HD</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Dynamic Notification Checkpoint Prompt Box */}
              {activeCheckpointMsg && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium">
                  {activeCheckpointMsg}
                </div>
              )}

              {/* Title Meta Data Actions Footer Block */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{currentLecture?.title}</h2>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3.5 h-3.5" /> Allocated Run-Duration Time: {currentLecture?.duration}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={saveCurrentCheckpoint}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                    <span>Save Checkpoint</span>
                  </button>

                  <button
                    onClick={(e) => toggleLectureCompletion(currentLecture.id, e)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                      completedLectures[currentLecture?.id]
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{completedLectures[currentLecture?.id] ? 'Completed' : 'Mark as Finished'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT AREA: SIDEBAR ACCORDION PLAYLIST & RESOURCES LECTURES */}
            <div className="space-y-6">
              
              {/* Sidebar Course Summary Checklist */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Track Progress</span>
                  <span className="text-sm font-bold text-indigo-500">{getCourseProgress(selectedCourse)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${getCourseProgress(selectedCourse)}%` }}
                  />
                </div>
              </div>

              {/* Accordion Lecture Loop Wrapper */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/80">
                <div className="p-4 bg-slate-50 dark:bg-zinc-900/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Recorded Course Tapes</h3>
                </div>

                {selectedCourse.lectures.map((lecture) => {
                  const isExpanded = expandedLecture === lecture.id;
                  const isActive = currentLecture?.id === lecture.id;
                  const isDone = completedLectures[lecture.id];

                  return (
                    <div key={lecture.id} className={`transition-colors ${isActive ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''}`}>
                      {/* Accordion Top Trigger Row */}
                      <div 
                        onClick={() => {
                          handleSelectLecture(lecture);
                          setExpandedLecture(isExpanded ? null : lecture.id);
                        }}
                        className="p-4 flex items-center justify-between cursor-pointer group/item"
                      >
                        <div className="flex items-center gap-3 overflow-hidden pr-2">
                          <button 
                            onClick={(e) => toggleLectureCompletion(lecture.id, e)}
                            className={`shrink-0 rounded-full transition-colors ${isDone ? 'text-emerald-500' : 'text-slate-300 dark:text-zinc-700 hover:text-slate-400'}`}
                          >
                            <CheckCircle className="w-5 h-5 fill-current bg-white dark:bg-zinc-900" />
                          </button>
                          
                          <div className="overflow-hidden">
                            <p className={`text-sm font-semibold truncate transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300 group-hover/item:text-slate-900 dark:group-hover/item:text-white'}`}>
                              {lecture.title}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{lecture.duration}</p>
                          </div>
                        </div>

                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </div>

                      {/* Accordion Inner Materials Content Dropdown drawer block */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-dashed border-slate-100 dark:border-zinc-800/40 space-y-2 bg-slate-50/50 dark:bg-zinc-950/20">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-indigo-400" /> Attached Course Materials
                          </p>
                          
                          <div className="space-y-1.5">
                            {lecture.materials.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl text-xs">
                                <span className="font-medium text-slate-600 dark:text-zinc-400 truncate max-w-[180px]">{file}</span>
                                <button className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-blue-500 dark:text-blue-400 transition-colors" title="Download Material">
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* CONDITIONAL ADMIN PORTAL CONTROLS SUB-CONSOLE */}
              {isAdmin && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-500/10">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Lecture Registry Manager</h4>
                  </div>

                  <form onSubmit={handleAdminAddLecture} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">New Tape Title</label>
                      <input 
                        type="text" required value={newLectureTitle} onChange={(e) => setNewLectureTitle(e.target.value)}
                        placeholder="e.g., Bitwise Operations Drill Matrix"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">Attach Study File (Optional)</label>
                      <input 
                        type="text" value={newMaterialName} onChange={(e) => setNewMaterialName(e.target.value)}
                        placeholder="e.g., Bitwise_Cheat_Sheet.pdf"
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Lecture & Files
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}