"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DACN } from "@/services/DACN/typings";
import {
  getAnnouncementById,
  toggleLikeAnnouncement,
  addCommentToAnnouncement,
} from "@/services/DACN/announcement";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Send,
  Smile,
  Paperclip,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { relative } from "path";

type ForumPost = {
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
};

type PostDetail = {
  id: number;
  title: string;
  author: string;
  body: string[];
  images: string[];
};

type Comment = {
  id: string;
  author: string;
  time: string;
  content: string;
  avatarText: string;
  replies?: Comment[];
};

dayjs.extend(relativeTime);

const DETAIL_PRESETS: Record<number, PostDetail> = {
  1: {
    id: 1,
    title: "Q1 PLANNING SESSION",
    author: "Sarah Anderson",
    body: [
      "Dear Colleagues,",
      "",
      "As we approach the end of the current quarter, our focus must now shift to positioning our company for a strong, successful, and aligned start to the new year.",
      "",
      "To achieve this, we are pleased to officially announce our company-wide Q1 Planning Session.",
      "",
      "This mandatory session is a critical opportunity for us to come together, synchronize our efforts, and establish a clear roadmap for the months ahead.",
      "",
      "Event Details",
      "Event: Q1 Planning Session",
      "Date: Next Monday, [Insert Specific Date, e.g., January 8th]",
      "Time: 2:00 PM – 4:00 PM (Please block this 2-hour window in your calendars)",
      "",
      "Your participation, insights, and feedback are essential as we map out this next chapter. Let's work together to make Q1 our most successful quarter yet.",
      "",
      "We look forward to seeing you all there.",
      "",
      "Best regards,",
    ],
    images: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
      //"https://images.unsplash.com/photo-1505691723518-36a5ac3b2f6a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80",
    ],
  },
};

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function Avatar({ text }: { text: string }) {
  return (
    <div className="h-9 w-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-semibold">
      {text}
    </div>
  );
}

