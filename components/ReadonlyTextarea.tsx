"use client";

import React from "react";

type ReadonlyTextareaProps = {
  value?: string | null;
  className?: string;
  readonly?: boolean;
  minRows?: number;
  onChange?: (value: string) => void;
};

export function ReadonlyTextarea({
  value,
  className = "",
  readonly = true,
  minRows = 1,
  onChange,
}: ReadonlyTextareaProps) {
  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  const resize = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  React.useLayoutEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={ref}
      readOnly={readonly}
      rows={minRows}
      value={value ?? "—"}
      onChange={(e) => {
        onChange?.(e.target.value);
      }}
      className={`w-full resize-none overflow-hidden whitespace-pre-wrap rounded-xl border bg-muted/30 p-3 text-sm text-foreground outline-none ${className}`}
    />
  );
}
