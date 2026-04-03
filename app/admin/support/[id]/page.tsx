"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRequest } from "ahooks";
import { useToast } from "@/hooks/use-toast";
import {
	ChevronLeft,
	Clock,
	CheckCircle2,
	AlertCircle,
	PauseCircle,
	UserCircle2,
	Tag,
	Hash,
	CalendarDays,
	MessageSquareText,
	Activity,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import {
	getManagementTicketById,
	getManagementTicketProcesses,
	updateManagementTicketStatus,
	type ManagementTicketDto,
	type ManagementTicketStatus,
	type TicketProcessDto,
} from "@/services/DACN/Tickets";

const formatDateTime = (iso: string) => {
	const d = new Date(iso);
	return new Intl.DateTimeFormat("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(d);
};

const STATUS_CONFIG: Record<
	ManagementTicketStatus,
	{ label: string; color: string; icon: React.ElementType }
> = {
	OPEN: {
		label: "Chờ xử lý",
		color: "bg-amber-50 text-amber-700 border-amber-200",
		icon: AlertCircle,
	},
	IN_PROGRESS: {
		label: "Đang xử lý",
		color: "bg-blue-50 text-blue-700 border-blue-200",
		icon: Clock,
	},
	RESOLVED: {
		label: "Đã giải quyết",
		color: "bg-emerald-50 text-emerald-700 border-emerald-200",
		icon: CheckCircle2,
	},
	DEFERRED: {
		label: "Tạm hoãn",
		color: "bg-gray-50 text-gray-600 border-gray-200",
		icon: PauseCircle,
	},
};

const getInitials = (name?: string) => {
	if (!name) return "NV";
	const parts = name.trim().split(" ");
	if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatPersonName = (person: any) => {
	if (!person) return "";
	const direct = String(person?.name ?? "").trim();
	if (direct) return direct;
	const parts = [person?.lastName, person?.middleName, person?.firstName]
		.map((p: any) => String(p ?? "").trim())
		.filter(Boolean);
	if (parts.length) return parts.join(" ");
	return String(person?.email ?? "").trim();
};

const normalizeTicketStatus = (status: unknown): ManagementTicketStatus => {
	const raw = String(status ?? "").trim();
	if (!raw) return "OPEN";
	const normalized = raw
		.toUpperCase()
		.replace(/\s+/g, "_")
		.replace(/-+/g, "_")
		.replace(/__+/g, "_");

	if (normalized === "INPROGRESS") return "IN_PROGRESS";
	if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
	if (normalized === "OPEN") return "OPEN";
	if (normalized === "RESOLVED") return "RESOLVED";
	if (normalized === "DEFERRED") return "DEFERRED";

	return "OPEN";
};

function normalizeProcessesResponse(raw: any): {
	processes: TicketProcessDto[];
	total: number;
} {
	if (!raw) return { processes: [], total: 0 };
	if (raw?.data && Array.isArray(raw.data.processes)) {
		return {
			processes: raw.data.processes as TicketProcessDto[],
			total: Number(raw.data.total_activities ?? raw.data.processes.length ?? 0),
		};
	}
	if (Array.isArray(raw?.processes)) {
		return {
			processes: raw.processes as TicketProcessDto[],
			total: Number(raw.total_activities ?? raw.processes.length ?? 0),
		};
	}
	if (Array.isArray(raw)) return { processes: raw as TicketProcessDto[], total: raw.length };
	return { processes: [], total: 0 };
}

export default function TicketDetailPage() {
	const { toast } = useToast();
	const router = useRouter();
	const params = useParams<{ id: string | string[] }>();
	const ticketId = React.useMemo(() => {
		if (!params) return null;
		const id = params.id;
		return Array.isArray(id) ? id[0] : id;
	}, [params]);

	const {
		data: ticket,
		loading,
		error,
		refreshAsync: refreshTicket,
		mutate: mutateTicket,
	} = useRequest(
		async () => {
			if (!ticketId) return null;
			const res: any = await getManagementTicketById(ticketId);
			return (res?.data ?? res) as ManagementTicketDto;
		},
		{ refreshDeps: [ticketId] },
	);

	const {
		data: processesRaw,
		loading: processesLoading,
		error: processesError,
		refreshAsync: refreshProcesses,
	} = useRequest(
		async () => {
			if (!ticketId) return null;
			return await getManagementTicketProcesses(ticketId);
		},
		{ refreshDeps: [ticketId] },
	);

	const processesInfo = React.useMemo(
		() => normalizeProcessesResponse(processesRaw),
		[processesRaw],
	);
	const processes = React.useMemo(() => {
		const fromApi = processesInfo.processes;
		if (fromApi.length) return fromApi;
		return ticket?.processes ?? [];
	}, [processesInfo.processes, ticket?.processes]);

	const [approveNote, setApproveNote] = React.useState<string>(
		"Started working on this ticket",
	);

	const { runAsync: runApprove, loading: approving } = useRequest(
		async (note: string) => {
			if (!ticketId) throw new Error("Missing ticket id");
			return await updateManagementTicketStatus(ticketId, {
				status: "IN_PROGRESS",
				note: note.trim() ? note.trim() : undefined,
			});
		},
		{ manual: true },
	);

	if (!ticketId) return null;

	if (loading && !ticket) {
		return (
			<div className="mx-auto w-full max-w-[1400px] px-6 py-12 flex flex-col items-center justify-center">
				<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
				<div className="text-sm font-semibold text-muted-foreground">
					Đang tải thông tin chi tiết...
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="mx-auto w-full max-w-[1400px] px-6 py-6">
				<div className="rounded-xl bg-background p-6 shadow-sm ring-1 ring-border text-center max-w-md mx-auto mt-10">
					<AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-foreground mb-2">
						Không thể tải dữ liệu
					</h3>
					<p className="text-sm text-muted-foreground mb-6">
						{(error as any)?.message ||
							"Đã có lỗi xảy ra. Vui lòng thử lại sau."}
					</p>
					<div className="flex gap-3 justify-center">
						<Button variant="outline" onClick={() => router.back()}>
							Quay lại
						</Button>
						<Button onClick={() => refreshTicket()}>
							Thử lại
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (!ticket) return null;

	const normalizedTicketStatus = normalizeTicketStatus(ticket.status);
	const statusInfo = STATUS_CONFIG[normalizedTicketStatus] || STATUS_CONFIG.OPEN;
	const StatusIcon = statusInfo.icon;
	const employeeName = formatPersonName(ticket.employee) || "Người dùng ẩn danh";

	return (
		<div className="mx-auto w-full max-w-[1400px] px-6 py-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button variant="ghost" className="h-9 px-2" onClick={() => router.back()}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Link href="/admin/support" className="text-sm font-semibold text-foreground">
						Ticket Details
					</Link>
				</div>
				<Badge
					variant="outline"
					className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
				>
					<StatusIcon className="w-3.5 h-3.5" />
					{statusInfo.label}
				</Badge>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] items-start">
				<div className="space-y-6">
					<Card className="shadow-sm">
						<CardContent className="p-6 md:p-8">
							<div className="flex items-start gap-5 mb-6 pb-6 border-b border-border">
								<div className="shrink-0 h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg ring-1 ring-primary/20">
									{getInitials(employeeName)}
								</div>
								<div className="min-w-0">
									<h1 className="text-xl font-semibold text-foreground mb-1 leading-tight">
										{ticket.title}
									</h1>
									<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
										<span className="font-semibold text-foreground flex items-center gap-1.5">
											<UserCircle2 className="w-4 h-4 text-muted-foreground" />
											{employeeName}
										</span>
										<span className="flex items-center gap-1.5">
											<CalendarDays className="w-4 h-4 text-muted-foreground" />
											{ticket.created_at ? formatDateTime(ticket.created_at) : "-"}
										</span>
									</div>
								</div>
							</div>

							<div className="mt-5 flex gap-4 rounded-xl bg-muted/20 p-5 text-sm text-foreground ring-1 ring-border relative">
								<div className="absolute top-0 left-8 -translate-y-full w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-muted/20"></div>
								<div className="min-w-0 flex-1">
									<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
										<MessageSquareText className="w-4 h-4" /> Mô tả chi tiết
									</div>
									<div className="leading-relaxed">
										{ticket.description || (
											<span className="italic text-muted-foreground">
												Không có mô tả chi tiết.
											</span>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-sm">
						<CardContent className="p-6 md:p-8">
							<h3 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
								<Activity className="w-4 h-4 text-primary" /> Lịch sử xử lý
							</h3>
							{processesLoading ? (
								<div className="mb-4 text-xs text-muted-foreground">
									Đang tải timeline...
								</div>
							) : null}
							{processes && processes.length > 0 ? (
								<div className="space-y-0 relative before:absolute before:inset-0 before:ml-[1.125rem] md:before:ml-28 before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
									{processes.map((p, index) => {
										const actorName = formatPersonName(p.actor);
										const isSystem = !actorName;
										const isLast = index === processes.length - 1;
										const itemStatus = normalizeTicketStatus(
											(p.status ?? p.to_status ?? ticket.status) as any,
										);
										const itemStatusInfo =
											STATUS_CONFIG[itemStatus] || STATUS_CONFIG.OPEN;

										return (
											<div
												key={p.id}
												className={`relative flex items-start gap-4 ${
													!isLast ? "pb-8" : ""
												} group`}
											>
												<div className="hidden md:block w-24 text-right shrink-0 mt-1">
													<div className="text-xs font-semibold text-foreground">
														{new Date(p.created_at).toLocaleDateString(
															"en-US",
															{
																month: "short",
																day: "2-digit",
																year: "numeric",
															},
														)}
													</div>
													<div className="text-xs text-muted-foreground mt-0.5">
														{new Date(p.created_at).toLocaleTimeString(
															"en-US",
															{
																hour: "2-digit",
																minute: "2-digit",
																hour12: false,
															},
														)}
													</div>
												</div>

												<div className="relative z-10 w-9 h-9 rounded-full bg-background ring-4 ring-background border border-border flex items-center justify-center shrink-0 group-hover:border-primary transition-colors">
													{isSystem ? (
														<div className="w-2.5 h-2.5 rounded-full bg-muted-foreground"></div>
													) : (
														<div className="w-full h-full rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
															{getInitials(actorName)}
														</div>
													)}
												</div>

												<div className="flex-1 min-w-0">
													<div className="md:hidden text-xs text-muted-foreground mb-1">
														{formatDateTime(p.created_at)}
													</div>
													<div
														className={`p-4 rounded-xl ring-1 ${
															isSystem
																? "bg-background ring-border"
																: "bg-primary/5 ring-primary/20"
														}`}
													>
														<div className="flex items-start justify-between gap-3 mb-1">
															<div className="text-sm font-semibold text-foreground">
																{actorName || "Hệ thống tự động"}
															</div>
															<Badge
																variant="outline"
																className={`shrink-0 rounded-full text-[10px] px-2 py-0.5 border ${itemStatusInfo.color}`}
															>
																{itemStatusInfo.label}
															</Badge>
														</div>
														<div className="text-sm text-foreground">
															<span>{p.type}</span>
															{p.note && (
																<span className="mt-2 block pl-3 border-l-2 border-border text-muted-foreground italic">
																	"{p.note}"
																</span>
															)}
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-center py-8 text-sm text-muted-foreground italic bg-muted/20 rounded-xl ring-1 ring-border border-dashed">
									Chưa có cập nhật nào cho yêu cầu này.
								</div>
							)}

							{processesError ? (
								<div className="mt-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive ring-1 ring-destructive/20">
									Không thể tải timeline: {(processesError as any)?.message ||
										"Lỗi không xác định"}
								</div>
							) : null}
						</CardContent>
					</Card>
				</div>

				<aside className="space-y-4">
					<Card className="shadow-sm sticky top-6">
						<CardContent className="space-y-6 p-6">
							{normalizedTicketStatus === "OPEN" ? (
								<div className="space-y-3">
									<div className="text-sm font-semibold text-foreground">
										Duyệt yêu cầu
									</div>
									<div className="text-xs text-muted-foreground">
										Chuyển trạng thái từ "Chờ xử lý" sang "Đang xử lý".
									</div>
									<Textarea
										value={approveNote}
										onChange={(e) => setApproveNote(e.target.value)}
										placeholder='Ghi chú (ví dụ: "Started working on this ticket")'
										className="min-h-[72px]"
									/>
									<Button
										className="w-full"
										disabled={approving}
										onClick={async () => {
											try {
												await runApprove(approveNote);
												mutateTicket((prev) => {
													if (!prev) return prev;
													return { ...prev, status: "IN_PROGRESS" };
												});
												toast({
													title: "Duyệt thành công",
													description:
														"Ticket đã chuyển sang trạng thái Đang xử lý.",
												});
												await Promise.all([
													refreshTicket(),
													refreshProcesses(),
												]);
											} catch (e: any) {
												toast({
													variant: "destructive",
													title: "Không thể duyệt ticket",
													description: e?.message || "Đã có lỗi xảy ra.",
												});
											}
										}}
									>
										{approving ? "Đang duyệt..." : "Duyệt"}
									</Button>
								</div>
							) : null}

							<div>
								<div className="text-sm font-semibold text-foreground">
									Assignee
								</div>
								<div className="mt-3 flex items-center gap-3 text-sm">
									{ticket.assignee ? (
										<>
											<div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 ring-1 ring-primary/20">
												{getInitials(formatPersonName(ticket.assignee) || undefined)}
											</div>
											<div className="min-w-0">
												<div className="font-semibold text-foreground truncate">
													{formatPersonName(ticket.assignee)}
												</div>
												<div className="text-xs text-muted-foreground truncate">
													{ticket.assignee.email ?? ""}
												</div>
											</div>
										</>
									) : (
										<div className="text-muted-foreground italic flex items-center gap-2">
											<UserCircle2 className="h-4 w-4" /> Chưa có người nhận xử lý
										</div>
									)}
								</div>
								<div className="mt-2 text-xs text-muted-foreground">
									Admin không có thao tác gán ticket tại đây.
								</div>
							</div>

							<div>
								<div className="text-sm font-semibold text-foreground">
									Category
								</div>
								<div className="mt-2 flex items-center gap-2">
									<Tag className="w-4 h-4 text-muted-foreground" />
									<span className="text-sm font-semibold text-foreground">
										{ticket.category?.name ?? "-"}
									</span>
								</div>
							</div>

							<div>
								<div className="text-sm font-semibold text-foreground">
									Ticket ID
								</div>
								<div className="mt-2 flex items-center gap-2">
									<Hash className="w-4 h-4 text-muted-foreground" />
									<span className="text-xs font-mono text-muted-foreground break-all">
										{ticket.id}
									</span>
								</div>
							</div>

							<div>
								<div className="text-sm font-semibold text-foreground">
									Last updated
								</div>
								<div className="mt-2 flex items-center gap-2">
									<Clock className="w-4 h-4 text-muted-foreground" />
									<span className="text-sm font-semibold text-foreground">
										{ticket.updated_at ? formatDateTime(ticket.updated_at) : "-"}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</aside>
			</div>
		</div>
	);
}
