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
	ChevronRight,
	UserCircle2
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

// --- CẤU HÌNH GIAO DIỆN TRẠNG THÁI (Giữ nguyên màu Badge để nổi bật) ---
const STATUS_CONFIG: Record<ManagementTicketStatus, { label: string; color: string; icon: React.ElementType }> = {
	OPEN: { 
		label: "Chờ xử lý", 
		color: "bg-amber-50 text-amber-700 border-amber-200", 
		icon: AlertCircle 
	},
	IN_PROGRESS: { 
		label: "Đang xử lý", 
		color: "bg-blue-50 text-blue-700 border-blue-200", 
		icon: Clock 
	},
	RESOLVED: { 
		label: "Đã giải quyết", 
		color: "bg-emerald-50 text-emerald-700 border-emerald-200", 
		icon: CheckCircle2 
	},
	DEFERRED: { 
		label: "Tạm hoãn", 
		color: "bg-gray-50 text-gray-600 border-gray-200", 
		icon: PauseCircle 
	},
};

// --- HELPER FUNCTIONS ---
const formatDate = (iso: string) => {
	const d = new Date(iso);
	return new Intl.DateTimeFormat("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	}).format(d);
};

const getInitials = (name?: string) => {
	if (!name) return "NV";
	const parts = name.trim().split(" ");
	if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
			
			{/* HEADER */}
			<div className="bg-card border-b border-border px-6 py-6 sm:py-8 mb-6">
				<div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
							<MessageSquare className="text-primary" /> Quản lý Yêu cầu hỗ trợ
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Theo dõi và xử lý các yêu cầu hỗ trợ gửi đến phòng ban của bạn.
						</p>
					</div>
					<div className="flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-lg ring-1 ring-primary/20">
						<Ticket size={20} />
						<div>
							<div className="text-xs font-semibold uppercase tracking-wider opacity-80">Tổng số yêu cầu</div>
							<div className="text-lg font-bold leading-none">{total}</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-[1400px] mx-auto px-6">
				
				{/* TOOLBAR BỘ LỌC */}
				<div className="bg-card p-3 rounded-xl shadow-sm ring-1 ring-border mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-3 w-full sm:w-auto">
						<div className="w-full sm:w-[200px]">
							<Select
								value={filters.status}
								onValueChange={(v) => setFilters((p) => ({ ...p, status: v as Filters["status"] }))}
							>
								<SelectTrigger className="bg-muted/30 border-transparent hover:bg-muted/50 transition-colors h-10 text-foreground">
									<SelectValue placeholder="Trạng thái" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Tất cả trạng thái</SelectItem>
									<SelectItem value="OPEN">Chờ xử lý</SelectItem>
									<SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
									<SelectItem value="RESOLVED">Đã giải quyết</SelectItem>
									<SelectItem value="DEFERRED">Tạm hoãn</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="w-full sm:w-[180px]">
							<Select
								value={filters.sortOrder}
								onValueChange={(v) => setFilters((p) => ({ ...p, sortOrder: v as Filters["sortOrder"] }))}
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
					
					<Button variant="outline" className="w-full sm:w-auto text-muted-foreground h-10">
						<Filter className="mr-2 h-4 w-4" />
						Lọc nâng cao
					</Button>
				</div>

				{/* THÔNG BÁO LỖI */}
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

				{/* GRID DANH SÁCH YÊU CẦU */}
				{tickets.length === 0 && !loading && !error ? (
					<div className="text-center py-20 bg-card rounded-2xl ring-1 ring-border border-dashed">
						<div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
							<CheckCircle2 className="w-8 h-8 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-semibold text-foreground mb-1">Không có yêu cầu nào</h3>
						<p className="text-muted-foreground text-sm">Hiện tại không có ticket nào phù hợp với bộ lọc của bạn.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
						{tickets.map((t) => {
							const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;
							const StatusIcon = statusInfo.icon;

							return (
								<Link
									key={t.id}
									href={`/manager/support/${t.id}`}
									className="group flex flex-col bg-card rounded-xl p-5 shadow-sm ring-1 ring-border hover:ring-primary/50 hover:shadow-md transition-all duration-200"
								>
									{/* Top: Avatar & Date */}
									<div className="flex items-start justify-between mb-4 gap-4">
										<div className="flex items-center gap-3 min-w-0">
											<div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm ring-1 ring-primary/20">
												{getInitials(t.employee?.name)}
											</div>
											<div className="min-w-0">
												<div className="font-semibold text-foreground truncate">
													{t.employee?.name ?? "Nhân viên ẩn danh"}
												</div>
												<div className="text-xs text-muted-foreground mt-0.5">
													{formatDate(t.created_at)}
												</div>
											</div>
										</div>
										<Badge variant="outline" className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
											<StatusIcon className="w-3.5 h-3.5" />
											{statusInfo.label}
										</Badge>
									</div>

									{/* Middle: Title & Category */}
									<div className="flex-1 mb-5">
										<h3 className="font-semibold text-foreground text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
											{t.title}
										</h3>
										{t.category?.name && (
											<span className="inline-block mt-3 text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-md">
												{t.category.name}
											</span>
										)}
									</div>

									{/* Bottom: ID & Action */}
									<div className="flex items-center justify-between pt-4 border-t border-border">
										<div className="text-[11px] text-muted-foreground font-mono">
											ID: {t.id.split('-')[0]}...
										</div>
										<div className="text-sm font-semibold text-primary flex items-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
											Xem chi tiết <ChevronRight className="w-4 h-4 ml-0.5" />
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				)}

				{/* TẢI THÊM (LOADING MORE) */}
				<div className="mt-10 flex justify-center pb-8">
					{loading ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold bg-card px-4 py-2 rounded-full shadow-sm ring-1 ring-border">
							<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
							Đang tải dữ liệu...
						</div>
					) : canLoadMore ? (
						<Button
							variant="outline"
							className="rounded-full px-8 bg-card ring-1 ring-border text-foreground hover:bg-muted shadow-sm"
							onClick={() => setPage((p) => p + 1)}
						>
							Tải thêm yêu cầu
						</Button>
					) : tickets.length > 0 ? (
						<div className="text-sm text-muted-foreground">Đã hiển thị toàn bộ yêu cầu.</div>
					) : null}
				</div>

			</div>
		</div>
	);
}