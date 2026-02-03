export type TicketStatus = "open" | "in_progress" | "resolved" | "deferred";
export type TicketPriority = "low" | "medium" | "high" | "highest";

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

const iso = (yyyyMmDd: string, hhmm: string) => `${yyyyMmDd}T${hhmm}:00`;

export const supportTickets: SupportTicket[] = [
	{
		id: "1234",
		subject: "Password reset not working",
		user: { username: "brentrodriguez", phone: "999-999-999" },
		submittedAt: iso("2022-11-14", "08:00"),
		status: "in_progress",
		priority: "highest",
		assignee: "Deanna Jones",
		issue:
			"Hi, I can't seem to update the app. It says \"Error checking updates\" when I tried to update the app via Google Play. Pls help.",
		messages: [
			{
				id: "m1",
				from: "agent",
				author: "Deanna Jones",
				content: "Have you tried turning your phone off and on again?",
				createdAt: iso("2022-11-14", "20:00"),
			},
			{
				id: "m2",
				from: "user",
				author: "brentrodriguez",
				content: "This is user message",
				createdAt: iso("2022-11-14", "20:00"),
			},
		],
	},
	{
		id: "1288",
		subject: "My app is very buggy",
		user: { username: "karen_22", phone: "888-222-111" },
		submittedAt: iso("2022-11-22", "10:30"),
		status: "open",
		priority: "high",
		assignee: undefined,
		issue: "App crash when opening dashboard. Happens on iOS 16.",
		messages: [],
	},
	{
		id: "1301",
		subject: "Cannot login after update",
		user: { username: "minhtran", phone: "090-111-222" },
		submittedAt: iso("2022-12-01", "14:05"),
		status: "open",
		priority: "highest",
		assignee: undefined,
		issue:
			"After updating, my session expires instantly. I cannot stay logged in.",
		messages: [],
	},
	{
		id: "1307",
		subject: "Export report is empty",
		user: { username: "ngocanh", phone: "090-333-444" },
		submittedAt: iso("2022-12-03", "09:20"),
		status: "open",
		priority: "medium",
		assignee: "Deanna Jones",
		issue: "Downloaded CSV is empty although UI shows records.",
		messages: [],
	},
	{
		id: "1310",
		subject: "Timesheet submission failed",
		user: { username: "alex", phone: "777-111-999" },
		submittedAt: iso("2022-12-05", "18:45"),
		status: "deferred",
		priority: "low",
		assignee: "Support",
		issue: "Submitting timesheet returns 500 error.",
		messages: [],
	},
	{
		id: "1316",
		subject: "My app is very buggy",
		user: { username: "sara", phone: "123-456-789" },
		submittedAt: iso("2022-12-08", "11:12"),
		status: "open",
		priority: "highest",
		assignee: undefined,
		issue: "UI flickers on Android when switching tabs.",
		messages: [],
	},
];

export const getTicketById = (id: string) =>
	supportTickets.find((t) => t.id === id);

export const formatTicketStatus = (s: TicketStatus) => {
	if (s === "open") return "OPEN";
	if (s === "in_progress") return "In Progress";
	if (s === "resolved") return "Resolved";
	return "Deferred";
};

export const formatPriority = (p: TicketPriority) => {
	if (p === "highest") return "Highest";
	if (p === "high") return "High";
	if (p === "medium") return "Medium";
	return "Low";
};

export const statusBadgeVariant = (s: TicketStatus) => {
	if (s === "open") return "secondary" as const;
	if (s === "in_progress") return "default" as const;
	if (s === "resolved") return "outline" as const;
	return "destructive" as const;
};
