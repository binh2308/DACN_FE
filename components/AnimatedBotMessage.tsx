"use client";

import { useEffect, useMemo, useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

type AnimatedBotMessageProps = {
  content: string;
  speed?: number;
  onDone?: () => void;
};

export default function AnimatedBotMessage({
  content,
  speed = 80,
  onDone,
}: AnimatedBotMessageProps) {
  const tokens = useMemo(() => content.match(/\S+\s*/g) ?? [], [content]);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);

    if (!tokens.length) {
      onDone?.();
      return;
    }

    const timer = setInterval(() => {
      setVisibleCount((prev) => {
        const next = prev + 1;

        if (next >= tokens.length) {
          clearInterval(timer);
          onDone?.();
          return tokens.length;
        }

        return next;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [tokens, speed, onDone]);

  return (
    <span className="whitespace-pre-wrap">
      <MarkdownRenderer content={tokens.slice(0, visibleCount).join("")} />
    </span>
  );
}
