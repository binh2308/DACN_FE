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
	Trash2,
	X,
	Plus,
	GripVertical,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getDepartments,
	createDepartment,
	deleteDepartment,
} from "@/services/DACN/department";
import { type DepartmentDto } from "@/services/DACN/employee";
import {
	createManagementTicketCategory,
	deleteManagementTicketCategory,
	getManagementTickets,
	getManagementTicketCategories,
	assignManagementTicketCategoriesToDepartment,
	unassignManagementTicketCategoryFromDepartment,
	type GetManagementTicketsQuery,
	type ManagementTicketCategoryDto,
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
	const { toast } = useToast();

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

	// --- Department & Category States ---
	const [departments, setDepartments] = React.useState<DepartmentDto[]>([]);
	const [departmentsLoading, setDepartmentsLoading] = React.useState(false);
	
	const [categories, setCategories] = React.useState<ManagementTicketCategoryDto[]>([]);
	const [categoriesLoading, setCategoriesLoading] = React.useState(false);

	// Creation States
	const [createCategoryName, setCreateCategoryName] = React.useState<string>("");
	const [createCategoryDescription, setCreateCategoryDescription] = React.useState<string>("");
	const [createDeptName, setCreateDeptName] = React.useState<string>("");
	const [creatingCategory, setCreatingCategory] = React.useState(false);
	const [creatingDepartment, setCreatingDepartment] = React.useState(false);

	// Mapping UI States
	const containerRef = React.useRef<HTMLDivElement>(null);
	const [nodePositions, setNodePositions] = React.useState<Record<string, { x: number; y: number }>>({});
	const [dragState, setDragState] = React.useState<{ sourceId: string; currentX: number; currentY: number } | null>(null);

	// --- 1. Fetching Data ---
	const normalizeDepartments = React.useCallback((raw: any) => {
		const payload = raw?.data ?? raw;
		if (Array.isArray(payload)) return payload as DepartmentDto[];
		if (Array.isArray(payload?.data)) return payload.data as DepartmentDto[];
		return [] as DepartmentDto[];
	}, []);

	const normalizeCategories = React.useCallback((raw: any) => {
		const payload = raw?.data ?? raw;
		if (Array.isArray(payload)) return payload as ManagementTicketCategoryDto[];
		if (Array.isArray(payload?.data)) return payload.data as ManagementTicketCategoryDto[];
		return [] as ManagementTicketCategoryDto[];
	}, []);

	const fetchAllData = React.useCallback(async () => {
		setDepartmentsLoading(true);
		setCategoriesLoading(true);
		try {
			const [deptRes, catRes] = await Promise.all([
				getDepartments(),
				getManagementTicketCategories({}) // Lấy tất cả categories
			]);
			setDepartments(normalizeDepartments(deptRes));
			setCategories(normalizeCategories(catRes));
		} catch (e: any) {
			toast({ variant: "destructive", title: "Lỗi tải dữ liệu sơ đồ", description: e?.message });
		} finally {
			setDepartmentsLoading(false);
			setCategoriesLoading(false);
		}
	}, [normalizeDepartments, normalizeCategories, toast]);

	React.useEffect(() => {
		fetchAllData();
	}, [fetchAllData]);

	// --- 2. Add / Delete Actions ---
	const handleCreateCategory = async () => {
		const name = createCategoryName.trim();
		if (!name || creatingCategory) return;
		setCreatingCategory(true);
		try {
			await createManagementTicketCategory({
				name,
				description: createCategoryDescription.trim(), 
			});
			toast({ title: "Tạo Category thành công", description: name });
			setCreateCategoryName("");
			setCreateCategoryDescription("");
			await fetchAllData(); 
		} catch (e: any) {
			toast({ variant: "destructive", title: "Lỗi", description: e?.message || "Không thể tạo category" });
		} finally {
			setCreatingCategory(false);
		}
	};

	const handleDeleteCategory = async (id: string) => {
		if (!confirm("Bạn có chắc chắn muốn xoá Category này?")) return;
		try {
			await deleteManagementTicketCategory(id);
			toast({ title: "Đã xoá Category" });
			setCategories(prev => prev.filter(c => c.id !== id));
		} catch (e: any) {
			toast({ variant: "destructive", title: "Lỗi", description: e?.message || "Không thể xoá" });
		}
	};

	const handleCreateDepartment = async () => {
		const name = createDeptName.trim();
		if (!name || creatingDepartment) return;
		setCreatingDepartment(true);
		try {
			await createDepartment({ name });
			toast({ title: "Thêm phòng ban thành công", description: name });
			setCreateDeptName("");
			await fetchAllData();
		} catch (e: any) {
			toast({
				variant: "destructive",
				title: "Lỗi",
				description: e?.message || "Không thể thêm phòng ban",
			});
		} finally {
			setCreatingDepartment(false);
		}
	};

	const handleDeleteDepartment = async (id: string) => {
		const deptName = departments.find((d) => d.id === id)?.name;
		if (
			!confirm(
				`Bạn có chắc chắn muốn xoá phòng ban${deptName ? `: ${deptName}` : ""}?`,
			)
		)
			return;
		try {
			await deleteDepartment(id);
			toast({ title: "Đã xoá phòng ban", description: deptName });
			await fetchAllData();
		} catch (e: any) {
			toast({
				variant: "destructive",
				title: "Lỗi",
				description: e?.message || "Không thể xoá phòng ban",
			});
		}
	};

	// --- 3. Mapping Interactions (Kéo thả nối dây) ---
	const updatePositions = React.useCallback(() => {
		if (!containerRef.current) return;
		const containerRect = containerRef.current.getBoundingClientRect();
		const newPos: Record<string, { x: number; y: number }> = {};

		const nodes = containerRef.current.querySelectorAll('[data-node-id]');
		nodes.forEach(node => {
			const rect = node.getBoundingClientRect();
			const id = node.getAttribute('data-node-id') as string;
			const type = node.getAttribute('data-node-type');

			// Tính toán vị trí của "chấm kết nối" tương đối so với container
			if (type === 'category') {
				// Chấm ở bên phải thẻ Category
				newPos[id] = {
					x: rect.right - containerRect.left,
					y: rect.top - containerRect.top + rect.height / 2
				};
			} else {
				// Chấm ở bên trái thẻ Department
				newPos[id] = {
					x: rect.left - containerRect.left,
					y: rect.top - containerRect.top + rect.height / 2
				};
			}
		});
		setNodePositions(newPos);
	}, []);

	// Cập nhật toạ độ khi data thay đổi hoặc resize cửa sổ
	React.useEffect(() => {
		const timer = setTimeout(updatePositions, 100); // Đợi render xong
		window.addEventListener('resize', updatePositions);
		return () => {
			clearTimeout(timer);
			window.removeEventListener('resize', updatePositions);
		};
	}, [categories, departments, updatePositions]);

	// Xử lý sự kiện kéo chuột
	const handleMouseMove = React.useCallback((e: MouseEvent) => {
		if (!dragState || !containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		setDragState(prev => prev ? {
			...prev,
			currentX: e.clientX - rect.left,
			currentY: e.clientY - rect.top
		} : null);
	}, [dragState]);

	const handleMouseUp = React.useCallback(() => {
		if (dragState) setDragState(null);
	}, [dragState]);

	React.useEffect(() => {
		if (dragState) {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
		}
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [dragState, handleMouseMove, handleMouseUp]);

	const startDrag = (e: React.MouseEvent, catId: string) => {
		e.preventDefault();
		if (!containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		setDragState({
			sourceId: catId,
			currentX: e.clientX - rect.left,
			currentY: e.clientY - rect.top
		});
	};

	const handleDropOnDepartment = async (deptId: string) => {
		if (!dragState) return;
		const catId = dragState.sourceId;
		setDragState(null);

		const targetDept = departments.find((d) => d.id === deptId);
		if (!targetDept) return;

		const currentCategoryIds = categories
			.filter((c) => c.departments?.some((d) => d.id === deptId))
			.map((c) => c.id);

		if (currentCategoryIds.includes(catId)) {
			toast({ title: "Category đã được gán", description: targetDept.name });
			return;
		}

		const nextCategoryIds = Array.from(
			new Set([...currentCategoryIds, catId].filter(Boolean)),
		);

		try {
			await assignManagementTicketCategoriesToDepartment(deptId, {
				category_ids: nextCategoryIds,
			});
			toast({ title: "Đã phân công", description: targetDept.name });
			await fetchAllData();
		} catch (e: any) {
			toast({
				variant: "destructive",
				title: "Không thể phân công",
				description: e?.message || "Vui lòng thử lại.",
			});
		}
	};

	const handleUnlink = async (catId: string, deptId: string) => {
		const deptName = departments.find((d) => d.id === deptId)?.name;
		try {
			await unassignManagementTicketCategoryFromDepartment(deptId, catId);
			toast({ title: "Đã huỷ phân công", description: deptName });
			await fetchAllData();
		} catch (e: any) {
			toast({
				variant: "destructive",
				title: "Không thể huỷ phân công",
				description: e?.message || "Vui lòng thử lại.",
			});
		}
	};

	// Vẽ đường cong Bezier
	const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
		const offset = Math.max(Math.abs(x2 - x1) * 0.5, 40);
		return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
	};

	// Chuẩn bị danh sách các đường nối hiện có
	const activeLinks = React.useMemo(() => {
		const links: { catId: string; deptId: string }[] = [];
		categories.forEach(c => {
			c.departments?.forEach(d => {
				links.push({ catId: c.id, deptId: d.id });
			});
		});
		return links;
	}, [categories]);


	// --- 4. Fetching Tickets ---
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
			{/* --- HEADER --- */}
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
				
				{/* --- VISUAL MAPPING SECTION --- */}
				<div className="bg-card p-6 rounded-xl shadow-sm ring-1 ring-border mb-8 overflow-hidden">
					<div className="flex flex-col gap-1 mb-6">
						<h2 className="text-lg font-semibold text-foreground">
							Sơ đồ Phân công Hỗ trợ
						</h2>
						<p className="text-sm text-muted-foreground">
							Kéo thả từ Category sang Phòng ban để thiết lập luồng xử lý.
						</p>
					</div>

					{/* Form Thêm mới */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 pb-8 border-b border-border">
						{/* Add Category */}
						<div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border/50">
							<div className="text-sm font-semibold text-foreground flex items-center gap-2">
								<Plus size={16} className="text-primary"/> Thêm Category mới
							</div>
							<Input
								value={createCategoryName}
								onChange={(e) => setCreateCategoryName(e.target.value)}
								placeholder="Tên category (VD: Xin cấp thiết bị)"
								className="h-10 bg-background"
							/>
							<Textarea
								value={createCategoryDescription}
								onChange={(e) => setCreateCategoryDescription(e.target.value)}
								placeholder="Mô tả chi tiết"
								className="min-h-[80px] bg-background"
							/>
							<Button
								type="button"
								onClick={handleCreateCategory}
								disabled={creatingCategory || !createCategoryName.trim()}
								className="w-full"
							>
								{creatingCategory ? "Đang tạo..." : "Tạo Category"}
							</Button>
						</div>

						{/* Add Department */}
						<div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border/50">
							<div className="text-sm font-semibold text-foreground flex items-center gap-2">
								<Plus size={16} className="text-primary"/> Thêm Phòng ban mới
							</div>
							<Input
								value={createDeptName}
								onChange={(e) => setCreateDeptName(e.target.value)}
								placeholder="Tên phòng ban (VD: Phòng IT)"
								className="h-10 bg-background"
							/>
							<p className="text-xs text-muted-foreground">
								Tạo nhanh phòng ban để cấu hình luồng ticket.
							</p>
							<Button
								type="button"
								// variant="secondary"
								onClick={handleCreateDepartment}
								disabled={creatingDepartment || !createDeptName.trim()}
								className="w-full"
							>
								{creatingDepartment ? "Đang thêm..." : "Thêm Phòng ban"}
							</Button>
						</div>
					</div>

					{/* Vùng Vẽ Sơ Đồ */}
					<div 
						className="relative min-h-[400px] flex justify-between gap-10 lg:gap-32 p-4 bg-muted/10 rounded-xl border border-dashed border-border"
						ref={containerRef}
					>
						{/* SVG Dây nối - Chỉ dùng để vẽ đường cong trực quan */}
						<svg className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible">
							<defs>
								<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
									<polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
								</marker>
							</defs>
							
							{/* Vẽ các liên kết đã có */}
							{activeLinks.map(link => {
								const pos1 = nodePositions[`cat-${link.catId}`];
								const pos2 = nodePositions[`dept-${link.deptId}`];
								if (!pos1 || !pos2) return null;
								return (
									<path 
										key={`${link.catId}-${link.deptId}`}
										d={drawLine(pos1.x, pos1.y, pos2.x, pos2.y)} 
										stroke="hsl(var(--primary))" 
										strokeOpacity="0.3"
										strokeWidth="2.5" 
										fill="none" 
										markerEnd="url(#arrowhead)"
										className="transition-all duration-300"
									/>
								);
							})}

							{/* Vẽ dây đang kéo */}
							{dragState && nodePositions[`cat-${dragState.sourceId}`] && (
								<path 
									d={drawLine(
										nodePositions[`cat-${dragState.sourceId}`].x, 
										nodePositions[`cat-${dragState.sourceId}`].y, 
										dragState.currentX, 
										dragState.currentY
									)} 
									stroke="hsl(var(--primary))" 
									strokeDasharray="6,6" 
									strokeWidth="3" 
									fill="none" 
								/>
							)}
						</svg>

						{/* Cột Trái: Categories */}
						<div className="w-1/2 max-w-[320px] flex flex-col gap-4 z-10">
							<h3 className="text-sm font-bold text-foreground text-center uppercase tracking-widest opacity-60 mb-2">
								Loại Yêu Cầu (Category)
							</h3>
							{categoriesLoading && <p className="text-sm text-muted-foreground text-center">Đang tải...</p>}
							{categories.map((c) => (
								<div 
									key={c.id}
									data-node-id={`cat-${c.id}`}
									data-node-type="category"
									className="relative bg-background rounded-xl p-4 shadow-sm ring-1 ring-border hover:ring-primary/50 transition-all flex flex-col"
								>
									<div className="flex justify-between items-start mb-2">
										<div className="font-semibold text-foreground truncate pr-2">{c.name}</div>
										<button onClick={() => handleDeleteCategory(c.id)} className="text-muted-foreground hover:text-destructive shrink-0">
											<Trash2 size={16} />
										</button>
									</div>
									<div className="text-xs text-muted-foreground line-clamp-2">{c.description || "Chưa có mô tả"}</div>
									
									{/* HIỂN THỊ PHÒNG BAN ĐÃ GÁN BẰNG BADGE DỄ XÓA */}
									{c.departments && c.departments.length > 0 && (
										<div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-1.5">
											{c.departments.map(dept => (
												<div 
													key={dept.id} 
													className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary"
												>
													<span className="truncate max-w-[120px]">{dept.name}</span>
													<button
														type="button"
														onClick={(e) => { e.stopPropagation(); handleUnlink(c.id, dept.id); }}
														className="hover:bg-primary/20 hover:text-destructive rounded-full p-0.5 transition-colors"
														title={`Hủy gán phòng ban: ${dept.name}`}
													>
														<X size={10} />
													</button>
												</div>
											))}
										</div>
									)}

									{/* Điểm Neo (Connector) */}
									<div 
										className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background ring-2 ring-primary rounded-full flex items-center justify-center cursor-grab hover:scale-110 hover:bg-primary/10 transition-transform shadow-md"
										onMouseDown={(e) => startDrag(e, c.id)}
										title="Kéo để gán vào phòng ban"
									>
										<div className="w-2.5 h-2.5 bg-primary rounded-full pointer-events-none" />
									</div>
								</div>
							))}
						</div>

						{/* Cột Phải: Departments */}
						<div className="w-1/2 max-w-[320px] flex flex-col gap-4 z-10">
							<h3 className="text-sm font-bold text-foreground text-center uppercase tracking-widest opacity-60 mb-2">
								Phòng Ban Xử Lý
							</h3>
							{departmentsLoading && <p className="text-sm text-muted-foreground text-center">Đang tải...</p>}
							{departments.map((d) => (
								<div 
									key={d.id}
									data-node-id={`dept-${d.id}`}
									data-node-type="department"
									onMouseUp={() => handleDropOnDepartment(d.id)}
									className={`relative bg-background rounded-xl p-4 shadow-sm ring-1 transition-all flex items-center justify-between
										${dragState ? 'ring-primary border-dashed ring-2 bg-primary/5' : 'ring-border'}
									`}
								>
									<div className="font-semibold text-foreground truncate pr-2">{d.name}</div>
									<button onClick={() => handleDeleteDepartment(d.id)} className="text-muted-foreground hover:text-destructive shrink-0">
										<Trash2 size={16} />
									</button>

									{/* Điểm Nhận (Dropzone Connector) */}
									<div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background ring-2 ring-primary rounded-full flex items-center justify-center shadow-md">
										<div className={`w-2.5 h-2.5 rounded-full transition-colors ${dragState ? 'bg-primary animate-pulse' : 'bg-primary'}`} />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* --- TICKET LIST SECTION --- */}
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
						<Filter className="mr-2 h-4 w-4" /> Lọc nâng cao
					</Button>
				</div>

				{error ? (
					<div className="mb-6 rounded-xl bg-destructive/10 p-4 text-sm text-destructive shadow-sm ring-1 ring-destructive/20 flex items-center justify-between">
						<span>{error}</span>
						<Button
							variant="outline"
							size="sm"
							className="bg-card ring-1 ring-destructive/20 text-destructive hover:bg-destructive/10"
							onClick={() => { setTickets([]); setPage(1); }}
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