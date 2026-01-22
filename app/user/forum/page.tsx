"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Heart, 
  MessageSquare, 
  Eye, 
  Pin, 
  MoreHorizontal,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  RotateCcw,
  LogOut,
  FileText,
  ToggleRight,
  ToggleLeft
} from "lucide-react";

// --- Types ---
interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  time: string;
  likes: number;
  comments: number;
  views: number;
  isPinned: boolean;
  tags: string[];
}

// --- Mock Data Ban Đầu ---
const initialPosts: Post[] = [
  {
    id: 1,
    title: "Q1 Planning Session",
    content: "Join us for the Q1 planning session next Monday at 2 PM. We will discuss goals, priorities, and resource allocation.",
    author: "Sarah Anderson",
    time: "2 hours ago",
    likes: 21600,
    comments: 231,
    views: 250000,
    isPinned: true,
    tags: ["General"]
  },
  {
    id: 2,
    title: "Hr Updates - New Policy",
    content: "Please review the updated remote work policy attached below. Effective from next month.",
    author: "John Doe",
    time: "5 hours ago",
    likes: 1200,
    comments: 45,
    views: 5000,
    isPinned: false,
    tags: ["HR Updates"]
  }
];

export default function ForumPage() {
  const [view, setView] = useState<"list" | "create">("list");
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  // Hàm xử lý lưu bài viết mới
  const handleSavePost = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]); // Thêm vào đầu danh sách
    setView("list"); // Quay về trang danh sách
  };
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem("forumPosts_admin");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Post[];
      if (Array.isArray(parsed) && parsed.length > 0) setPosts(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem("forumPosts_admin", JSON.stringify(posts));
    } catch {
      // ignore
    }
  }, [posts]);

  return (
    <div className="bg-white min-h-screen p-6 font-sans">
      {view === "list" ? (
        <ForumListView 
          posts={posts} 
          onNavigateCreate={() => setView("create")} 
        />
      ) : (
        <CreateAnnouncementView 
          onBack={() => setView("list")} 
          onSave={handleSavePost}
        />
      )}
    </div>
  );
}

