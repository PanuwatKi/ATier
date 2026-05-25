import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Eye, 
  Calendar, 
  Clock, 
  User, 
  Shield, 
  Image as ImageIcon, 
  Send, 
  MessageSquare,
  Sparkles,
  Share2,
  Paperclip,
  Download,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Wrench
} from 'lucide-react';
// 🔐 นำเข้า useAuth เพื่อเรียกใช้สิทธิ์แบบรวมศูนย์
import { useAuth } from '../context/AuthContext'; 
// 🔌 นำเข้า supabase client
import { supabase } from '../supabaseClient'; 

export default function Posts() {
  // 👥 เรียกใช้ข้อมูล User และ Role จากระบบส่วนกลาง
  const { user, role } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdminModeActive, setIsAdminModeActive] = useState(false); 
  const [likedPosts, setLikedPosts] = useState({});

  // Form States สำหรับ Admin เขียนโพสต์
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [imageFile, setImageFile] = useState(null); 
  const [attachmentFile, setAttachmentFile] = useState(null); 
  const [isDownloadEnabled, setIsDownloadEnabled] = useState(true); 
  const [isDiscussEnabled, setIsDiscussEnabled] = useState(true); 
  const [newTags, setNewTags] = useState('');
  const [uploading, setUploading] = useState(false);

  // 🌐 ตรวจสอบสภาพแวดล้อมเพื่อความสะดวกในการพัฒนา (Localhost)
  const isLocalDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
  );

  // ตรวจสอบสิทธิ์ว่าเป็นแอดมินหรือไม่
  const isAdminUser = role === 'Admin' || role === 'Super Admin' || role === 'admin' || role === 'super_admin' || user?.email?.toLowerCase() === 'admin@atier.com';

  // ซิงค์สวิตช์โหมดการแสดงผล UI แอดมินอัตโนมัติ
  useEffect(() => {
    if (isAdminUser || isLocalDev) {
      setIsAdminModeActive(true);
    } else {
      setIsAdminModeActive(false);
    }
  }, [role, isAdminUser, isLocalDev]);

  // 🛡️ ตัวแปรตัดสินสุดท้ายในการแสดงผล UI แอดมินบนหน้าเว็บ
  const isAdmin = (isAdminUser || isLocalDev) && isAdminModeActive;

  // 🔄 ดึงข้อมูลและเชื่อมต่อระบบ Real-time Sync
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Error fetching posts:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    const postChannel = supabase
      .channel('realtime-posts-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postChannel);
    };
  }, []);

  // 📦 ฟังก์ชันอัปโหลดไฟล์เข้า Storage Bucket
  const uploadToStorage = async (file, folder) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('post-assets')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from('post-assets').getPublicUrl(filePath);
    return { url: data.publicUrl, name: file.name };
  };

  // 📝 ฟังก์ชันสร้างโพสต์ใหม่ลงฐานข้อมูล
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle || !newSummary || !newContent) return;

    setUploading(true);
    try {
      let imageUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800";
      if (imageFile) {
        const uploadedImg = await uploadToStorage(imageFile, 'covers');
        if (uploadedImg) imageUrl = uploadedImg.url;
      }

      let fileUrl = null;
      let fileName = null;
      if (attachmentFile) {
        const uploadedDoc = await uploadToStorage(attachmentFile, 'materials');
        if (uploadedDoc) {
          fileUrl = uploadedDoc.url;
          fileName = uploadedDoc.name;
        }
      }

      const tagsArray = newTags ? newTags.split(',').map(t => t.trim()) : ["ATier", "Research"];

      const { error } = await supabase
        .from('posts')
        .insert([{
          title: newTitle,
          summary: newSummary,
          content: newContent,
          image_url: imageUrl,
          file_url: fileUrl,
          file_name: fileName,
          tags: tagsArray,
          is_download_enabled: isDownloadEnabled,
          is_discuss_enabled: isDiscussEnabled,
          is_hidden: false, // บันทึกค่าเริ่มต้นเป็นยังไม่ซ่อน
          likes: 0,
          views: 0,
          comments: [],
          user_id: user?.id 
        }]);

      if (error) throw error;

      setNewTitle(''); setNewSummary(''); setNewContent('');
      setNewTags(''); setImageFile(null); setAttachmentFile(null);
      alert("🎉 เผยแพร่บทความใหม่สำเร็จและอัปเดตไปยังทุกเครื่องแล้ว!");
    } catch (err) {
      alert(`❌ อัปโหลดล้มเหลว: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (post) => {
    const alreadyLiked = likedPosts[post.id];
    const updatedLikes = alreadyLiked ? Math.max(0, post.likes - 1) : post.likes + 1;
    setLikedPosts(prev => ({ ...prev, [post.id]: !alreadyLiked }));
    
    await supabase.rpc('increment_like_secure', { 
      post_id_param: post.id, 
      updated_likes: updatedLikes 
    });
  };

  const handleAddComment = async (postId, existingComments, text) => {
    if (!text.trim()) return;
    const commentatorName = user?.user_metadata?.full_name || user?.email || "Anonymous Student";
    const newCommentObj = {
      id: `comment-${Date.now()}`,
      author: commentatorName,
      text: text,
      date: "Just now"
    };
    const updatedComments = [...(existingComments || []), newCommentObj];
    
    await supabase.rpc('add_comment_secure', { 
      post_id_param: postId, 
      updated_comments: updatedComments 
    });
  };

  // ⚙️ ฟังก์ชันอัปเดตตั้งค่าแบบไดนามิก (เปิด/ปิดดาวน์โหลด, คอมเมนต์, ซ่อนโพสต์)
  const togglePostSetting = async (postId, column, currentValue) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ [column]: !currentValue })
        .eq('id', postId);
      
      if (error) throw error;
    } catch (err) {
      alert(`❌ ไม่สามารถอัปเดตการตั้งค่าได้: ${err.message}`);
      console.error(err);
    }
  };

  // 🗑️ ฟังก์ชันลบโพสต์ถาวร (เพิ่มการดึง Error และการ Alert แจ้งสถานะ)
  const handleDeletePost = async (postId) => {
    if (window.confirm("❗ คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้ถาวร? การกระทำนี้ไม่สามารถย้อนคืนได้")) {
      try {
        const { error, count } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId);
        
        if (error) throw error;
        
        alert("🗑️ ลบโพสต์ออกจากฐานข้อมูลระบบเรียบร้อยแล้ว!");
      } catch (err) {
        alert(`❌ ลบล้มเหลว: ${err.message}\n\n💡 คำแนะนำ: ตรวจสอบความถูกต้องของนโยบาย RLS (DELETE) บนตาราง 'posts' อีกครั้งครับ`);
        console.error("Delete failed:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="animate-pulse font-mono">กำลังเชื่อมโยง Chronicle เรียลไทม์...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 py-12 transition-colors duration-200 pb-24">
      
      {/* ส่วนหัวหน้าเว็บ */}
      <div className="max-w-3xl mx-auto px-4 mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Posts
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            ATier Posts 
          </h1>
        </div>
        {isAdmin && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <Shield className="w-3.5 h-3.5" /> Admin Control Room (Active)
          </div>
        )}
      </div>

      {/* 📝 ฟอร์มเขียนโพสต์สำหรับ Admin */}
      {isAdmin && (
        <div className="max-w-3xl mx-auto px-4 mb-12">
          <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-amber-500/30 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
              <Shield className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">สร้างโพสต์/Create Post</h3>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <input 
                type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Headline / ชื่อหัวข้อ..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-base font-semibold focus:outline-none focus:border-blue-500 transition-colors"
              />

              <input 
                type="text" required value={newSummary} onChange={(e) => setNewSummary(e.target.value)}
                placeholder="ชื่อผู้โพสต์/Author หรือ คำอธิบายโพสต์/Post Description (แสดงในหน้ารวมโพสต์/Show on the post feed)..."
                className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-600 dark:text-zinc-400 focus:outline-none focus:border-blue-500"
              />

              <textarea 
                required rows="5" value={newContent} onChange={(e) => setNewContent(e.target.value)}
                placeholder="เนื้อหา / Post content..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none leading-relaxed resize-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400 block">🖼️ ไฟล์รูปภาพหน้าปก/Cover image file</label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2">
                    <ImageIcon className="w-4 h-4 text-slate-400 ml-2 mr-2" />
                    <input 
                      type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])}
                      className="text-xs text-zinc-400 file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400 block">📎 ไฟล์ให้ผู้ใช้ดาวน์โหลด/File for user download</label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2">
                    <Paperclip className="w-4 h-4 text-slate-400 ml-2 mr-2" />
                    <input 
                      type="file" onChange={(e) => setAttachmentFile(e.target.files[0])}
                      className="text-xs text-zinc-400 file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer w-full"
                    />
                  </div>
                </div>
              </div>

              <input 
                type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)}
                placeholder="แท็กหัวข้อ (คั่นด้วยเครื่องหมายจุลภาค เช่น: Bio,C++,Dev)"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none"
              />

              <div className="flex flex-wrap gap-6 pt-1 text-xs font-semibold text-zinc-400">
                <button type="button" onClick={() => setIsDownloadEnabled(!isDownloadEnabled)} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  {isDownloadEnabled ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-zinc-600" />}
                  <span>อนุญาตให้ผู้ใช้อื่นดาวน์โหลดไฟล์แนบนี้</span>
                </button>
                <button type="button" onClick={() => setIsDiscussEnabled(!isDiscussEnabled)} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  {isDiscussEnabled ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-zinc-600" />}
                  <span>เปิดคอมเม้น (Allow user to Comment)</span>
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit" disabled={uploading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{uploading ? 'กำลังประมวลผลคลาวด์...' : 'Publish to Chronicle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📇 รายการแสดงผลบล็อกบทความ */}
      <div className="max-w-3xl mx-auto px-4 space-y-10">
        {posts.length === 0 ? (
          <div className="text-center text-zinc-500 font-mono text-sm py-12">There are currently no published articles.</div>
        ) : (
          posts
            .filter(post => !post.is_hidden || isAdmin) // 🛠️ กรองโพสต์: ถ้าถูกซ่อน คนทั่วไปจะไม่เห็น แต่ Admin จะยังมองเห็นอยู่
            .map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                isAdmin={isAdmin} 
                likedPosts={likedPosts} 
                handleLike={handleLike}
                handleAddComment={handleAddComment}
                togglePostSetting={togglePostSetting}
                handleDeletePost={handleDeletePost}
              />
            ))
        )}
      </div>

      {/* 🛠️ DEV MODE FLOATING PANEL: ปุ่มสลับโหมดจำลองสิทธิ์ที่ควบคุม UI ได้จริง */}
      {(isLocalDev || isAdminUser) && (
        <div className="fixed bottom-4 right-4 z-50 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
            <Wrench className="w-3.5 h-3.5" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400">View mode</span>
              <span>{isAdminModeActive ? "👁️ Admin" : "👤 User"}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsAdminModeActive(!isAdminModeActive)}
            className="focus:outline-none cursor-pointer"
          >
            {isAdminModeActive ? <ToggleRight className="w-7 h-7 text-amber-500" /> : <ToggleLeft className="w-7 h-7 text-zinc-500" />}
          </button>
        </div>
      )}

    </div>
  );
}

function PostCard({ post, isAdmin, likedPosts, handleLike, handleAddComment, togglePostSetting, handleDeletePost }) {
  const isCurrentPostLiked = likedPosts[post.id];
  const [showDiscussSection, setShowDiscussSection] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  useEffect(() => {
    const triggerViewIncrement = async () => {
      // ป้องกันการนับยอดวิวซ้ำให้กับโพสต์ที่ถูกซ่อนอยู่
      if (post.is_hidden) return;

      const viewedHistory = JSON.parse(sessionStorage.getItem('atier_viewed_chronicles') || '[]');
      if (!viewedHistory.includes(post.id)) {
        viewedHistory.push(post.id);
        sessionStorage.setItem('atier_viewed_chronicles', JSON.stringify(viewedHistory));
        
        await supabase.rpc('increment_view_secure', { 
          post_id_param: post.id, 
          updated_views: (post.views || 0) + 1 
        });
      }
    };
    triggerViewIncrement();
  }, [post.id, post.is_hidden]);

  return (
    // 🎨 ปรับแต่งสไตล์การ์ด: หากโพสต์โดนซ่อน จะกลายเป็นกรอบขีดสลักสีส้มจาง ๆ เพื่อให้แอดมินแยกแยะได้ง่าย
    <article className={`bg-white dark:bg-zinc-900 border rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 space-y-5 relative ${
      post.is_hidden 
        ? 'border-dashed border-amber-500/40 bg-amber-500/[0.01] dark:bg-amber-500/[0.02] opacity-80' 
        : 'border-slate-200/60 dark:border-zinc-800/60'
    }`}>
      
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 dark:text-zinc-500 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-blue-500" /> {post.author || "System"}</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.created_at ? new Date(post.created_at).toLocaleDateString('th-TH', {day:'numeric', month:'short', year:'numeric'}) : "Just now"}</span>
          
          {/* ป้ายกำกับแจ้งเตือนสถานะ Hidden บนโพสต์ */}
          {post.is_hidden && (
            <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider animate-pulse">
              🔒 ซ่อนอยู่ (Hidden)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex items-center gap-2 border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 rounded-xl text-[10px] text-amber-500 font-bold">
              {/* 👁️ ปุ่มฟังก์ชันซ่อนโพสต์สำหรับแอดมิน */}
              <button onClick={() => togglePostSetting(post.id, 'is_hidden', post.is_hidden)} className="text-amber-600 dark:text-amber-400 hover:underline">
                {post.is_hidden ? "👁️ แสดงโพสต์" : "🚫 ซ่อนโพสต์"}
              </button>
              <span className="text-zinc-700">|</span>
              
              <button onClick={() => togglePostSetting(post.id, 'is_download_enabled', post.is_download_enabled)} className="hover:underline">
                {post.is_download_enabled ? "🔓 ดาวน์โหลดเปิด" : "🔒 ดาวน์โหลดปิด"}
              </button>
              <span className="text-zinc-700">|</span>
              
              <button onClick={() => togglePostSetting(post.id, 'is_discuss_enabled', post.is_discuss_enabled)} className="hover:underline">
                {post.is_discuss_enabled ? "🔓 คอมเมนต์เปิด" : "🔒 คอมเมนต์ปิด"}
              </button>
              <span className="text-zinc-700">|</span>
              
              <button onClick={() => handleDeletePost(post.id)} className="text-red-400 hover:text-red-500">
                <Trash2 className="w-3 h-3 inline" />
              </button>
            </div>
          )}
          <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 rounded-md text-[11px] font-semibold"><Clock className="w-3.5 h-3.5" /> 5 min read</span>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-950 dark:text-zinc-100 tracking-tight leading-tight">{post.title}</h2>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 border-l-2 border-blue-500 pl-3 py-0.5">{post.summary}</p>
      </div>

      {post.image_url && (
        <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800/60">
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover select-none" loading="lazy" />
        </div>
      )}

      <p className="text-sm md:text-base text-slate-700 dark:text-zinc-300 font-normal leading-relaxed text-justify whitespace-pre-wrap">{post.content}</p>

      {post.file_url && (
        <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Paperclip className="w-4 h-4 text-blue-500 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 truncate">{post.file_name || 'Attached_Resource.pdf'}</p>
              <p className="text-[10px] text-slate-400">เอกสารแนบยืนยันความรู้ประจำบทความ</p>
            </div>
          </div>
          
          {post.is_download_enabled ? (
            <a 
              href={post.file_url} download target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Resource</span>
            </a>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-800 text-zinc-500 text-xs font-bold select-none whitespace-nowrap border border-zinc-700">
              🔒สิทธิ์ดาวน์โหลดถูกปิดโดยแอดมิน
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {post.tags && post.tags.map((tag, idx) => (
          <span key={idx} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-500 border border-slate-200/40 dark:border-zinc-800/40">#{tag}</span>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={() => handleLike(post)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
              isCurrentPostLiked 
                ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isCurrentPostLiked ? 'fill-current' : ''}`} />
            <span className="font-mono">{post.likes || 0}</span>
          </button>

          <button 
            onClick={() => setShowDiscussSection(!showDiscussSection)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ${
              showDiscussSection 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-blue-400'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Discuss ({post.comments?.length || 0})</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-zinc-500 font-medium font-mono">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-slate-300 dark:text-zinc-700" />
            <span>{post.views || 0} views</span>
          </div>
          <Share2 className="w-4 h-4 text-slate-300 dark:text-zinc-700 hover:text-slate-500 cursor-pointer transition-colors" />
        </div>
      </div>

      {showDiscussSection && (
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/60 space-y-4 bg-slate-50/50 dark:bg-zinc-950/30 p-4 rounded-2xl">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">ห้องสนทนาแลกเปลี่ยนความคิดเห็น</h4>
          
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {(!post.comments || post.comments.length === 0) ? (
              <p className="text-xs text-zinc-500 italic font-mono pl-1">ยังไม่มีข้อความสนทนา...</p>
            ) : (
              post.comments.map((comment, i) => (
                <div key={comment.id || i} className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 p-3 rounded-xl">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="font-bold text-blue-500 dark:text-blue-400">{comment.author}</span>
                    <span className="text-zinc-500 font-mono text-[10px]">{comment.date}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">{comment.text}</p>
                </div>
              ))
            )}
          </div>

          {post.is_discuss_enabled ? (
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)}
                placeholder="ร่วมแชร์มุมมอง พิมพ์ข้อความที่นี่..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment(post.id, post.comments, commentInput);
                    setCommentInput('');
                  }
                }}
                className="w-full px-4 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button 
                onClick={() => {
                  handleAddComment(post.id, post.comments, commentInput);
                  setCommentInput('');
                }}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-center p-2.5 bg-zinc-800/50 border border-zinc-800 text-zinc-500 rounded-xl text-xs font-semibold select-none">
              🔒 กล่องข้อความสลับปิดการใช้งานชั่วคราวโดยอาจารย์หรือผู้ดูแลระบบ
            </div>
          )}
        </div>
      )}

    </article>
  );
}