export type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";

export type TicketMessage = {
  id: string;
  from: "user" | "agent";
  author: string;
  content: string;
  createdAt: string; // ISO
};

export type SupportTicket = {
  id: string;
  subject: string;
  user: {
    username: string;
    phone?: string;
  };
  submittedAt: string; // ISO
  status: TicketStatus;
  priority: TicketPriority;
  assignee?: string;
  issue: string;
  messages: TicketMessage[];
};

const STORAGE_KEY = "support_tickets_created_v1";

function safeId(prefix = "t") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return `${prefix}_${(crypto as any).randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readCreatedTickets(): SupportTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SupportTicket[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCreatedTickets(items: SupportTicket[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

const iso = (yyyyMmDd: string, hhmm: string) => `${yyyyMmDd}T${hhmm}:00`;

export type CreateSupportTicketInput = {
  subject: string;
  issue: string;
  username?: string;
  phone?: string;
  priority?: TicketPriority;
};

export const formatTicketStatus = (s: TicketStatus) => {
  if (s === "OPEN") return "Open";
  if (s === "IN_PROGRESS") return "In Progress";
  if (s === "CLOSED") return "Closed";
  return "Deferred";
};

export const statusBadgeVariant = (s: TicketStatus) => {
  if (s === "OPEN") return "secondary" as const;
  if (s === "IN_PROGRESS") return "default" as const;
  if (s === "CLOSED") return "outline" as const;
  return "destructive" as const;
};