// ============================================================================
// 1. VIEW DANH SÁCH (Giống ảnh 1)
// ============================================================================
function ForumListView({ posts, onNavigateCreate }: { posts: Post[], onNavigateCreate: () => void }) {
  const [activeTab, setActiveTab] = useState("General");
  const tabs = ["General", "HR Updates", "Events"];
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#21252B]">Team Collaboration</h1>
        <p className="text-sm text-gray-500">Connect with your team through chat, updates, and announcements</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              activeTab === tab 
                ? "bg-gray-100 border-gray-300 text-gray-800" 
                : "bg-white border-transparent text-gray-500 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="border border-gray-200 rounded-xl p-6 min-h-[600px] relative flex flex-col">
        <div className="flex justify-end mb-4">
           <span className="text-sm font-semibold text-gray-600">General Announcement</span>
        </div>

        {/* List Posts */}
        <div className="space-y-4 flex-1">
          {posts.map((post) => (
            <div
              key={post.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/admin/forum/${post.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/admin/forum/${post.id}`);
                }
              }}
              className="cursor-pointer border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#0B9F57]/40"
            >
              {/* Green Left Border Accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0B9F57] rounded-l-lg"></div>
              
              <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-800">{post.title}</h3>
                    {post.isPinned && (
                      <span className="flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded border border-gray-200">
                        <Pin size={10} className="fill-current" /> Unpin
                      </span>
                    )}
                    {!post.isPinned && (
                       <span className="flex items-center gap-1 bg-white text-gray-400 text-[10px] px-2 py-0.5 rounded border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Pin size={10} /> Pin
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/admin/forum/${post.id}`}
                    className="text-blue-500 text-xs hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {">> See more"}
                  </Link>
                </div>

                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {post.content}
                </p>

                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-700">By {post.author}</span>
                    <span>{post.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Heart size={12} className="text-red-500 fill-red-500" />
                      <span>{post.likes >= 1000 ? (post.likes/1000).toFixed(1) + 'k' : post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={12} className="text-gray-400" />
                      <span>{post.comments}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye size={14} className="text-gray-800 fill-black" />
                      <span>{post.views >= 1000 ? (post.views/1000).toFixed(0) + 'k' : post.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Button */}
        <div className="flex justify-end mt-6">
          <button 
            onClick={onNavigateCreate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#0B9F57] text-[#0B9F57] rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add new
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. VIEW TẠO BÀI VIẾT (Giống ảnh 2)
// ============================================================================
function CreateAnnouncementView({ onBack, onSave }: { onBack: () => void, onSave: (post: Post) => void }) {
  const [title, setTitle] = useState("");
  // Đây là giả lập Rich Text Content
  const [content, setContent] = useState(""); 
  
  const handleSave = () => {
    if (!title || !content) {
      alert("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    
    // Tạo object bài viết mới
    const newPost: Post = {
      id: Date.now(),
      title: title,
      content: content,
      author: "You (Manager)", // Giả định người dùng hiện tại
      time: "Just now",
      likes: 0,
      comments: 0,
      views: 0,
      isPinned: false,
      tags: ["General"]
    };

    onSave(newPost);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#21252B]">Make Announcement</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Form Editor */}
        <div className="flex-1 space-y-4">
          {/* Language Tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button className="px-4 py-2 text-xs font-semibold text-red-500 border-b-2 border-red-500">Vietnamese</button>
            <button className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700">English</button>
          </div>

          {/* Title Input */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Title (vi) :</label>
            <input 
              type="text" 
              placeholder="Title (vi)" 
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0B9F57]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Rich Text Editor Simulation */}
          <div className="space-y-1">
             <label className="text-xs text-gray-500">Describe (vi) :</label>
             <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-[400px]">
                {/* Toolbar */}
                <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-2 items-center">
                   <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
                      <button className="p-1 hover:bg-gray-200 rounded"><FileText size={14} className="text-gray-600"/></button>
                      <span className="text-xs text-gray-600 font-medium">HTML</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-gray-200 rounded"><Bold size={14} className="text-gray-600"/></button>
                      <button className="p-1 hover:bg-gray-200 rounded"><Italic size={14} className="text-gray-600"/></button>
                      <button className="p-1 hover:bg-gray-200 rounded"><Underline size={14} className="text-gray-600"/></button>
                   </div>
                   <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                   <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-gray-200 rounded"><AlignLeft size={14} className="text-gray-600"/></button>
                      <button className="p-1 hover:bg-gray-200 rounded"><AlignCenter size={14} className="text-gray-600"/></button>
                      <button className="p-1 hover:bg-gray-200 rounded"><AlignRight size={14} className="text-gray-600"/></button>
                      <button className="p-1 hover:bg-gray-200 rounded"><List size={14} className="text-gray-600"/></button>
                   </div>
                   <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                   <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-gray-200 rounded"><ImageIcon size={14} className="text-gray-600"/></button>
                      <button className="p-1 hover:bg-gray-200 rounded"><LinkIcon size={14} className="text-gray-600"/></button>
                   </div>
                </div>
                
                {/* Text Area */}
                <textarea 
                  className="flex-1 p-4 text-sm focus:outline-none resize-none"
                  placeholder="Type your content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
             </div>
          </div>
        </div>

        {/* Right Column: Status/Settings */}
        <div className="w-full lg:w-64 flex flex-col gap-4">
           <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-3 border-b border-gray-100 pb-2">Status</h3>
              
              <div className="flex items-center justify-between mb-4">
                 <span className="text-xs text-gray-600">Outstanding:</span>
                 <button className="text-[#0B9F57]"><ToggleRight size={24} className="fill-current"/></button>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                 <span className="text-xs text-gray-600">Show:</span>
                 <button className="text-[#0B9F57]"><ToggleRight size={24} className="fill-current"/></button>
              </div>

              <div className="flex items-center justify-between">
                 <span className="text-xs text-gray-600">Number:</span>
                 <input type="number" defaultValue={1} className="w-12 border border-gray-200 rounded px-1 py-0.5 text-xs text-center"/>
              </div>
           </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-[#0B9F57] text-white rounded font-semibold text-sm hover:bg-green-700 transition-colors"
        >
          <Save size={16} /> Save
        </button>
        <button className="flex items-center gap-2 px-6 py-2 bg-[#2ECC71] text-white rounded font-semibold text-sm hover:bg-green-500 transition-colors">
          <Save size={16} /> Saved at page
        </button>
        <button 
          onClick={() => { setTitle(""); setContent(""); }}
          className="flex items-center gap-2 px-6 py-2 bg-[#C0392B] text-white rounded font-semibold text-sm hover:bg-red-700 transition-colors"
        >
          <RotateCcw size={16} /> Reset
        </button>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-2 bg-[#E74C3C] text-white rounded font-semibold text-sm hover:bg-red-600 transition-colors"
        >
          <LogOut size={16} /> Exit
        </button>
      </div>
    </div>
  );
}