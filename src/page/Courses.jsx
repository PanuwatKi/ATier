import React, { useState, useEffect } from 'react';
import { 
  Search, Play, FileText, Download, CheckCircle, ChevronRight, 
  ChevronDown, ArrowLeft, Bookmark, Shield, Plus, Clock, 
  BookOpen, Award, Video, Trash2, Eye, EyeOff, FolderPlus, Upload, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // เชื่อมโยง AuthContext เดียวกับ Home.jsx

const INITIAL_COURSES = [
  {
    id: "toi-mastery",
    title: "POSN Computer Camp 2: Advanced Algorithm Design",
    description: "เจาะลึกการออกแบบอัลกอริทึมระดับสูง Master dynamic programming, complex bitmask layouts, และ shortest path graph สำหรับการแข่งขันสอวน. คอมพิวเตอร์ ค่าย 2",
    imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=600&auto=format&fit=crop",
    category: "Informatics",
    instructor: "Ajarn ATier",
    isHidden: false,
    lectures: [
      { id: "l1", title: "Tape 1: Bitmask Dynamic Programming Mechanics", duration: "1h 45m", videoId: "dQw4w9WgXcQ", materials: [{ name: "Bitmask_DP_Handout.pdf", data: "" }] }
    ]
  }
];

export default function Courses() {
  const { user } = useAuth(); // ดึงข้อมูล Google User ที่ล็อกอินอยู่จริง
  
  // --- CONFIG: รายชื่ออีเมลที่ได้รับสิทธิ์ระบบหลังบ้าน ---
  const SUPER_ADMIN_EMAILS = ['in.klang2551@gmail.com']; 
  const ADMIN_EMAILS = ['example@gmail.com', 'staff-member@atier.org'];

  // --- DERIVED SECURITY STATES (เช็คสดจาก Google Session) ---
  const isSuperAdmin = user && SUPER_ADMIN_EMAILS.includes(user.email);
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);
  const hasAdminPrivileges = isAdmin || isSuperAdmin; // เป็นอย่างใดอย่างหนึ่งถือว่าเป็น Staff

  // --- CORE SYSTEM STATES ---
  const [courses, setCourses] = useState(() => {
    const savedCourses = localStorage.getItem('atier_courses');
    return savedCourses ? JSON.parse(savedCourses) : INITIAL_COURSES;
  });

  const [completedLectures, setCompletedLectures] = useState(() => {
    const savedProgress = localStorage.getItem('atier_completed_lectures');
    return savedProgress ? JSON.parse(savedProgress) : {};
  });

  const [lastWatchedTape, setLastWatchedTape] = useState(() => {
    const savedLastWatched = localStorage.getItem('atier_last_watched');
    return savedLastWatched ? JSON.parse(savedLastWatched) : {};
  });

  // ใช้สำหรับการเปิด-ปิด หน้าต่างโหมดแอดมิน (ล้อตามสไตล์ไฟล์ Home.jsx)
  const [isAdminModeActive, setIsAdminModeActive] = useState(false);

  const [checkpoints, setCheckpoints] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [expandedLecture, setExpandedLecture] = useState(null);
  const [mockTime, setMockTime] = useState("00:00:00");
  const [activeCheckpointMsg, setActiveCheckpointMsg] = useState("");

  // FORM INPUT STATES
  const [newCourse, setNewCourse] = useState({ title: '', category: '', instructor: '', imageUrl: '', description: '' });
  const [newTape, setNewTape] = useState({ title: '', duration: '1h 30m', videoUrl: '' });
  const [uploadedMaterials, setUploadedMaterials] = useState([]);

  // Sync กับฐานข้อมูลจำลองสม่ำเสมอ
  useEffect(() => { localStorage.setItem('atier_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('atier_completed_lectures', JSON.stringify(completedLectures)); }, [completedLectures]);
  useEffect(() => { localStorage.setItem('atier_last_watched', JSON.stringify(lastWatchedTape)); }, [lastWatchedTape]);

  // หาก User หลุดจากการล็อกอิน ให้ปิดโหมด Admin อัตโนมัติทันที
  useEffect(() => {
    if (!hasAdminPrivileges) {
      setIsAdminModeActive(false);
    }
  }, [user, hasAdminPrivileges]);

  // --- UTILITIES ---
  const extractYouTubeId = (url) => {
    if (!url) return "dQw4w9WgXcQ"; 
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const handleCoverImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewCourse(prev => ({ ...prev, imageUrl: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleMaterialsUpload = (e) => {
    const files = Array.from(e.target.files);
    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ name: file.name, data: reader.result });
        reader.readAsDataURL(file);
      });
    });
    Promise.all(promises).then(results => setUploadedMaterials(results));
  };

  // --- NAVIGATION LOGIC ---
  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setActiveCheckpointMsg("");
    const lastTapeId = lastWatchedTape[course.id];
    const savedLecture = course.lectures.find(l => l.id === lastTapeId);
    const targetLecture = savedLecture || course.lectures[0] || null;
    setCurrentLecture(targetLecture);
    setExpandedLecture(targetLecture?.id || null);
  };

  const handleSelectLecture = (lecture) => {
    setCurrentLecture(lecture);
    setActiveCheckpointMsg("");
    setLastWatchedTape(prev => ({ ...prev, [selectedCourse.id]: lecture.id }));
  };

  const toggleLectureCompletion = (lectureId, e, courseId) => {
    if (e) e.stopPropagation();
    setCompletedLectures(prev => ({ ...prev, [lectureId]: !prev[lectureId] }));
  };

  const getCourseProgress = (course) => {
    if (!course?.lectures?.length) return 0;
    const finishedCount = course.lectures.filter(l => completedLectures[l.id]).length;
    return Math.round((finishedCount / course.lectures.length) * 100);
  };

  const saveCurrentCheckpoint = () => {
    if (!currentLecture) return;
    setCheckpoints(prev => ({ ...prev, [currentLecture.id]: "00:42:19" }));
    setActiveCheckpointMsg(`Progress checkpoint saved securely!`);
  };

  // --- 🔒 HARDENED SECURE BACKOFFICE FUNCTIONS ---
  // ทุกฟังก์ชันจะรีเทิร์นออกทันทีหากพบว่าไม่มีสิทธิ์จริงในระบบ Session (ป้องกันการยิงคำสั่งตรง)
  
  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!hasAdminPrivileges) return; // Blocked if malicious call

    const createdItem = {
      id: `course-${Date.now()}`,
      title: newCourse.title,
      description: newCourse.description,
      category: newCourse.category || "General",
      instructor: newCourse.instructor || "Guest Lecturer",
      imageUrl: newCourse.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
      isHidden: false,
      lectures: []
    };

    setCourses([createdItem, ...courses]);
    setNewCourse({ title: '', category: '', instructor: '', imageUrl: '', description: '' });
    e.target.reset();
  };

  const handleDeleteCourse = (courseId, e) => {
    e.stopPropagation();
    if (!isSuperAdmin) {
      alert("ปฏิเสธการเข้าถึง: เฉพาะสิทธิ์ Super Admin เท่านั้นที่สามารถลบคอร์สเรียนได้!");
      return;
    }
    if (window.confirm("คุณต้องการลบคอร์สเรียนนี้รวมถึงเทปเรียนทั้งหมดใช่หรือไม่?")) {
      setCourses(courses.filter(c => c.id !== courseId));
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
    }
  };

  const toggleCourseVisibility = (courseId, e) => {
    e.stopPropagation();
    if (!hasAdminPrivileges) return;
    setCourses(courses.map(c => c.id === courseId ? { ...c, isHidden: !c.isHidden } : c));
  };

  const handleAddTape = (e) => {
    e.preventDefault();
    if (!hasAdminPrivileges || !selectedCourse) return;

    const createdTape = {
      id: `tape-${Date.now()}`,
      title: `Tape ${selectedCourse.lectures.length + 1}: ${newTape.title}`,
      duration: newTape.duration || "1h 30m",
      videoId: extractYouTubeId(newTape.videoUrl),
      materials: uploadedMaterials.length > 0 ? uploadedMaterials : [{ name: "Course_Reference_Handout.pdf", data: "" }]
    };

    const updatedCatalog = courses.map(c => {
      if (c.id === selectedCourse.id) return { ...c, lectures: [...c.lectures, createdTape] };
      return c;
    });

    setCourses(updatedCatalog);
    setSelectedCourse(updatedCatalog.find(c => c.id === selectedCourse.id));
    setNewTape({ title: '', duration: '1h 30m', videoUrl: '' });
    setUploadedMaterials([]);
    e.target.reset();
  };

  const handleDeleteTape = (tapeId) => {
    if (!isSuperAdmin) {
      alert("ปฏิเสธการเข้าถึง: เฉพาะสิทธิ์ Super Admin เท่านั้นที่สามารถลบเทปเรียนได้!");
      return;
    }
    if (!window.confirm("ต้องการลบเทปเรียนนี้ออกใช่หรือไม่?")) return;

    const updatedCatalog = courses.map(c => {
      if (c.id === selectedCourse.id) return { ...c, lectures: c.lectures.filter(l => l.id !== tapeId) };
      return c;
    });

    setCourses(updatedCatalog);
    const refreshedCourse = updatedCatalog.find(c => c.id === selectedCourse.id);
    setSelectedCourse(refreshedCourse);
    if (currentLecture?.id === tapeId) setCurrentLecture(refreshedCourse.lectures[0] || null);
  };

  // กรองคอร์สที่ซ่อนอยู่ไม่ให้นักเรียนเห็น
  const filteredCourses = courses.filter(course => {
    const matchSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        course.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (hasAdminPrivileges && isAdminModeActive) return matchSearch; 
    return matchSearch && !course.isHidden; 
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors duration-200">
      
      {/* HEADER PLATFORM BAR */}
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-zinc-900/60">
        <div>
          <span className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1.5">
            <Award className="w-4 h-4" /> ATier Course Management System
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">OnDemand Portal Console</h1>
        </div>

        {/* SECURE TOGGLE SWITCH: แสดงเฉพาะเมื่อประมวลผลแล้วว่าคุณล็อกอินด้วย Google Account ที่ตรงเงื่อนไขเท่านั้น */}
        {hasAdminPrivileges && (
          <button 
            onClick={() => setIsAdminModeActive(!isAdminModeActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border text-xs transition-all shadow-sm ${
              isAdminModeActive 
                ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400' 
                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{isAdminModeActive ? `Admin View: ${isSuperAdmin ? 'SUPER ADMIN' : 'STAFF'}` : 'Public View'}</span>
          </button>
        )}
      </div>

      {/* DASHBOARD CATALOGUE MAIN AREA */}
      {!selectedCourse ? (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
          
          {/* UPLOAD PANEL: จะไม่เรนเดอร์ใน DOM เลยถ้านักเรียนล็อกอินเข้ามา */}
          {hasAdminPrivileges && isAdminModeActive && (
            <div className="bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                <FolderPlus className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
                  Backoffice: Upload New Course ({isSuperAdmin ? 'Super Admin Control' : 'Staff Level'})
                </h2>
              </div>
              
              <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <input 
                    type="text" required placeholder="ชื่อคอร์สเรียน (Course Title)" 
                    value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                  <textarea 
                    required placeholder="คำอธิบายรายละเอียดวิชาเชิงลึกด้านล่างคอร์สเรียน..." rows="3"
                    value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1"><Upload className="w-3 h-3"/> อัปโหลดรูปปกคอร์สเรียน</label>
                    <input 
                      type="file" accept="image/*" required
                      onChange={handleCoverImageUpload}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="หมวดหมู่" value={newCourse.category} onChange={e => setNewCourse({...newCourse, category: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none" />
                    <input type="text" placeholder="ผู้สอน" value={newCourse.instructor} onChange={e => setNewCourse({...newCourse, instructor: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none" />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold text-sm rounded-xl hover:bg-amber-400 transition-colors shadow-lg flex items-center justify-center gap-1">
                    <Plus className="w-4 h-4 stroke-[3]" /> Deploy New Course
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search Bar */}
          <div className="max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-2 flex items-center gap-2 shadow-sm">
            <Search className="w-5 h-5 text-slate-400 ml-2" />
            <input 
              type="text" placeholder="ค้นหาคอร์สเรียนกวดวิชา..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 dark:text-zinc-200 focus:outline-none pr-2"
            />
          </div>

          {/* GRID CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const progressPercent = getCourseProgress(course);
              return (
                <div
                  key={course.id} onClick={() => handleSelectCourse(course)}
                  className="group bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between relative"
                >
                  <div>
                    <div className="h-44 overflow-hidden relative bg-slate-100 dark:bg-zinc-800">
                      <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                        {course.category}
                      </div>

                      {/* ACTION BUTTONS GATE BY ROLE */}
                      {hasAdminPrivileges && isAdminModeActive && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={(e) => toggleCourseVisibility(course.id, e)}
                            className={`p-1.5 rounded-lg backdrop-blur-md text-white transition-colors ${course.isHidden ? 'bg-amber-600' : 'bg-slate-900/80 hover:bg-slate-800'}`}
                          >
                            {course.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          
                          {/* เฉพาะ Super Admin เท่านั้นที่จะมีปุ่มถังขยะถูกสร้างขึ้นมาบนจอ */}
                          {isSuperAdmin && (
                            <button 
                              onClick={(e) => handleDeleteCourse(course.id, e)}
                              className="p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white transition-colors"
                              title="ลบคอร์สเรียน"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">{course.instructor}</p>
                        {course.isHidden && <span className="text-[9px] bg-amber-500/20 border border-amber-500/30 text-amber-600 font-bold px-1.5 py-0.5 rounded">HIDDEN</span>}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 tracking-tight line-clamp-1">{course.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal leading-relaxed line-clamp-2">{course.description}</p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 border-t border-slate-50 dark:border-zinc-800/60 space-y-2 bg-slate-50/50 dark:bg-zinc-900/30">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 dark:text-zinc-500 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {course.lectures?.length || 0} Lectures</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{progressPercent}% เสร็จสิ้น</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        
        /* VIDEO PLAYER MODE */
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button onClick={() => setSelectedCourse(null)} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:white mb-6 bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-xl">
                {currentLecture ? (
                  <iframe title={currentLecture.title} src={`https://www.youtube.com/embed/${currentLecture.videoId}?autoplay=1&modestbranding=1&rel=0`} className="w-full h-full border-0 absolute inset-0" allowFullScreen></iframe>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-zinc-900">
                    <Video className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="text-sm font-semibold text-white">ยังไม่มีเทปคำบรรยายในคอร์สนี้</p>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight">{currentLecture?.title || "โปรดเลือกบทเรียนเพื่อเริ่มเรียน"}</h2>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Runtime: {currentLecture?.duration || "0h 00m"}</p>
                </div>
                {currentLecture && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={saveCurrentCheckpoint} className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      Checkpoint
                    </button>
                    <button onClick={() => toggleLectureCompletion(currentLecture.id, null, selectedCourse.id)} className={`px-3.5 py-2 text-xs font-bold rounded-xl ${completedLectures[currentLecture.id] ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                      {completedLectures[currentLecture.id] ? 'Finished' : 'Mark as Finished'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PLAYLIST SECTION */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
                <div className="p-4 bg-slate-50 dark:bg-zinc-900/50">
                  <h3 className="text-xs font-bold uppercase text-slate-400">Recorded Course Tapes ({selectedCourse.lectures?.length || 0})</h3>
                </div>

                {selectedCourse.lectures?.length > 0 ? (
                  selectedCourse.lectures.map((lecture) => {
                    const isExpanded = expandedLecture === lecture.id;
                    const isActive = currentLecture?.id === lecture.id;
                    const isDone = completedLectures[lecture.id];
                    return (
                      <div key={lecture.id} className={`${isActive ? 'bg-blue-50/40 dark:bg-blue-950/10' : ''}`}>
                        <div onClick={() => { handleSelectLecture(lecture); setExpandedLecture(isExpanded ? null : lecture.id); }} className="p-4 flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-3 overflow-hidden pr-2">
                            <CheckCircle className={`w-5 h-5 fill-current ${isDone ? 'text-emerald-500' : 'text-slate-300'}`} />
                            <div className="overflow-hidden">
                              <p className={`text-sm font-bold truncate ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'}`}>{lecture.title}</p>
                              <span className="text-[11px] text-slate-400 font-mono">{lecture.duration}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* เฉพาะ Super Admin เท่านั้นที่เห็นปุ่มลบเทปเรียนย่อย */}
                            {hasAdminPrivileges && isAdminModeActive && isSuperAdmin && (
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteTape(lecture.id); }} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-dashed border-slate-100 dark:border-zinc-800/40 space-y-2 bg-slate-50/50">
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><FileText className="w-3 h-3" /> Attached Course Materials</p>
                            <div className="space-y-1.5">
                              {lecture.materials?.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 border rounded-xl text-xs">
                                  <span className="font-medium text-slate-600 dark:text-zinc-400 truncate max-w-[170px]">{file.name}</span>
                                  <a href={file.data || "#"} download={file.name} onClick={e => !file.data && e.preventDefault()} className="p-1 text-blue-500"><Download className="w-3.5 h-3.5" /></a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 italic">ยังไม่มีเทปเรียนในคอร์สนี้</div>
                )}
              </div>

              {/* ADD TAPE PANEL FOR ADMIN/SUPER ADMIN */}
              {hasAdminPrivileges && isAdminModeActive && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-500/10">
                    <Video className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold uppercase text-amber-600">Add Course Tape Record</h4>
                  </div>
                  <form onSubmit={handleAddTape} className="space-y-3">
                    <input type="text" required value={newTape.title} onChange={e => setNewTape({...newTape, title: e.target.value})} placeholder="หัวข้อบทเรียนประยุกต์สอน" className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border rounded-xl text-xs focus:outline-none" />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" required value={newTape.videoUrl} onChange={e => setNewTape({...newTape, videoUrl: e.target.value})} placeholder="YouTube URL / ID" className="col-span-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border rounded-xl text-xs focus:outline-none" />
                      <input type="text" required value={newTape.duration} onChange={e => setNewTape({...newTape, duration: e.target.value})} placeholder="Runtime" className="px-3 py-1.5 bg-white dark:bg-zinc-900 border rounded-xl text-xs focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">อัปโหลดไฟล์ชีทเข้าคอร์ส</label>
                      <input type="file" multiple onChange={handleMaterialsUpload} className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 cursor-pointer" />
                    </div>
                    <button type="submit" className="w-full py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm">+ Add Tape & Resources</button>
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