import React, { useState } from 'react';
import { 
  Search, Play, FileText, Download, CheckCircle, ChevronRight, ChevronDown, 
  ArrowLeft, Bookmark, Shield, Plus, Clock, BookOpen, Award, Video
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  }
];

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [expandedLecture, setExpandedLecture] = useState(null);
  const [completedLectures, setCompletedLectures] = useState({});
  const [mockTime] = useState("00:34:12");
  
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');

  // ตรวจสอบ Admin
  const adminEmails = ['in.klang2551@gmail.com', 'example@gmail.com'];
  const isAdmin = user && adminEmails.includes(user.email);

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setCurrentLecture(course.lectures[0]);
    setExpandedLecture(course.lectures[0]?.id);
  };

  const toggleLectureCompletion = (id, e) => {
    e.stopPropagation();
    setCompletedLectures(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getCourseProgress = (course) => {
    if (!course?.lectures?.length) return 0;
    const finished = course.lectures.filter(l => completedLectures[l.id]).length;
    return Math.round((finished / course.lectures.length) * 100);
  };

  const handleAdminAddLecture = (e) => {
    e.preventDefault();
    if (!newLectureTitle || !selectedCourse) return;
    const newLecture = {
      id: `l-${Date.now()}`,
      title: `Tape ${selectedCourse.lectures.length + 1}: ${newLectureTitle}`,
      duration: "1h 30m",
      videoId: "dQw4w9WgXcQ",
      materials: newMaterialName ? [newMaterialName] : ["Reference.pdf"]
    };
    const updated = courses.map(c => c.id === selectedCourse.id ? {...c, lectures: [...c.lectures, newLecture]} : c);
    setCourses(updated);
    setSelectedCourse(updated.find(c => c.id === selectedCourse.id));
    setNewLectureTitle('');
    setNewMaterialName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 p-6">
      {!selectedCourse ? (
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-8">Premium Core Repository</h1>
          <input 
            placeholder="Search courses..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md p-3 rounded-xl border border-slate-200 dark:border-zinc-800 mb-8 bg-white dark:bg-zinc-900"
          />
          <div className="grid md:grid-cols-3 gap-6">
            {courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(course => (
              <div key={course.id} onClick={() => handleSelectCourse(course)} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:shadow-lg">
                <h3 className="font-bold text-xl">{course.title}</h3>
                <p className="text-sm text-slate-500 mt-2">{course.description}</p>
                <div className="mt-4 font-bold text-blue-500">{getCourseProgress(course)}% Done</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <button onClick={() => setSelectedCourse(null)} className="mb-6 flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16}/> Back</button>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="aspect-video bg-black rounded-2xl flex items-center justify-center text-white">Video Player: {currentLecture?.title}</div>
              <div className="mt-4 p-4 bg-white dark:bg-zinc-900 rounded-xl">{currentLecture?.title}</div>
            </div>
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl">
                <h4 className="font-bold mb-2">Lectures</h4>
                {selectedCourse.lectures.map(l => (
                  <div key={l.id} onClick={() => setCurrentLecture(l)} className={`p-3 cursor-pointer ${currentLecture?.id === l.id ? 'bg-blue-500/10' : ''}`}>
                    {l.title}
                  </div>
                ))}
              </div>
              {/* ส่วน Admin แอบซ่อนไว้ */}
              {isAdmin && (
                <div className="bg-amber-500/10 border border-amber-500 p-4 rounded-2xl">
                  <h4 className="text-amber-600 font-bold mb-2">Admin Registry</h4>
                  <form onSubmit={handleAdminAddLecture} className="space-y-2">
                    <input className="w-full p-2 text-sm bg-white dark:bg-zinc-900" placeholder="New Tape Title" value={newLectureTitle} onChange={e => setNewLectureTitle(e.target.value)} />
                    <button className="w-full bg-amber-500 text-white p-2 rounded-lg text-xs font-bold">Add Tape</button>
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