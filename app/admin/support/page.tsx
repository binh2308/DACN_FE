"use client";

import * as React from "react";
import Link from "next/link";
import {
	Filter,
	Clock,
	CheckCircle2,
	AlertCircle,
	PauseCircle,
	Ticket,
	MessageSquare,
} from "lucide-react";

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
	getManagementTickets,
	type GetManagementTicketsQuery,
	type ManagementTicketDto,
	type ManagementTicketStatus,
	type TicketSortOrder,
} from "@/services/DACN/Tickets";

type Filters = {
	status: "all" | ManagementTicketStatus;
	sortOrder: TicketSortOrder;
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

const formatDate = (iso: string) => {
	const d = new Date(iso);
	return new Intl.DateTimeFormat("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(d);
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

export default function SupportPage() {
	const [tickets, setTickets] = React.useState<ManagementTicketDto[]>([]);
	const [filters, setFilters] = React.useState<Filters>({
		status: "all",
		sortOrder: "DESC",
	});
	const [page, setPage] = React.useState(1);
	const [limit, setLimit] = React.useState(12);
	const [totalPages, setTotalPages] = React.useState(1);
	const [total, setTotal] = React.useState(0);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		setTickets([]);
		setPage(1);
	}, [filters.status, filters.sortOrder]);

	React.useEffect(() => {
		let cancelled = false;
		async function run() {
			setLoading(true);
			setError(null);
			const query: GetManagementTicketsQuery = {
				status: filters.status === "all" ? undefined : filters.status,
				page,
				limit,
				sort_by: "created_at",
				sort_order: filters.sortOrder,
			};
			try {
				const res: any = await getManagementTickets(query);
				const payload = res?.data ?? res;
				if (cancelled) return;
				const items = Array.isArray(payload?.items) ? payload.items : [];
				setTickets((prev) => (page === 1 ? items : [...prev, ...items]));
				setTotal(Number(payload?.total ?? 0));
				setTotalPages(Number(payload?.total_pages ?? 1));
			} catch (e: any) {
				if (cancelled) return;
				setError(e?.message || "Lỗi không xác định khi tải dữ liệu.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		run();
		return () => {
			cancelled = true;
		};
	}, [filters.status, filters.sortOrder, limit, page]);

	const canLoadMore = page < totalPages;

	return (
		<div className="mx-auto w-full min-h-screen bg-background pb-12">
			<div className="bg-card border-b border-border px-6 py-6 sm:py-8 mb-6">
				<div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
							<MessageSquare className="text-primary" /> Dịch vụ hỗ trợ (Admin)
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Theo dõi và xử lý các yêu cầu hỗ trợ trong hệ thống.
						</p>
					</div>
					<div className="flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-lg ring-1 ring-primary/20">
						<Ticket size={20} />
						<div>
							<div className="text-xs font-semibold uppercase tracking-wider opacity-80">
								Tổng số yêu cầu
							</div>
							<div className="text-lg font-bold leading-none">{total}</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-[1400px] mx-auto px-6">
				<div className="bg-card p-3 rounded-xl shadow-sm ring-1 ring-border mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-3 w-full sm:w-auto">
						<div className="w-full sm:w-[200px]">
							<Select
								value={filters.status}
								onValueChange={(v) =>
									setFilters((p) => ({
										...p,
										status: v as Filters["status"],
									}))
								}
							>
								<SelectTrigger className="bg-muted/30 border-transparent hover:bg-muted/50 transition-colors h-10 text-foreground">
									<SelectValue placeholder="Trạng thái" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Tất cả trạng thái</SelectItem>
									<SelectItem value="OPEN">Chờ xử lý</SelectItem>
									<SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
									<SelectItem value="CLOSED">Đã giải quyết</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="w-full sm:w-[180px]">
							<Select
								value={filters.sortOrder}
								onValueChange={(v) =>
									setFilters((p) => ({
										...p,
										sortOrder: v as Filters["sortOrder"],
									}))
								}
							>
								<SelectTrigger className="bg-muted/30 border-transparent hover:bg-muted/50 transition-colors h-10 text-foreground">
									<SelectValue placeholder="Sắp xếp" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="DESC">Mới nhất trước</SelectItem>
									<SelectItem value="ASC">Cũ nhất trước</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<Button
						variant="outline"
						className="w-full sm:w-auto text-muted-foreground h-10"
					>
						<Filter className="mr-2 h-4 w-4" />
						Lọc nâng cao
					</Button>
				</div>

				{error ? (
					<div className="mb-6 rounded-xl bg-destructive/10 p-4 text-sm text-destructive shadow-sm ring-1 ring-destructive/20 flex items-center justify-between">
						<span>{error}</span>
						<Button
							variant="outline"
							size="sm"
							className="bg-card ring-1 ring-destructive/20 text-destructive hover:bg-destructive/10"
							onClick={() => {
								setTickets([]);
								setPage(1);
							}}
						>
							Thử lại
						</Button>
					</div>
				) : null}

				{tickets.length === 0 && !loading && !error ? (
					<div className="text-center py-20 bg-card rounded-2xl ring-1 ring-border border-dashed">
						<div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
							<CheckCircle2 className="w-8 h-8 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-semibold text-foreground mb-1">
							Không có yêu cầu nào
						</h3>
						<p className="text-muted-foreground text-sm">
							Hiện tại không có ticket nào phù hợp với bộ lọc của bạn.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
						{tickets.map((t) => {
							const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;
							const StatusIcon = statusInfo.icon;
							const employeeName = formatPersonName(t.employee) || "Nhân viên ẩn danh";
							return (
								<Link
									key={t.id}
									href={`/admin/support/${t.id}`}
									className="group flex flex-col bg-card rounded-xl p-5 shadow-sm ring-1 ring-border hover:ring-primary/50 hover:shadow-md transition-all duration-200"
								>
									<div className="flex items-start justify-between mb-4 gap-4">
										<div className="flex items-center gap-3 min-w-0">
											<div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm ring-1 ring-primary/20">
												{getInitials(employeeName)}
											</div>
											<div className="min-w-0">
												<div className="font-semibold text-foreground truncate">
													{employeeName}
												</div>
												<div className="text-xs text-muted-foreground mt-0.5">
													{formatDate(t.created_at)}
												</div>
											</div>
										</div>
										<Badge
											variant="outline"
											className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
										>
											<StatusIcon className="w-3.5 h-3.5" />
											{statusInfo.label}
										</Badge>
									</div>

									<div className="flex-1 min-w-0">
										<div className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
											{t.title}
										</div>
										<p className="text-sm text-muted-foreground line-clamp-2">
											{t.description || "Không có mô tả."}
										</p>
									</div>

									<div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
										<div>
											<span className="font-semibold text-foreground">
												{t.category?.name ?? "-"}
											</span>
											<span className="mx-2">•</span>
											ID: <span className="font-mono">{t.id.slice(0, 8)}...</span>
										</div>
										<span className="font-semibold text-primary">
											Xem chi tiết →
										</span>
									</div>
								</Link>
							);
						})}
					</div>
				)}

				{loading ? (
					<div className="mt-6 text-center text-sm text-muted-foreground">
						Đang tải...
					</div>
				) : null}

				<div className="mt-8 flex justify-center">
					{canLoadMore ? (
						<Button
							variant="outline"
							className="rounded-full"
							onClick={() => setPage((p) => p + 1)}
							disabled={loading}
						>
							Tải thêm
						</Button>
					) : null}
				</div>
			</div>
		</div>
	);
}
