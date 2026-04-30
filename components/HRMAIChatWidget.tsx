"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, SendHorizontal, UserCircle2 } from "lucide-react";
import { DACN } from "@/services/DACN/typings";
import { getUserProfile } from "@/services/DACN/auth";
import { buildFullName, safeString, fallbackAvatar } from "./ProfileDropdown";
import { GetResponseFromAI } from "@/services/DACN/AI";
import AnimatedBotMessage from "./AnimatedBotMessage";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  isLoading?: boolean;
  isAnimated?: boolean;
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      <span className="h-1 w-1 animate-bounce rounded-full bg-black [animation-delay:-0.3s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-black [animation-delay:-0.15s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-black" />
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full text-[#18b33e]">
      <Sparkles className="h-8 w-8" strokeWidth={2.5} />
    </div>
  );
}

function UserAvatar({ avatar }: { avatar: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-neutral-300">
      <img src={avatar} alt={"User"} className="w-full h-full object-cover" />
    </div>
  );
}

function WelcomeBlock() {
  return (
    <div className="mt-2 flex flex-col items-center justify-center px-3 text-center">
      <Sparkles className="mb-2 h-7 w-7 text-[#18b33e]" strokeWidth={2.5} />
      <p className="max-w-[360px] text-[13px] leading-4 text-neutral-800 font-medium">
        Xin chào, tôi là trợ lý AI của hệ thống HRM
        <br />
        Bạn cần tôi trợ giúp gì không ?
      </p>
    </div>
  );
}

type ChatWidgetProps = {
  open: boolean;
  onClose: () => void;
};

export default function HRMAIChatWidget({ open, onClose }: ChatWidgetProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [input]);
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);
  const [avatar, setAvatar] = useState<string>("");
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const res = await getUserProfile();
        const fullName = res?.data ? buildFullName(res?.data) : "User";
        const email = safeString(res?.data.email);
        const avatarUrl =
          safeString(res?.data.avatarUrl) ||
          fallbackAvatar(fullName || email || "user");
        setAvatar(avatarUrl);
      } catch (error) {
        console.error("Error while fetching data", error);
      }
    };
    fetchAvatar();
  }, []);
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    const sendMessage: DACN.ChatRequestDto = {
      message: trimmed,
    };
    const loadingMessageId = crypto.randomUUID();
    const loadingMessage: Message = {
      id: loadingMessageId,
      role: "bot",
      content: "",
      isLoading: true,
    };

    const nextMessages = [...messages, userMessage, loadingMessage];

    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
    });
    try {
      const response = await GetResponseFromAI(sendMessage);

      if (response?.status !== 201) {
        throw new Error("Không gọi được API chatbot");
      }

      const data = response?.data;

      const botReply =
        data?.reply || "Xin lỗi, hiện tại tôi chưa thể phản hồi.";

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content: botReply,
                isLoading: false,
                isAnimated: true,
              }
            : msg,
        ),
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content: "Đã có lỗi xảy ra khi kết nối tới chatbot.",
                isLoading: false,
              }
            : msg,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!open) return null;

  return (
    <div
      className="
        fixed bottom-7 right-10 z-[60]
        h-[500px] w-[400px]
        overflow-hidden rounded-[18px]
        border border-[#d9d9d9]
        bg-[#f3f3f3] shadow-2xl
      "
    >
      {/* Header */}
      <div className="flex h-[50px] items-center justify-between bg-[#18b33e] px-3">
        <div className="flex items-center gap-4">
          <Sparkles className="h-7 w-7 text-white" strokeWidth={2.5} />
          <h2 className="text-[15px] font-bold text-white">HRM Bot</h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chatbot"
          className="
            flex h-6 w-6 items-center justify-center rounded-full
            text-white transition hover:bg-white/15
          "
        >
          <X className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>

      {/* Body */}
      <div className="flex h-[calc(100%-50px)] flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
          {messages.length === 0 && <WelcomeBlock />}

          <div className="mt-3 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === "user";

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="flex max-w-[82%] items-center gap-3">
                      <div
                        className="
                          rounded-[16px] rounded-br-[6px]
                          bg-[#d9d9dd] px-3 py-1
                          text-[14px] text-neutral-800 font-medium
                          shadow-sm
                        "
                      >
                        {msg.content}
                      </div>
                      <UserAvatar avatar={avatar} />
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="flex max-w-[82%] items-center gap-3">
                    <BotAvatar />
                    <div
                      className={`
                        rounded-[16px] rounded-bl-[6px] px-3 py-1 text-[14px]
                        shadow-sm text-neutral-800 font-medium
                        ${
                          msg.isLoading
                            ? "min-w-[76px] bg-[#18b33e]"
                            : "bg-[#18b33e] text-black"
                        }
                      `}
                    >
                      {msg.isLoading ? (
                        <TypingDots />
                      ) : msg.isAnimated ? (
                        <AnimatedBotMessage
                          content={msg.content}
                          speed={80}
                          onDone={() => {
                            setMessages((prev) =>
                              prev.map((item) =>
                                item.id === msg.id
                                  ? { ...item, isAnimated: false }
                                  : item,
                              ),
                            );
                          }}
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 border-t border-neutral-200 bg-white px-4 py-2 shadow-sm">
          {/* <div className="flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 shadow-sm"> */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập nội dung..."
            rows={1}
            className="
          flex-1 max-w-full
          resize-none overflow-y-auto bg-transparent
          text-[14px] leading-5 outline-none
          placeholder:text-neutral-400
        "
            style={{ minHeight: "20px", maxHeight: "120px" }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            className="
          flex h-10 w-10 shrink-0 items-center justify-center rounded-full
          bg-[#18b33e] text-white
          transition hover:scale-105 hover:shadow-md
          disabled:cursor-not-allowed disabled:opacity-50
        "
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
          {/* </div> */}
        </div>
      </div>
    </div>
  );
}
