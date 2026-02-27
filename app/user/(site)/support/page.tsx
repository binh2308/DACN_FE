"use client";

import * as React from "react";
import Link from "next/link";
import { Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	formatPriority,
	formatTicketStatus,
	supportTickets,
	statusBadgeVariant,
	type TicketPriority,
	type TicketStatus,
} from "@/lib/support/tickets";

type Filters = {
	status: "all" | TicketStatus;
	priority: "all" | TicketPriority;
};

const formatDate = (iso: string) => {
	const d = new Date(iso);
	return d.toLocaleDateString(undefined, {
		month: "short",
		day: "2-digit",
		year: "numeric",
	});
};

export default function SupportPage() {
	const [filters, setFilters] = React.useState<Filters>({
		status: "all",
		priority: "all",
	});
	const [limit, setLimit] = React.useState(6);

	const filtered = React.useMemo(() => {
		return supportTickets.filter((t) => {
			if (filters.status !== "all" && t.status !== filters.status) return false;
			if (filters.priority !== "all" && t.priority !== filters.priority)
				return false;
			return true;
		});
	}, [filters]);

	const visible = filtered.slice(0, limit);

	return (
		<div className="mx-auto w-full max-w-[1400px] px-6 py-6">
			<div className="mb-5 flex items-center justify-between gap-4">
				<div className="text-sm text-muted-foreground">
					Total: <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
					Tickets
				</div>

				<div className="flex items-center gap-2">
					<Button variant="outline" className="rounded-full" type="button">
						<Filter className="mr-2 h-4 w-4" />
						Filter
					</Button>
				</div>
			</div>

			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="w-full sm:w-[220px]">
					<Select
						value={filters.status}
						onValueChange={(v) =>
							setFilters((p) => ({ ...p, status: v as Filters["status"] }))
						}
					>
						<SelectTrigger className="bg-white">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All status</SelectItem>
							<SelectItem value="open">Open</SelectItem>
							<SelectItem value="in_progress">In Progress</SelectItem>
							<SelectItem value="resolved">Resolved</SelectItem>
							<SelectItem value="deferred">Deferred</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="w-full sm:w-[220px]">
					<Select
						value={filters.priority}
						onValueChange={(v) =>
							setFilters((p) => ({ ...p, priority: v as Filters["priority"] }))
						}
					>
						<SelectTrigger className="bg-white">
							<SelectValue placeholder="Priority" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All priority</SelectItem>
							<SelectItem value="highest">Highest</SelectItem>
							<SelectItem value="high">High</SelectItem>
							<SelectItem value="medium">Medium</SelectItem>
							<SelectItem value="low">Low</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
				{visible.map((t) => (
					<Link
						key={t.id}
						href={`/manager/support/${t.id}`}
						className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="flex items-center gap-3">
								<div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
									<span className="text-sm font-bold">S</span>
								</div>
								<div className="text-sm font-semibold text-foreground">
									{t.subject}
								</div>
							</div>
							<Badge variant={statusBadgeVariant(t.status)} className="rounded-full">
								{formatTicketStatus(t.status)}
							</Badge>
						</div>

						<div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
							<div>
								<div className="text-muted-foreground">User</div>
								<div className="mt-1 font-semibold text-foreground">
									{t.user.username}
								</div>
							</div>
							<div>
								<div className="text-muted-foreground">Submitted</div>
								<div className="mt-1 font-semibold text-foreground">
									{formatDate(t.submittedAt)}
								</div>
							</div>
							<div>
								<div className="text-muted-foreground">Priority</div>
								<div className="mt-1 font-semibold text-foreground">
									{formatPriority(t.priority)}
								</div>
							</div>
							<div>
								<div className="text-muted-foreground">Ticket ID</div>
								<div className="mt-1 font-semibold text-foreground">{t.id}</div>
							</div>
						</div>
					</Link>
				))}
			</div>

			<div className="mt-8 flex justify-center">
				{limit < filtered.length ? (
					<Button
						variant="outline"
						className="rounded-full"
						onClick={() => setLimit((x) => x + 6)}
					>
						Load More
					</Button>
				) : null}
			</div>
		</div>
	);
}
