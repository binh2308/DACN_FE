"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Heart,
  MessageSquare,
  Eye,
  Pin,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  RotateCcw,
  LogOut,
  X,
} from "lucide-react";
import { ImageItem } from "@/lib/utils";
import Switch from "@mui/material/Switch";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  getListAnnouncement,
  createAnnouncement,
  uploadImageForAnnouncement,
} from "@/services/DACN/announcement";
import { notifications } from "@mantine/notifications";
import { DACN } from "@/services/DACN/typings";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const announceSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  content: z.string().min(5, "Content is required").max(500),
  category: z.enum(["GENERAL", "HR", "IT", "SALES", "MARKETING"]),
  pinned: z.boolean(),
});

dayjs.extend(relativeTime);

type AnnounceFormData = z.infer<typeof announceSchema>;

// --- Mock Data Ban Đầu ---
const initialPosts: Post[] = [
  {
    id: 1,
    title: "Q1 Planning Session",
    content:
      "Join us for the Q1 planning session next Monday at 2 PM. We will discuss goals, priorities, and resource allocation.",
    author: "Sarah Anderson",
    time: "2 hours ago",
    likes: 21600,
    comments: 231,
    views: 250000,
    isPinned: true,
    tags: ["General"],
  },
  {
    id: 2,
    title: "Hr Updates - New Policy",
    content:
      "Please review the updated remote work policy attached below. Effective from next month.",
    author: "John Doe",
    time: "5 hours ago",
    likes: 1200,
    comments: 45,
    views: 5000,
    isPinned: false,
    tags: ["HR Updates"],
  },
];

export default function ForumPage() {
  const [view, setView] = useState<"list">("list");
  const [posts, setPosts] = useState<DACN.AnnouncementResponseDto[]>([]);

  // Hàm xử lý lưu bài viết mới
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await getListAnnouncement({
          page: 1,
          pageSize: 20,
        });
        setPosts(res.data?.items);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };

    if (view === "list") {
      fetchAnnouncements();
    }
  }, [view]);

  return (
    <div className="bg-white min-h-screen p-6 font-sans">
      <ForumListView posts={posts} />
    </div>
  );
}

// ============================================================================
// 1. VIEW DANH SÁCH (Giống ảnh 1)
// ============================================================================
function ForumListView({ posts }: { posts: DACN.AnnouncementResponseDto[] }) {
  const [activeTab, setActiveTab] = useState("General");
  const tabs = ["General", "HR Updates", "Events"];
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#21252B]">Team Collaboration</h1>
        <p className="text-sm text-gray-500">
          Connect with your team through chat, updates, and announcements
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
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
          <span className="text-sm font-semibold text-gray-600">
            General Announcement
          </span>
        </div>

        {/* List Posts */}
        <div className="space-y-4 flex-1">
          {posts.map((post) => (
            <div
              key={post.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/user/forum/${post.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/user/forum/${post.id}`);
                }
              }}
              className="cursor-pointer border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#0B9F57]/40"
            >
              {/* Green Left Border Accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0B9F57] rounded-l-lg"></div>

              <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-800">
                      {post.title}
                    </h3>
                    {post.pinned && (
                      <span className="flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded border border-gray-200">
                        <Pin size={10} className="fill-current" /> Unpin
                      </span>
                    )}
                    {!post.pinned && (
                      <span className="flex items-center gap-1 bg-white text-gray-400 text-[10px] px-2 py-0.5 rounded border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Pin size={10} /> Pin
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/user/forum/${post.id}`}
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
                    <span className="font-medium text-gray-700">
                      By {post.employee?.firstName} {post.employee?.middleName}{" "}
                      {post.employee?.lastName}
                    </span>
                    <span>{dayjs(post.created_at).fromNow()}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Heart size={12} className="text-red-500 fill-red-500" />
                      <span>
                        {post.likeCount >= 1000
                          ? (post.likeCount / 1000).toFixed(1) + "k"
                          : post.likeCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={12} className="text-gray-400" />
                      <span>{post.commentCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Button */}
        <div className="flex justify-end mt-6">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#0B9F57] text-[#0B9F57] rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors shadow-sm">
            <Plus size={16} /> Add new
          </button>
        </div>
      </div>
    </div>
  );
}
