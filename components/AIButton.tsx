"use client";

import { Sparkles } from "lucide-react";
import HRMAIChatWidget from "./HRMAIChatWidget";
import { useState } from "react";

export default function FloatingAIButton() {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        aria-label="AI Assistant"
        onClick={handleClick}
        hidden={open}
        className="
        fixed bottom-6 right-10 z-50
        flex h-14 w-14 items-center justify-center
        rounded-full bg-[#22c55e] text-white
        shadow-lg
        cursor-pointer
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:scale-110
        hover:shadow-2xl
        active:scale-95
      "
      >
        <Sparkles className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <HRMAIChatWidget open={open} onClose={() => setOpen(false)} />
    </>
  );
}
