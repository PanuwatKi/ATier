import React, { useState } from 'react';
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
  Share2
} from 'lucide-react';

// Premium Initial Blog Feed Data
const INITIAL_POSTS = [
  {
    id: 1,
    title: "Overcoming the State Space: Advanced Bitmask DP Strategies for TOI",
    summary: "A deep-dive technical blueprint explaining how to safely compress multi-dimensional tracking matrices into clean, low-overhead bitwise operations for Olympic-level informatics challenges.",
    content: "When tackling NP-hard traveling salesman variants or resource allocation problems in competitive programming, standard multi-dimensional matrices quickly break memory bounds. Bitmasking provides an elegant out. By utilizing a single 32-bit integer, we can uniquely store the visited states of up to 32 distinct nodes. Combined with Memoization, this slashes exponential search states into deterministic polynomial execution frames. Our testing inside sandboxed competitive grading routines shows memory footprints dropping by up to 84% while maximizing CPU cache line hits.",
    author: "Thanapat S.",
    date: "May 18, 2026",
    readingTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=800&auto=format&fit=crop",
    tags: ["Algorithms", "TOI2026", "C++"],
    likes: 142,
    views: 1824
  },
  {
    id: 2,
    title: "Phytochemical Reduction Kinetics in Green Nanoparticle Synthesis",
    summary: "Investigating the molecular mechanisms and organic reducing agents hidden inside Tecoma stans leaf extracts that drive clean iron oxide crystalline formulation.",
    content: "Traditional chemical synthesis methods for iron oxide nanoparticles often introduce harmful surfactants and chemical stabilizers into ecological systems. Our current laboratory benchmarks utilize organic leaf extracts from Tecoma stans as high-efficiency reducing matrices. The presence of dense polyphenols and flavonoids facilitates the prompt transition of ferric salts into highly stable crystalline structures at a mild 75°C thermal state. This organic shell not only prevents particle agglomeration but dramatically enhances safe seed-germination metrics when applied to sustainable agricultural matrices.",
    author: "Kornkanok P.",
    date: "April 29, 2026",
    readingTime: "7 min read",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
    tags: ["Nanotechnology", "Biochemistry", "GreenScience"],
    likes: 98,
    views: 1205
  },
  {
    id: 3,
    title: "Anatomy of a Packet Capture: Trace-Mapping Malicious Network Vectors",
    summary: "Breaking down real-time Wireshark capture logs to spot abnormal handshake structures, malicious subnet scans, and stealthy shellcode injection streams.",
    content: "Defending distributed enterprise network nodes requires an intimate familiarity with packet syntax. During recent capture training, we simulated a multi-vector network scan targeting active subnets. By implementing targeted packet filters inside Wireshark and writing custom low-overhead Scapy scripts, we intercepted suspicious TCP sequence variations indicating automated port enumeration loops. Spotting these markers within milliseconds allows defensive engineers to implement dynamic firewall tables, effectively isolating malicious payloads before data corruption sequences can trigger.",
    author: "Nattakit M.",
    date: "April 12, 2026",
    readingTime: "4 min read",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
    tags: ["Cybersecurity", "Networking", "BlueTeam"],
    likes: 115,
    views: 1492
  }
];