function CommentItem({ item, depth = 0 }: { item: any; depth?: number }) {
  return (
    <div className={depth > 0 ? "ml-10 mt-3" : ""}>
      <div className="flex gap-3">
        <Avatar text={item.avatarText} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 leading-tight">
                {item.employee?.firstName} {item.employee?.middleName}{" "}
                {item.employee?.lastName}
              </div>
              <div className="text-[11px] text-gray-500">
                {dayjs(item.created_at).fromNow()}
              </div>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600"
              aria-label="More"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-800">{item.comment}</div>
        </div>
      </div>

      {item.replies?.length ? (
        <div className="mt-2">
          {item.replies.map((r) => (
            <CommentItem key={r.id} item={r} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ForumDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();

  const [detailPost, setDetailPost] =
    React.useState<DACN.AnnouncementResponseDto | null>(null);
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState<number>(0);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [addingComment, setAddingComment] = React.useState(false);
  React.useEffect(() => {
    if (params == null) return;
    const fetchData = async () => {
      try {
        const res = await getAnnouncementById(String(params.id));
        setDetailPost(res?.data ?? null);
        setLiked(res?.data?.likedByMe ?? false);
      } catch (error) {
        console.error("Error fetching announcement:", error);
      }
    };

    fetchData();
  }, [addingComment]);

  const handleToggleLike = async () => {
    const likedData = !liked;
    if (liked === true) {
      setLiked(likedData);
      setLikeCount(likeCount - 1);
    } else {
      setLiked(likedData);
      setLikeCount(likeCount + 1);
    }
    await toggleLikeAnnouncement(String(params?.id));
  };

  const onSubmitComment = async () => {
    setAddingComment(true);
    await addCommentToAnnouncement(String(params?.id), commentDraft);
    setCommentDraft("");
    setAddingComment(false);
  };

  if (!detailPost) {
    return (
      <div className="bg-white min-h-screen p-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              onClick={() => router.push("/admin/forum")}
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-sm font-semibold text-gray-800">
              Announcement
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-8">
            <div className="text-sm text-gray-600">Đang tải bài viết…</div>
          </div>
        </div>
      </div>
    );
  }

  // if (!detailPost || params?.id === null) {
  //   return (
  //     <div className="bg-white min-h-screen p-6">
  //       <div className="max-w-[1100px] mx-auto">
  //         <div className="flex items-center gap-3 mb-6">
  //           <button
  //             className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
  //             onClick={() => router.push("/admin/forum")}
  //             aria-label="Back"
  //           >
  //             <ArrowLeft size={18} />
  //           </button>
  //           <div className="text-sm font-semibold text-gray-800">
  //             Announcement
  //           </div>
  //         </div>

  //         <div className="rounded-xl border border-gray-200 p-8">
  //           <div className="text-lg font-semibold text-gray-900">
  //             Không tìm thấy bài viết
  //           </div>
  //           <div className="mt-2 text-sm text-gray-600">
  //             Vui lòng quay lại danh sách.
  //           </div>
  //           <div className="mt-5">
  //             <Link
  //               href="/admin/forum"
  //               className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
  //             >
  //               Quay lại
  //             </Link>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="bg-white min-h-screen p-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              onClick={() => router.push("/admin/forum")}
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-sm font-semibold text-gray-800">
              Announcement
            </div>
          </div>

          <button
            className="text-gray-400 hover:text-gray-600"
            aria-label="More"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
            <div>
              <div className="text-xl font-bold tracking-wide text-gray-900">
                {detailPost?.title}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                By{" "}
                <span className="font-medium text-gray-700">
                  {detailPost?.employee?.firstName}{" "}
                  {detailPost?.employee?.middleName}{" "}
                  {detailPost?.employee?.lastName}
                </span>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-7 text-gray-800">
                {detailPost?.content}
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-3">
                {detailPost?.image_urls?.slice(0, 4).map((src, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <img
                      src={src}
                      alt={`event image ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 h-px bg-gray-200" />

          <div className="mt-4 flex items-center gap-10 text-sm text-gray-600">
            <button
              type="button"
              className="inline-flex items-center gap-2 hover:text-gray-900"
              onClick={handleToggleLike}
            >
              <Heart
                size={18}
                className={
                  liked ? "text-red-500 fill-red-500" : "text-gray-500"
                }
              />
              <span>Like</span>
              <span className="text-gray-400">{formatCount(likeCount)}</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 hover:text-gray-900"
              onClick={() => {
                const el = document.getElementById("comment-box");
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              <MessageSquare size={18} className="text-gray-500" />
              <span>comment</span>
              <span className="text-gray-400">
                {formatCount(detailPost?.commentCount as number)}
              </span>
            </button>
          </div>

          <div className="mt-4 h-px bg-gray-200" />

          <div className="mt-5 space-y-5">
            {detailPost?.comments?.map((c) => (
              <CommentItem key={c.id} item={c} />
            ))}

            <div id="comment-box" className="mt-4">
              <div className="flex gap-3">
                <Avatar text="YA" />
                <div className="min-w-0 flex-1">
                  <div className="rounded-xl border border-gray-200 bg-gray-50">
                    <textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      placeholder="Viết bình luận…"
                      className="w-full bg-transparent p-4 text-sm outline-none resize-none min-h-[80px]"
                    />
                    <div className="flex items-center justify-between px-3 pb-3">
                      <div className="flex items-center gap-2 text-gray-500">
                        <button
                          className="h-8 w-8 rounded-full hover:bg-white flex items-center justify-center"
                          type="button"
                          aria-label="Emoji"
                        >
                          <Smile size={18} />
                        </button>
                        <button
                          className="h-8 w-8 rounded-full hover:bg-white flex items-center justify-center"
                          type="button"
                          aria-label="Attach"
                        >
                          <Paperclip size={18} />
                        </button>
                      </div>
                      <button
                        className="h-8 w-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                        type="button"
                        aria-label="Send"
                        onClick={onSubmitComment}
                      >
                        <Send size={18} className="text-gray-700" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
