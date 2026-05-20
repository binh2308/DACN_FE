import { MessageSquareText } from "lucide-react";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-10 text-center">
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-muted">
        <MessageSquareText className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}
