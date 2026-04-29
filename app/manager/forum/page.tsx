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
  ChevronRight,
  ChevronLeft,
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
  togglePinnedAnnouncement,
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
import { Center, Loader } from "@mantine/core";

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
  category: z.enum(["GENERAL", "HR", "EVENTS"]),
  pinned: z.boolean(),
});

dayjs.extend(relativeTime);

type AnnounceFormData = z.infer<typeof announceSchema>;

// --- Mock Data Ban Đầu ---

export default function ForumPage() {
  const [view, setView] = useState<"list" | "create">("list");
  const [posts, setPosts] = useState<DACN.AnnouncementResponseDto[]>([]);
  const [totalPage, setTotalPage] = useState<number>(0);
  // Hàm xử lý lưu bài viết mới
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await getListAnnouncement({
          page: 1,
          pageSize: 20,
        });
        setPosts(res.data?.items);
        setTotalPage(Math.ceil(res.data?.items.length / 4));
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };

    if (view === "list") {
      fetchAnnouncements();
    }
  }, [view, posts]);

  return (
    <div className="bg-white min-h-screen p-6 font-sans">
      {view === "list" ? (
        <ForumListView
          posts={posts}
          totalPage={totalPage}
          setPosts={setPosts}
          setView={setView}
          onNavigateCreate={() => setView("create")}
        />
      ) : (
        <CreateAnnouncementView onBack={() => setView("list")} />
      )}
    </div>
  );
}

