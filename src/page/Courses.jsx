import React, { useState, useEffect } from 'react';
import { 
  Search, Play, FileText, Download, CheckCircle, ChevronRight, 
  ChevronDown, ArrowLeft, Bookmark, Shield, Plus, Clock, 
  BookOpen, Award, Video, Trash2, Eye, EyeOff, FolderPlus, Link2, Upload, Image as ImageIcon, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 
import { supabase } from '../supabaseClient';

export default function Courses() {
  const { user, role } = useAuth(); 
  const isAdmin = role === 'Super Admin' || role === 'Admin';

  // --- States สำหรับจัดการข้อมูลคอร์ส ---
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  // --- States สำหรับฟอร์มเพิ่มเทปเรียน (Admin Panel) ---
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [tapeTitle, setTapeTitle] = useState('');
  const [tapeDuration, setTapeDuration] = useState('');
  const [tapeVideoId, setTapeVideoId] = useState(''); 
  const [uploadedMaterials, setUploadedMaterials] = useState([]); 
  const [uploadStatus, setUploadStatus] = useState(''); 
  
  // 🔥 สเตทใหม่: คอยเก็บหลักฐานข้อมูลที่ส่งสำเร็จล่าสุดเพื่อแสดงให้แอดมินตรวจสอบ (Verification Log)
  const [lastUploadSummary, setLastUploadSummary] = useState(null);

  // --- States สำหรับสร้างคอร์สใหม่ + ไฟล์รูปภาพหน้าปก ---
  const [newCourseId, setNewCourseId] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('Informatics');
  const [newCourseInstructor, setNewCourseInstructor] = useState('Ajarn ATier');
  const [courseCoverFile, setCourseCoverFile] = useState(null); 
  const [actionLoading, setActionLoading] = useState(false);   

  const extractYoutubeId = (urlOrId) => {
    if (!urlOrId) return '';
    const trimmed = urlOrId.trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    return (match && match[2].length === 11) ? match[2] : trimmed;
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const formattedData = data.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        imageUrl: course.image_url,
        category: course.category,
        instructor: course.instructor,
        isHidden: course.is_hidden,
        lectures: course.lectures || []
      }));
      
      setCourses(formattedData);

      if (selectedCourse) {
        const updatedCurrent = formattedData.find(c => c.id === selectedCourse.id);
        if (updatedCurrent) setSelectedCourse(updatedCurrent);
      }
    } catch (err) {
      console.error("Error fetching courses:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    const courseChannel = supabase
      .channel('realtime-courses-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => { fetchCourses(); })
      .subscribe();
    return () => { supabase.removeChannel(courseChannel); };
  }, []);

  const handleMaterialsUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedMaterials(files);
  };

  // 3.1 ฟังก์ชันเพิ่มเทปเรียนแบบมีระบบดักจับ Error และออกใบเสร็จสรุปผลลิงก์
  const handleAddTapeSubmit = async (e) => {
    e.preventDefault();
    setLastUploadSummary(null); // ล้างประวัติการเช็คอันเก่าก่อน
    
    const finalVideoId = extractYoutubeId(tapeVideoId);
    if (!selectedCourseId || !tapeTitle || !finalVideoId) {
      alert("กรุณากรอกข้อมูลสำคัญให้ครบถ้วน");
      return;
    }

    setActionLoading(true);
    setUploadStatus("⚙️ กำลังตรวจสอบความเสถียรของเซิร์ฟเวอร์...");

    try {
      const targetCourse = courses.find(c => c.id === selectedCourseId);
      if (!targetCourse) throw new Error("ไม่พบข้อมูลคอร์สเรียนปลายทางในตารางฐานข้อมูล");

      let uploadedMaterialsData = [];

      // กระบวนการส่งไฟล์ขึ้นคลาวด์ Storage
      if (uploadedMaterials.length > 0) {
        let currentFileIndex = 1;

        for (const file of uploadedMaterials) {
          setUploadStatus(`📤 [${currentFileIndex}/${uploadedMaterials.length}] กำลังอัปโหลด: ${file.name}`);

          const fileExt = file.name.split('.').pop();
          const fileName = `${selectedCourseId}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
          const filePath = `materials/${fileName}`;

          // ยิงข้อมูลเข้า Supabase Storage บัคเก็ต course-assets
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('course-assets')
            .upload(filePath, file);

          // 🚨 ตรวจสอบว่า Supabase ปฏิเสธการบันทึกไฟล์หรือไม่
          if (uploadError) {
            throw new Error(`Supabase Storage ปฏิเสธไฟล์ ${file.name} เหตุผล: ${uploadError.message}`);
          }

          // ขอที่อยู่ลิงก์สาธารณะที่ระบุตำแหน่งไฟล์ชัวร์ๆ
          const { data: urlData } = supabase.storage
            .from('course-assets')
            .getPublicUrl(filePath);

          console.log(`[Verified] File Uploaded To Supabase:`, urlData.publicUrl);

          uploadedMaterialsData.push({
            name: file.name,
            data: urlData.publicUrl
          });

          currentFileIndex++;
        }
      }

      // กระบวนการอัปเดตข้อมูลตาราง Database
      setUploadStatus("📝 กำลังเขียนโครงสร้าง JSON บันทึกลงฐานข้อมูลตารางหลัก...");

      const newLecture = {
        id: `l_${Date.now()}`,
        title: tapeTitle,
        duration: tapeDuration || "1h 30m",
        videoId: finalVideoId,
        materials: uploadedMaterialsData
      };

      const updatedLectures = [...targetCourse.lectures, newLecture];

      const { data: dbData, error: dbError } = await supabase
        .from('courses')
        .update({ lectures: updatedLectures })
        .eq('id', selectedCourseId);

      // 🚨 ตรวจสอบว่าตารางข้อมูลเกิด Error หรือไม่
      if (dbError) {
        throw new Error(`Supabase Database บันทึกข้อมูลไม่เข้า เหตุผล: ${dbError.message}`);
      }

      console.log("[Verified] Course Table Lectures Updated Successfully!");

      // อัปเดต State หน้าเว็บทันที
      const updatedCoursesList = courses.map(c => {
        if (c.id === selectedCourseId) return { ...c, lectures: updatedLectures };
        return c;
      });
      setCourses(updatedCoursesList);

      if (selectedCourse && selectedCourse.id === selectedCourseId) {
        setSelectedCourse(prev => ({ ...prev, lectures: updatedLectures }));
      }

      // 🔥 บันทึกหลักฐานเพื่อให้หน้าจอเอาไปแสดงผลให้แอดมินเช็คเปิดลิงก์
      setLastUploadSummary({
        courseTitle: targetCourse.title,
        title: tapeTitle,
        videoId: finalVideoId,
        materials: uploadedMaterialsData
      });

      // ล้างฟอร์ม
      setTapeTitle('');
      setTapeDuration('');
      setTapeVideoId('');
      setUploadedMaterials([]);
      const fileInput = document.getElementById('materials-upload-input');
      if (fileInput) fileInput.value = '';

      alert("🎉 สำเร็จ! ข้อมูลวิ่งเข้าเซิร์ฟเวอร์ Supabase เรียบร้อยแล้ว เช็คความถูกต้องได้ที่แถบสีเขียวครับ");
      fetchCourses();

    } catch (err) {
      console.error("[Supabase Error Log]:", err.message);
      alert(`❌ ตรวจพบข้อผิดพลาดจากระบบหลังบ้าน:\n${err.message}`);
    } finally {
      setActionLoading(false);
      setUploadStatus('');
    }
  };

  const toggleCourseVisibility = async (courseId, currentStatus) => {
    try {
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isHidden: !currentStatus } : c));
      const { error } = await supabase
        .from('courses')
        .update({ is_hidden: !currentStatus })
        .eq('id', courseId);
      if (error) throw error;
      fetchCourses();
    } catch (err) {
      alert("ล้มเหลว: " + err.message);
      fetchCourses(); 
    }
  };

  const handleDeleteLecture = async (courseId, lectureId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเทปเรียนนี้?")) return;
    try {
      const targetCourse = courses.find(c => c.id === courseId);
      if (!targetCourse) return;
      const filteredLectures = targetCourse.lectures.filter(l => l.id !== lectureId);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, lectures: filteredLectures } : c));
      if (selectedCourse && selectedCourse.id === courseId) {
        setSelectedCourse(prev => ({ ...prev, lectures: filteredLectures }));
      }
      const { error } = await supabase
        .from('courses')
        .update({ lectures: filteredLectures })
        .eq('id', courseId);
      if (error) throw error;
      fetchCourses();
    } catch (err) {
      alert("ไม่สามารถลบได้: " + err.message);
      fetchCourses();
    }
  };

  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    if (!newCourseId || !newCourseTitle) {
      alert("กรุณากรอกข้อมูลให้ครบถ้อย");
      return;
    }
    setActionLoading(true);
    try {
      let finalImageUrl = "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=600&auto=format&fit=crop";
      if (courseCoverFile) {
        const fileExt = courseCoverFile.name.split('.').pop();
        const fileName = `${newCourseId}-${Date.now()}.${fileExt}`;
        const filePath = `covers/${fileName}`;
        const { error: storageError } = await supabase.storage.from('course-assets').upload(filePath, courseCoverFile);
        if (storageError) throw storageError;
        const { data: urlData } = supabase.storage.from('course-assets').getPublicUrl(filePath);
        finalImageUrl = urlData.publicUrl;
      }
      const { error: dbError } = await supabase.from('courses').insert([{
        id: newCourseId,
        title: newCourseTitle,
        description: newCourseDesc,
        image_url: finalImageUrl,
        category: newCourseCategory,
        instructor: newCourseInstructor,
        is_hidden: false,
        lectures: []
      }]);
      if (dbError) throw dbError;
      setNewCourseId(''); setNewCourseTitle(''); setNewCourseDesc(''); setCourseCoverFile(null);
      const fileInput = document.getElementById('cover-upload-input');
      if (fileInput) fileInput.value = '';
      await fetchCourses();
      alert("🎉 สร้างคอร์สสำเร็จ!");
    } catch (err) {
      alert(`❌ ไม่สำเร็จ: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return isAdmin ? matchesSearch : (matchesSearch && !course.isHidden);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
        <p className="ml-3 text-sm font-semibold text-slate-500">กำลังดาวน์โหลดบทเรียนเรียลไทม์...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      
      {!selectedCourse && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-slate-100 dark:border-zinc-800/60">
          <div>
            <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              <BookOpen className="w-3.5 h-3.5" /> ATier Learning Ecosystem
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Premium Courses
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400 max-w-xl">
              เจาะลึกบทเรียน พัฒนาทักษะ และคลังเครื่องมือสำหรับการแข่งขันระดับประเทศ ซิงค์ข้อมูลทันทีข้ามทุกแพลตฟอร์ม
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ค้นหาบทเรียนหรือคอร์ส..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
            />
          </div>
        </div>
      )}

      {/* ================================================ */}
      {/* หน้าเจาะลึกแสดงเทปเรียนภายในคอร์ส (Course Details View) */}
      {/* ================================================ */}
      {selectedCourse ? (
        <div className="space-y-6 animate-fade-in">
          <button 
            onClick={() => { setSelectedCourse(null); setActiveVideo(null); }}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" /> Back to All Courses
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {activeVideo ? (
                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border dark:border-zinc-800">
                  <iframe
                    src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1`}
                    title={activeVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="aspect-video bg-slate-100 dark:bg-zinc-900/60 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 text-center p-6">
                  <Video className="w-12 h-12 text-slate-300 dark:text-zinc-700 mb-3" />
                  <h3 className="font-bold text-base text-slate-700 dark:text-zinc-300">พร้อมเริ่มต้นการเรียนรู้หรือยัง?</h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">เลือกรายการเทปเรียนทางด้านขวาเพื่อเริ่มต้นเปิดวีดีโอบทเรียนและเข้าถึงเอกสารฝึกฝน</p>
                </div>
              )}

              <div className="p-6 border rounded-2xl bg-white dark:bg-zinc-900/20 border-slate-100 dark:border-zinc-800/80">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-bold text-[10px] tracking-wide uppercase">
                    {selectedCourse.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px] font-medium">
                    Instructor: {selectedCourse.instructor}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedCourse.title}</h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">{selectedCourse.description}</p>
                
                {activeVideo && (
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/60">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">กำลังเรียนอยู่ในหัวข้อ:</p>
                    <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <Play className="w-3.5 h-3.5 fill-current" /> {activeVideo.title} ({activeVideo.duration})
                    </h4>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-sm uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4" /> Course Curriculum ({selectedCourse.lectures.length})
              </h3>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {selectedCourse.lectures.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">ยังไม่มีข้อมูลเทปเรียนถูกอัปโหลดในคอร์สนี้</p>
                ) : (
                  selectedCourse.lectures.map((lecture, index) => {
                    const isPlaying = activeVideo?.id === lecture.id;
                    return (
                      <div 
                        key={lecture.id}
                        className={`p-4 border rounded-xl transition-all ${
                          isPlaying 
                            ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-300 dark:border-amber-800/50 shadow-sm' 
                            : 'bg-white dark:bg-zinc-900/10 border-slate-100 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button 
                            onClick={() => setActiveVideo(lecture)}
                            className="flex-1 text-left group"
                          >
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-1">
                              <span>0{index + 1}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {lecture.duration}</span>
                            </div>
                            <h4 className={`text-xs font-bold transition-colors ${isPlaying ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-zinc-200 group-hover:text-amber-500'}`}>
                              {lecture.title}
                            </h4>
                          </button>

                          {isAdmin && (
                            <button 
                              onClick={() => handleDeleteLecture(selectedCourse.id, lecture.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                              title="ลบเทปเรียนนี้ออก"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {lecture.materials && lecture.materials.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/40 space-y-1.5">
                            {lecture.materials.map((mat, mIdx) => (
                              <a
                                key={mIdx}
                                href={mat.data}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border text-slate-600 dark:text-zinc-400 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 transition-colors font-medium"
                              >
                                <span className="flex items-center gap-1.5 truncate pr-2">
                                  <FileText className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{mat.name}</span>
                                </span>
                                <Download className="w-3 h-3 shrink-0" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        
        // ================================================
        // หน้าแสดงรายการคอร์สทั้งหมด (Grid Layout)
        // ================================================
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-2xl dark:border-zinc-800">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700" />
              <p className="mt-2 text-sm text-slate-500 dark:text-zinc-500 font-medium">ไม่พบรายการคอร์สเรียนที่คุณกำลังค้นหา</p>
            </div>
          ) : (
            filteredCourses.map(course => (
              <div 
                key={course.id}
                className={`group flex flex-col bg-white dark:bg-zinc-900/10 border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 relative ${
                  course.isHidden ? 'opacity-65 border-dashed border-red-300 dark:border-red-900/40' : 'border-slate-100 dark:border-zinc-800/80'
                }`}
              >
                {isAdmin && (
                  <div className="absolute top-3 right-3 z-10 flex gap-1.5 bg-black/50 backdrop-blur-md p-1.5 rounded-xl">
                    <button
                      onClick={() => toggleCourseVisibility(course.id, course.isHidden)}
                      className={`p-1 rounded-md transition-colors ${course.isHidden ? 'text-red-400' : 'text-emerald-400'}`}
                      title={course.isHidden ? "คลิกเพื่อเปิดเผยคอร์ส" : "คลิกเพื่อซ่อนคอร์สนี้จากบุคคลทั่วไป"}
                    >
                      {course.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-[10px] text-white font-bold px-1 self-center">ADMIN</span>
                  </div>
                )}

                <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-zinc-900">
                  <img 
                    src={course.imageUrl} 
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-white/95 dark:bg-zinc-900/95 text-slate-900 dark:text-white font-bold text-[9px] tracking-wide uppercase shadow-sm border border-slate-100 dark:border-zinc-800">
                    {course.category}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug group-hover:text-amber-500 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-50 dark:border-zinc-800/50 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3"/> {course.lectures.length} Tapes Added
                    </span>
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-bold text-xs rounded-xl transition-all duration-200"
                    >
                      Enter Laboratory <ChevronRight className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================================================ */}
      {/* ส่วนควบคุมของผู้ดูแลระบบ (Admin Control Workspace) */}
      {/* ================================================ */}
      {isAdmin && (
        <div className="mt-12 p-6 border-2 border-dashed border-amber-500/20 rounded-3xl bg-amber-50/10 dark:bg-amber-950/5 space-y-8">
          
          <div className="flex items-center gap-2 border-b pb-4 border-amber-500/10">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">แผงควบคุมระบบการศึกษา (Real-time Creator Studio)</h2>
              <p className="text-xs text-slate-400 mt-0.5">ระบบแกะลิงก์และตรวจเช็คการบันทึกปลายทางผ่านเซิร์ฟเวอร์ Supabase อย่างแม่นยำ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* ฟอร์ม 1: เพิ่มเทปเรียนใหม่ลงในคอร์สที่มีอยู่แล้ว */}
            <form onSubmit={handleAddTapeSubmit} className="space-y-4">
              <h3 className="font-black text-xs uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-amber-500" /> 1. เพิ่มเทปการสอน/อัปเดตไฟล์ชีท
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">เลือกคอร์สเรียนปลายทาง *</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- เลือกคอร์ส --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">ความยาวคลิป (เช่น 1h 45m)</label>
                  <input
                    type="text" placeholder="1h 45m" value={tapeDuration} onChange={(e) => setTapeDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">ชื่อตอน / หัวข้อเทปเรียน *</label>
                <input
                  type="text" placeholder="เช่น Tape 3: Advanced Segment Tree Overlap Query" value={tapeTitle} onChange={(e) => setTapeTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-amber-500"/> วางลิงก์ YouTube หรือ Video ID *
                </label>
                <input
                  type="text" 
                  placeholder="วางลิงก์เต็มได้เลย เช่น https://www.youtube.com/watch?v=..." 
                  value={tapeVideoId} 
                  onChange={(e) => setTapeVideoId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-slate-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1 flex items-center gap-1"><Upload className="w-2.5 h-2.5"/> เลือกเอกสารประกอบการเรียนจากในเครื่อง (PDF/Handouts)</label>
                <input 
                  id="materials-upload-input"
                  type="file" multiple onChange={handleMaterialsUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                />
                {uploadedMaterials.length > 0 && (
                  <p className="text-[10px] text-emerald-600 mt-1 font-semibold">📬 เลือกไฟล์ชีทงานพร้อมอัปโหลดจำนวน {uploadedMaterials.length} ไฟล์</p>
                )}
              </div>

              {actionLoading && uploadStatus && (
                <div className="text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2.5 rounded-xl border border-amber-500/20 text-center animate-pulse">
                  {uploadStatus}
                </div>
              )}

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-1 px-4 py-2 bg-amber-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors shadow-sm"
              >
                {actionLoading ? "🚀 กำลังส่งข้อมูลเข้าฐานข้อมูล Supabase..." : <><Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Tape & Upload Resources</>}
              </button>

              {/* 🔥 🔥 กล่องตรวจสอบพิกัดความสำเร็จ (Verification Summary Panel) 🔥 🔥 */}
              {lastUploadSummary && (
                <div className="p-4 border rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/30 text-xs text-slate-700 dark:text-zinc-300 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Supabase Verification: บันทึกสำเร็จชัวร์ 100%</span>
                  </div>
                  <div className="text-[11px] space-y-1 pl-5 text-slate-500 dark:text-zinc-400">
                    <p>• <b>คอร์ส:</b> {lastUploadSummary.courseTitle}</p>
                    <p>• <b>ชื่อตอน:</b> {lastUploadSummary.title}</p>
                    <p>• <b>YouTube ID ในระบบ:</b> <code className="bg-slate-100 dark:bg-zinc-800 px-1 rounded font-mono text-amber-600 font-bold">{lastUploadSummary.videoId}</code></p>
                  </div>
                  
                  {lastUploadSummary.materials.length > 0 && (
                    <div className="pl-5 pt-1 space-y-1">
                      <p className="font-bold text-[11px] text-slate-600 dark:text-zinc-300">🔗 ทดสอบกดเปิดไฟล์ชีท (เช็คพิกัด Cloud Url):</p>
                      {lastUploadSummary.materials.map((mat, idx) => (
                        <a 
                          key={idx} href={mat.data} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-between text-[11px] p-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          <span className="truncate pr-2">👉 {mat.name}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* ฟอร์ม 2: สร้างคอร์สเรียนขึ้นมาใหม่ตั้งต้น */}
            <form onSubmit={handleCreateCourseSubmit} className="space-y-4 border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-8 border-slate-200 dark:border-zinc-800">
              <h3 className="font-black text-xs uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-500" /> 2. จัดเตรียมเปิดคอร์สใหม่ (Create New Course Grid)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">ไอดีคอร์ส (ภาษาอังกฤษ-ตัวเล็ก-ขีดกลาง) *</label>
                  <input
                    type="text" placeholder="เช่น toi-geometry" value={newCourseId} onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">หมวดหมู่ / Category</label>
                  <input
                    type="text" placeholder="Informatics / Physics" value={newCourseCategory} onChange={(e) => setNewCourseCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">ชื่อคอร์สเรียนเต็มรูป *</label>
                <input
                  type="text" placeholder="เช่น POSN Informatics: Computational Geometry Mastery" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">คำอธิบายย่อ (Short Description)</label>
                <textarea
                  placeholder="รายละเอียดคร่าวๆ ของคอร์สสำหรับแสดงหน้ารวม..." value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} rows="1"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-amber-500" /> เลือกไฟล์ภาพปกคอร์สจากเครื่อง
                  </label>
                  <input
                    id="cover-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCourseCoverFile(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 dark:file:bg-zinc-900 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">ชื่อผู้สอน (Instructor)</label>
                  <input
                    type="text" placeholder="Ajarn ATier" value={newCourseInstructor} onChange={(e) => setNewCourseInstructor(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                {actionLoading ? "กำลังอัปโหลดรูปภาพและบันทึกข้อมูลคอร์ส..." : <><FolderPlus className="w-3.5 h-3.5" /> Initialize New Course Template</>}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}