export default function Posts() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [likedPosts, setLikedPosts] = useState({}); // Tracks which posts the current user clicked

  // Create Post Form States
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newTags, setNewTags] = useState('');

  // Engagement Logic: Safe immutable increment
  const handleLike = (postId) => {
    const alreadyLiked = likedPosts[postId];
    
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !alreadyLiked
    }));

    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: alreadyLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  // Content Creation Form Submission
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle || !newContent || !newSummary) return;

    const newPostObj = {
      id: Date.now(),
      title: newTitle,
      summary: newSummary,
      content: newContent,
      author: "Admin Editorial",
      date: "Just Now",
      readingTime: `${Math.max(1, Math.ceil(newContent.split(' ').length / 200))} min read`,
      imageUrl: newImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
      tags: newTags ? newTags.split(',').map(t => t.trim()) : ["ATier", "Research"],
      likes: 0,
      views: 1 // Baseline analytics tracker point
    };

    setPosts([newPostObj, ...posts]);
    
    // Clear Input Fields cleanly
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setNewImage('');
    setNewTags('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 py-12 transition-colors duration-200">
      
      {/* Editorial Navigation Headers */}
      <div className="max-w-3xl mx-auto px-4 mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Intelligence Exchange
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            ATier Chronicle
          </h1>
        </div>

        <button 
          onClick={() => setIsAdmin(!isAdmin)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium border text-xs transition-all shadow-sm ${
            isAdmin 
              ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400' 
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{isAdmin ? 'Editor Mode Active' : 'Reader View'}</span>
        </button>
      </div>

      {/* COMPONENT DRAWER: MOCK RICH-TEXT EDITOR WIDGET FOR ADMIN PUBLISHING */}
      {isAdmin && (
        <div className="max-w-3xl mx-auto px-4 mb-12">
          <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-amber-500/30 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
              <Shield className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Compose New Intellectual Asset</h3>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <input 
                type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Core Headline / Research Title..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-base font-semibold focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
              />

              <input 
                type="text" required value={newSummary} onChange={(e) => setNewSummary(e.target.value)}
                placeholder="A concise, high-impact subtitle summary context for the card view..."
                className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-600 dark:text-zinc-400 focus:outline-none focus:border-blue-500"
              />

              {/* Textarea mimicking rich text text entry bounds */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-zinc-950">
                <div className="px-3 py-1.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 flex flex-wrap gap-3 text-xs text-slate-400 font-mono select-none">
                  <span className="font-bold hover:text-slate-600 cursor-pointer">B</span>
                  <span className="italic hover:text-slate-600 cursor-pointer">I</span>
                  <span className="underline hover:text-slate-600 cursor-pointer">U</span>
                  <span className="hover:text-slate-600 cursor-pointer">Quote</span>
                  <span className="hover:text-slate-600 cursor-pointer">Code Block</span>
                </div>
                <textarea 
                  required rows="5" value={newContent} onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Draft the body content of your technical article here..."
                  className="w-full px-4 py-3 bg-transparent text-sm focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative flex items-center">
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input 
                    type="url" value={newImage} onChange={(e) => setNewImage(e.target.value)}
                    placeholder="Cover image Unsplash URL..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <input 
                  type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Tags (comma separated: C++, Research)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow-sm transition-transform active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to Chronicle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CORE CHRONICLE FEED LIST LAYOUT */}
      <div className="max-w-3xl mx-auto px-4 space-y-10">
        {posts.map((post) => {
          const isCurrentPostLiked = likedPosts[post.id];

          return (
            <article 
              key={post.id}
              className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-5"
            >
              {/* Post Meta Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 dark:text-zinc-500 font-medium">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-blue-500" /> {post.author}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                </div>
                <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 rounded-md text-[11px] font-semibold"><Clock className="w-3.5 h-3.5" /> {post.readingTime}</span>
              </div>

              {/* Dynamic Header Typography & Summary */}
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-950 dark:text-zinc-100 tracking-tight leading-tight">
                  {post.title}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 border-l-2 border-blue-500 pl-3 py-0.5">
                  {post.summary}
                </p>
              </div>

              {/* High-Quality Graphic Banner Image Frame */}
              <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800/60">
                <img 
                  src={post.imageUrl} 
                  alt={post.title} 
                  className="w-full h-full object-cover select-none" 
                  loading="lazy"
                />
              </div>

              {/* Formatted Premium Typography Body Section */}
              <p className="text-sm md:text-base text-slate-700 dark:text-zinc-300 font-normal leading-relaxed text-justify tracking-wide">
                {post.content}
              </p>

              {/* Lower Section Metadata Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {post.tags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-500 border border-slate-200/40 dark:border-zinc-800/40"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* INTERACTIVE ENGAGEMENT CONTROLS BLOCK */}
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  {/* Hearts Like Trigger Counter Mechanism */}
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                      isCurrentPostLiked 
                        ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                        : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isCurrentPostLiked ? 'fill-current' : ''}`} />
                    <span className="font-mono">{post.likes}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500 font-medium">
                    <MessageSquare className="w-4 h-4" />
                    <span>Discuss</span>
                  </div>
                </div>

                {/* Simulated Backend Tracker Views Counter Metic Indicator */}
                <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-zinc-500 font-medium font-mono">
                  <div className="flex items-center gap-1" title="Monitored systemic impressions matrix counter">
                    <Eye className="w-4 h-4 text-slate-300 dark:text-zinc-700" />
                    <span>{post.views} views</span>
                  </div>
                  <Share2 className="w-4 h-4 text-slate-300 dark:text-zinc-700 hover:text-slate-500 cursor-pointer transition-colors" />
                </div>
              </div>

            </article>
          );
        })}
      </div>

    </div>
  );
}