// ============================================================================
// 1. VIEW DANH SÁCH (Giống ảnh 1)
// ============================================================================
function ForumListView({
  posts,
  totalPage,
  setPosts,
  onNavigateCreate,
  setView,
}: {
  posts: DACN.AnnouncementResponseDto[];
  totalPage: number;
  setPosts: React.Dispatch<
    React.SetStateAction<DACN.AnnouncementResponseDto[]>
  >;
  onNavigateCreate: () => void;
  setView: (view: "list" | "create") => void;
}) {
  const [activeTab, setActiveTab] = useState("General");
  const tabs = ["General", "HR Updates", "Events"];
  const [currentPage, setCurrentPage] = useState<number>(0);
  const router = useRouter();
  const handleTogglePin = async (id: string) => {
    try {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === id ? { ...post, pinned: !post.pinned } : post,
        ),
      );
      await togglePinnedAnnouncement(id);
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

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
        <div className="ml-auto">
          <Button
            type="button"
            className="h-9 text-xs"
            onClick={() => setView("create")}
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo bài viết
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="border border-gray-200 rounded-xl p-6 min-h-[600px] relative flex flex-col">
        <div className="flex justify-end mb-4">
          <span className="text-sm font-semibold text-gray-600">
            General Announcement
          </span>
        </div>

        {posts.length === 0 && (
          <Center style={{ height: "50vh" }}>
            <Loader color="green" />
          </Center>
        )}
        {/* List Posts */}
        <div className="space-y-4 flex-1">
          {posts.length > 0 &&
            posts.slice(currentPage * 4, currentPage * 4 + 4).map((post) => (
              <div
                key={post.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/manager/forum/${post.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/manager/forum/${post.id}`);
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
                        <span
                          className="flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded border border-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(post?.id);
                          }}
                        >
                          <Pin size={10} className="fill-current" /> Unpin
                        </span>
                      )}
                      {!post.pinned && (
                        <span
                          className="flex items-center gap-1 bg-white text-gray-400 text-[10px] px-2 py-0.5 rounded border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(post?.id);
                          }}
                        >
                          <Pin size={10} /> Pin
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/manager/forum/${post.id}`}
                      className="text-blue-500 text-xs hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
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
                        By {post.employee?.firstName}{" "}
                        {post.employee?.middleName} {post.employee?.lastName}
                      </span>
                      <span>{dayjs(post.created_at).fromNow()}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart
                          size={12}
                          className="text-red-500 fill-red-500"
                        />
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
        {posts.length > 0 && (
          <div className="flex justify-center gap-3">
            <ChevronLeft
              className="cursor-pointer hover:shadow-md"
              onClick={() => {
                if (currentPage > 0) setCurrentPage(currentPage - 1);
              }}
            />
            <span>
              {currentPage + 1} / {totalPage}
            </span>
            <ChevronRight
              className="cursor-pointer hover:shadow-md"
              onClick={() => {
                if (currentPage < totalPage - 1)
                  setCurrentPage(currentPage + 1);
              }}
            />
          </div>
        )}
        {/* Add New Button */}
      </div>
    </div>
  );
}

// ============================================================================
// 2. VIEW TẠO BÀI VIẾT (Giống ảnh 2)
// ============================================================================
function CreateAnnouncementView({ onBack }: { onBack: () => void }) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const fileInputRef = useRef(null);

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AnnounceFormData>({
    resolver: zodResolver(announceSchema),
    defaultValues: {
      category: "GENERAL",
      pinned: false,
    },
  });

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSelectImages = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    const newImages = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);

    // reset input để có thể chọn lại đúng file cũ nếu cần
    e.target.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleUploadImages = async (announcementId: string) => {
    try {
      for (const image of images) {
        await uploadImageForAnnouncement(announcementId, image);
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi upload ảnh");
    }
  };

  const onSubmit = async (data: AnnounceFormData) => {
    const newAnnouncement: DACN.AnnouncementCreateDto = {
      ...data,
    };
    try {
      await createAnnouncement(newAnnouncement)
        .then((res) => {
          const createdId = res.data.id;
          handleUploadImages(createdId);
        })
        .then(() => {
          notifications.show({
            title: "Success",
            message: "Tạo thông báo thành công",
            color: "green",
          });
          reset();
          setImages([]);
        });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Có lỗi khi tạo thông báo",
        color: "red",
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit, (errors) => console.log(errors))}>
        <h1 className="text-xl font-bold text-[#21252B]">
          Create Announcement
        </h1>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col lg:flex-row gap-6">
          {/* Left Column: Form Editor */}
          <div className="flex-1 space-y-4">
            {/* Title Input */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Title"
                {...register("title")}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0B9F57]"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Rich Text Editor Simulation */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">
                Content <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-[400px]">
                {/* Toolbar */}
                <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleOpenFilePicker}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <ImageIcon size={14} className="text-gray-600" />
                    </button>

                    <button
                      type="button"
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <LinkIcon size={14} className="text-gray-600" />
                    </button>
                  </div>

                  {/* input file ẩn */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleSelectImages}
                  />
                </div>

                {/* Nội dung */}
                <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                  {/* Preview ảnh */}
                  {images.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {images.map((img) => (
                        <div
                          key={img.id}
                          className="relative shrink-0 w-24 h-24 rounded-md overflow-hidden border border-gray-200 bg-gray-100"
                        >
                          <img
                            src={img.preview}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img.id)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Textarea */}
                  <textarea
                    className="flex-1 text-sm focus:outline-none resize-none"
                    placeholder="Type your content here..."
                    {...register("content")}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-500">
                      {errors.content.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Status/Settings */}
          <div className="w-full lg:w-64 flex flex-col gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 mb-3 border-b border-gray-100 pb-2">
                Status
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  Category <span className="text-red-500">*</span>
                </span>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-1/2 h-7 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">Chung</SelectItem>
                        <SelectItem value="HR">HR Updates</SelectItem>
                        <SelectItem value="EVENTS">Events</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-600">Pin:</span>
                <Switch
                  color="success"
                  onChange={(e) => setValue("pinned", e.target.checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-[#0B9F57] text-white rounded font-semibold text-sm hover:bg-green-700 transition-colors"
          >
            <Save size={16} /> Create Announcement
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-[#2ECC71] text-white rounded font-semibold text-sm hover:bg-green-500 transition-colors">
            <Save size={16} /> Saved at page
          </button>
          <button
            onClick={() => reset()}
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
      </form>
    </div>
  );
}
