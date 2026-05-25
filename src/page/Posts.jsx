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
// 🔒 นำเข้า Authระบบส่วนกลางที่ปลอดภัยและผ่านการ Verify จาก DB แล้ว
import { useAuth } from '../context/AuthContext';
// 🔌 นำเข้า supabase client
import { supabase } from '../supabaseClient';

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  
  // 🔄 State ควบคุมโหมดมุมมองแอดมิน (สามารถสลับไปมาระหว่างมุมมองแอดมินกับคนทั่วไปได้)
  const [isAdminModeActive, setIsAdminModeActive] = useState(false);

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

  // 🔒 ดึงค่าสถานะสิทธิ์จากระบบกลางแบบ Single Source of Truth
  const { user, role } = useAuth();
  
  // 🔐 ตรวจสอบว่าบัญชีนี้มีสิทธิ์ระดับแอดมินในระบบจริงหรือไม่
  const isRealAdmin = role === 'Admin' || role === 'Super Admin' || role === 'admin' || role === 'super_admin';

  // 🔄 เมื่อสิทธิ์ในฐานข้อมูลโหลดมาเสร็จ ถ้าเป็นแอดมินจริง ให้เปิดโหมดแอดมินเริ่มต้นไว้ก่อน
  useEffect(() => {
    if (isRealAdmin) {
      setIsAdminModeActive(true);
    } else {
      setIsAdminModeActive(false);
    }
  }, [role, isRealAdmin]);

  // 🛡️ ตัวแปรตัดสินสุดท้ายในการแสดงผล UI ของหน้าโพสต์ (อ้างอิงตามโหมดที่เลือกสลับ)
  const isAdmin = isRealAdmin && isAdminModeActive;

  // ตรวจสอบว่าเป็นเครื่อง Localhost หรือไม่ เพื่อแสดงแผงควบคุมโหมดการจำลองด้านล่าง
  const isLocalDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
  );

  // 🔄 ดึงข้อมูลและเชื่อมต่อระบบ Real-time Sync ข้ามเครื่อง
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

  // 📦 ฟังก์ชันอัปโหลดไฟล์เข้า Storage Bucket 'post-assets'
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
          likes: 0,
          views: 0,
          comments: []
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

  // 💬 ฟังก์ชันจัดการเพิ่มข้อความวิจารณ์
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

  const togglePostSetting = async (postId, column, currentValue) => {
    await supabase.from('posts').update({ [column]: !currentValue }).eq('id', postId);
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้ถาวร?")) {
      await supabase.from('posts').delete().eq('id', postId);
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
            <Sparkles className="w-3.5 h-3.5" /> Intelligence Exchange
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            ATier Chronicle
          </h1>
        </div>
        {isAdmin && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <Shield className="w-3.5 h-3.5" /> แอดมินคอนโทรลรูม (Active)
          </div>
        )}
      </div>

      {/* 📝 ฟอร์มเขียนโพสต์สำหรับ Admin/Super Admin */}
      {isAdmin && (
        <div className="max-w-3xl mx-auto px-4 mb-12">
          <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-amber-500/30 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
              <Shield className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">สร้าง Asset บทความวิจัยและองค์ความรู้ใหม่</h3>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <input 
                type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Core Headline / ชื่อหัวข้อวิจัยหลัก..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-base font-semibold focus:outline-none focus:border-blue-500 transition-colors"
              />

              <input 
                type="text" required value={newSummary} onChange={(e) => setNewSummary(e.target.value)}
                placeholder="คำอธิบายสรุปสั้น ๆ ของเนื้อหา (แสดงในหน้ารวมโพสต์)..."
                className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-600 dark:text-zinc-400 focus:outline-none focus:border-blue-500"
              />

              <textarea 
                required rows="5" value={newContent} onChange={(e) => setNewContent(e.target.value)}
                placeholder="เขียนหรือร่างเนื้อหาบทความเชิงลึกที่นี่..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none leading-relaxed resize-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400 block">🖼️ ไฟล์รูปภาพหน้าปก</label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2">
                    <ImageIcon className="w-4 h-4 text-slate-400 ml-2 mr-2" />
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-xs text-zinc-400 file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer w-full" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-400 block">📎 ไฟล์ประกอบสำหรับผู้เรียนดาวน์โหลด</label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2">
                    <Paperclip className="w-4 h-4 text-slate-400 ml-2 mr-2" />
                    <input type="file" onChange={(e) => setAttachmentFile(e.target.files[0])} className="text-xs text-zinc-400 file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer w-full" />
                  </div>
                </div>
              </div>

              <input type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="แท็กหัวข้อ (คั่นด้วยเครื่องหมายจุลภาค เช่น: Competitive, C++, Nanoscience)" className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none" />

              <div className="flex flex-wrap gap-6 pt-1 text-xs font-semibold text-zinc-400">
                <button type="button" onClick={() => setIsDownloadEnabled(!isDownloadEnabled)} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  {isDownloadEnabled ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-zinc-600" />}
                  <span>อนุญาตให้ผู้ใช้อื่นดาวน์โหลดไฟล์แนบนี้</span>
                </button>
                <button type="button" onClick={() => setIsDiscussEnabled(!isDiscussEnabled)} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  {isDiscussEnabled ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-zinc-600" />}
                  <span>เปิดระบบแสดงความคิดเห็น (Discuss)</span>
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={uploading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow-sm transition-all disabled:opacity-50" >
                  <Send className="w-3.5 h-3.5" />
                  <span>{uploading ? "กำลังบันทึก Asset..." : "เผยแพร่ Chronicle"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📑 รายการบทความวิจัย / Feed Content */}
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        {posts.map((post) => {
          const isCurrentPostLiked = likedPosts[post.id];
          return (
            <div key={post.id} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden">
              
              {/* แผงควบคุมด่วนสำหรับ Admin */}
              {isAdmin && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-100 dark:bg-zinc-950/80 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <button 
                    onClick={() => togglePostSetting(post.id, 'is_download_enabled', post.is_download_enabled)}
                    className={`p-1 rounded-md text-[10px] font-bold ${post.is_download_enabled ? 'text-emerald-500' : 'text-zinc-500'}`}
                    title="สลับสิทธิ์การดาวน์โหลด"
                  >
                    DL
                  </button>
                  <button 
                    onClick={() => togglePostSetting(post.id, 'is_discuss_enabled', post.is_discuss_enabled)}
                    className={`p-1 rounded-md text-[10px] font-bold ${post.is_discuss_enabled ? 'text-emerald-500' : 'text-zinc-500'}`}
                    title="สลับสิทธิ์คอมเมนต์"
                  >
                    💬
                  </button>
                  <button 
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1 rounded-md text-red-500 hover:bg-red-500/10"
                    title="ลบโพสต์ถาวร"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ข้อมูลหัวโพสต์ */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {post.tags && post.tags.map((tag, index) => (
                    <span key={index} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                      #{tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 pr-16">
                  {post.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                  {post.summary}
                </p>
              </div>

              {/* รูปภาพหน้าปก (ถ้ามี) */}
              {post.image_url && (
                <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/50">
                  <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* เนื้อหาบทความเชิงลึก */}
              <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>

              {/* แผงดาวน์โหลดไฟล์แนบ */}
              {post.file_url && post.is_download_enabled && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-xs font-mono font-medium text-slate-600 dark:text-zinc-400 truncate">
                      {post.file_name || "attachment_resource.pdf"}
                    </span>
                  </div>
                  <a 
                    href={post.file_url} 
                    download={post.file_name || "attachment"} 
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-500 transition-colors shrink-0"
                  >
                    <Download className="w-3 h-3" /> DOWNLOAD
                  </a>
                </div>
              )}

              {/* แถบ Interactive (Like / Discuss) & Views */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/40">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleLike(post)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrentPostLiked 
                        ? 'bg-red-500/10 text-red-500' 
                        : 'bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isCurrentPostLiked ? 'fill-current' : ''}`} />
                    <span className="font-mono">{post.likes}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500 font-medium">
                    <MessageSquare className="w-4 h-4" />
                    <span>Discuss ({post.comments?.length || 0})</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-zinc-500 font-medium font-mono">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-slate-300 dark:text-zinc-700" />
                    <span>{post.views} views</span>
                  </div>
                </div>
              </div>

              {/* 💬 กล่องแสดงความคิดเห็นและเขียนคอมเมนต์ */}
              <div className="space-y-3 pt-2">
                {post.comments && post.comments.map((comment, idx) => (
                  <div key={comment.id || idx} className="text-xs p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/50 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
                      <span className="flex items-center gap-1"><User className="w-3 h-3 text-blue-400" /> {comment.author}</span>
                      <span>{comment.date}</span>
                    </div>
                    <p className="text-slate-600 dark:text-zinc-300 font-medium">{comment.text}</p>
                  </div>
                ))}

                {/* ฟอร์มพิมพ์คอมเมนต์แยกเดี่ยวอิสระ */}
                {post.is_discuss_enabled ? (
                  <CommentForm post={post} handleAddComment={handleAddComment} />
                ) : (
                  <div className="text-center p-2.5 bg-zinc-800/10 border border-zinc-800/30 text-zinc-500 rounded-xl text-xs font-semibold select-none">
                    🔒 ระบบปิดการสนทนาสำหรับ Asset นี้
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* 🛠️ สวิตช์สลับโหมดจำลองสิทธิ์แอดมิน / คนใช้งานทั่วไป (เฉพาะในบัญชีแอดมินจริงเท่านั้น) */}
      {isRealAdmin && (
        <div className="fixed bottom-4 left-4 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3 rounded-2xl shadow-lg flex items-center gap-3">
          <Wrench className="w-4 h-4 text-amber-500" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">โหมดจำลองมุมมอง</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
              {isAdminModeActive ? "👁️ กำลังดูแบบ: แอดมิน" : "👤 กำลังดูแบบ: ผู้เรียนทั่วไป"}
            </span>
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

// 🧩 คอมโพเนนต์ฟอร์มกรอกความคิดเห็นอิสระ
function CommentForm({ post, handleAddComment }) {
  const [text, setText] = useState('');
  return (
    <div className="flex items-center gap-2 pt-2">
      <input 
        type="text" 
        value={text} 
        onChange={(e) => setText(e.target.value)}
        placeholder="ร่วมแชร์มุมมอง พิมพ์ข้อความที่นี่..."
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleAddComment(post.id, post.comments, text);
            setText('');
          }
        }}
        className="w-full px-4 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-slate-800 dark:text-zinc-100"
      />
      <button 
        onClick={() => {
          handleAddComment(post.id, post.comments, text);
          setText('');
        }}
        className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}