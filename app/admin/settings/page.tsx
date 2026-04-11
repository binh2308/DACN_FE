"use client";

import * as React from "react";
import {
	CalendarDays,
	Check,
	History,
	Lock,
	Plus,
	Clock,
	CalendarCheck,
	Palmtree,
	Calculator
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- TYPES ---
type GeneralConfig = {
	workTimeStart: string;
	workTimeEnd: string;
	workDays: string[];
};

type Role = {
	id: string;
	name: string;
	userCount: number;
	mainPermissions: string; // Dùng để hiển thị tóm tắt ngoài bảng
	permissions: Record<string, string[]>; // Lưu trữ ma trận quyền thực tế
	locked?: boolean;
};

type Policies = {
	bookingMaxHours: number;
	bookingRequireApproval: boolean;
	leaveAnnualDays: number;
	leaveRequireMedicalProof: boolean;
	attendanceCutoffDay: number;
};

const STORAGE_GENERAL = "admin_settings_general";
const STORAGE_ROLES = "admin_settings_roles";
const STORAGE_POLICIES = "admin_settings_policies";

const WEEKDAYS = [
	{ id: "MON", label: "Thứ 2" },
	{ id: "TUE", label: "Thứ 3" },
	{ id: "WED", label: "Thứ 4" },
	{ id: "THU", label: "Thứ 5" },
	{ id: "FRI", label: "Thứ 6" },
	{ id: "SAT", label: "Thứ 7" },
	{ id: "SUN", label: "Chủ nhật" },
];

// --- CẤU HÌNH MA TRẬN QUYỀN (PERMISSION MATRIX) ---
const PERMISSION_MODULES = [
	{
		id: "booking",
		name: "Module Đặt phòng",
		actions: [
			{ id: "view_list", label: "Xem danh sách" },
			{ id: "create", label: "Đặt phòng" },
			{ id: "delete", label: "Hủy đặt phòng" },
			{ id: "view_booked", label: "Xem phòng đã đặt" },
		],
	},
	{
		id: "employee",
		name: "Module Nhân sự",
		actions: [
			{ id: "view", label: "Xem hồ sơ" },
			{ id: "create", label: "Thêm nhân viên" },
			{ id: "update", label: "Sửa thông tin nhân viên" },
		],
	},
	{
		id: "asset",
		name: "Module Tài sản",
		actions: [
			{ id: "view", label: "Xem danh sách" },
			{ id: "create", label: "Cấp phát" },
			{ id: "update", label: "Sửa/Thu hồi" },
		],
	},
];

// --- HELPERS ---
function safeId(prefix = "id") {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return `${prefix}_${(crypto as any).randomUUID()}`;
	}
	return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readJson<T>(key: string, fallback: T): T {
	if (typeof window === "undefined") return fallback;
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

function writeJson<T>(key: string, value: T) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// ignore
	}
}

function summarizePermissions(perms: Record<string, string[]>) {
	if (!perms) return "Chưa phân quyền";
	const parts = [];
	if (perms.booking?.length) parts.push("Đặt phòng");
	if (perms.employee?.length) parts.push("Nhân sự");
	if (perms.asset?.length) parts.push("Tài sản");
	if (parts.length === 0) return "Chưa phân quyền";
	return parts.join(", ");
}

function mergePermissions(
	a: Record<string, string[]> | undefined,
	b: Record<string, string[]> | undefined,
) {
	const merged: Record<string, string[]> = {};
	const allKeys = new Set([...(a ? Object.keys(a) : []), ...(b ? Object.keys(b) : [])]);
	for (const key of allKeys) {
		const values = new Set<string>([...(a?.[key] ?? []), ...(b?.[key] ?? [])]);
		merged[key] = Array.from(values);
	}
	return merged;
}

const DEFAULT_MANAGER_PERMISSIONS: Record<string, string[]> = {
	employee: ["view", "create", "update"],
	asset: ["view", "create", "update"],
};

function normalizeRoles(input: Role[]) {
	// Migrate legacy setups: gộp Asset Manager + HR Manager thành 1 role "Manager"
	const roles = Array.isArray(input) ? [...input] : [];

	const isHrManager = (r: Role) => r.id === "hr_manager" || r.name.toLowerCase().includes("hr manager");
	const isAssetManager = (r: Role) =>
		r.id === "asset_manager" || r.name.toLowerCase().includes("asset manager");
	const isManager = (r: Role) => r.id === "manager";

	const existingManager = roles.find(isManager);
	const hr = roles.find(isHrManager);
	const asset = roles.find(isAssetManager);
	if (!existingManager && !hr && !asset) return roles;

	const mergedPermissions = mergePermissions(
		mergePermissions(mergePermissions(existingManager?.permissions, hr?.permissions), asset?.permissions),
		DEFAULT_MANAGER_PERMISSIONS,
	);

	const merged: Role = {
		id: "manager",
		name: "Manager (HR & Tài sản)",
		userCount:
			(existingManager?.userCount ?? 0) + (hr?.userCount ?? 0) + (asset?.userCount ?? 0),
		permissions: mergedPermissions,
		mainPermissions: summarizePermissions(mergedPermissions),
	};

	const filtered = roles.filter(
		(r) => !isManager(r) && !isHrManager(r) && !isAssetManager(r),
	);
	return [merged, ...filtered];
}

// --- SEED DATA ---
function seedGeneral(): GeneralConfig {
	return {
		workTimeStart: "08:30",
		workTimeEnd: "17:30",
		workDays: ["MON", "TUE", "WED", "THU", "FRI"],
	};
}

function seedRoles(): Role[] {
	return [
		{
			id: "admin",
			name: "Admin",
			userCount: 2,
			mainPermissions: "Toàn quyền",
			permissions: {
				booking: ["view_list", "create", "delete", "view_booked"],
				employee: ["view", "create", "update"],
				asset: ["view", "create", "update"],
			},
			locked: true,
		},
		{
			id: "manager",
			name: "Manager (HR & Tài sản)",
			userCount: 5,
			permissions: {
				...DEFAULT_MANAGER_PERMISSIONS,
			},
			mainPermissions: summarizePermissions(DEFAULT_MANAGER_PERMISSIONS),
		},
		{
			id: "staff",
			name: "Staff (Nhân viên)",
			userCount: 120,
			mainPermissions: "Đặt phòng, Nhân sự",
			permissions: {
				booking: ["view_list", "create", "view_booked"],
				employee: ["view"],
			},
		},
	];
}

function seedPolicies(): Policies {
	return {
		bookingMaxHours: 4,
		bookingRequireApproval: false,
		leaveAnnualDays: 12,
		leaveRequireMedicalProof: true,
		attendanceCutoffDay: 25,
	};
}

type RoleDraft = {
	name: string;
	userCount: string;
	permissions: Record<string, string[]>;
};

const emptyRoleDraft: RoleDraft = {
	name: "",
	userCount: "0",
	permissions: {},
};

export default function AdminSettingsPage() {
	const [tab, setTab] = React.useState<"general" | "roles" | "policies">("general");

	const [general, setGeneral] = React.useState<GeneralConfig>(seedGeneral());
	const [roles, setRoles] = React.useState<Role[]>([]);
	const [policies, setPolicies] = React.useState<Policies>(seedPolicies());

	const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
	const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null);
	const [roleDraft, setRoleDraft] = React.useState<RoleDraft>(emptyRoleDraft);

	React.useEffect(() => {
		const savedGeneral = readJson<GeneralConfig | null>(STORAGE_GENERAL, null);
		const nextGeneral = savedGeneral ?? seedGeneral();
		setGeneral(nextGeneral);
		if (!savedGeneral) writeJson(STORAGE_GENERAL, nextGeneral);

		const savedRoles = readJson<Role[]>(STORAGE_ROLES, []);
		const nextRoles = savedRoles.length ? normalizeRoles(savedRoles) : seedRoles();
		setRoles(nextRoles);
		// Nếu lần đầu hoặc có migrate, ghi lại để đồng bộ
		if (!savedRoles.length || JSON.stringify(savedRoles) !== JSON.stringify(nextRoles)) {
			writeJson(STORAGE_ROLES, nextRoles);
		}

		const savedPolicies = readJson<Policies | null>(STORAGE_POLICIES, null);
		const nextPolicies = savedPolicies ?? seedPolicies();
		setPolicies(nextPolicies);
		if (!savedPolicies) writeJson(STORAGE_POLICIES, nextPolicies);
	}, []);

	React.useEffect(() => {
		if (roles.length) writeJson(STORAGE_ROLES, roles);
	}, [roles]);

	// --- BẮT ĐẦU: XỬ LÝ ROLE ---
	const openCreateRole = () => {
		setEditingRoleId(null);
		setRoleDraft(emptyRoleDraft);
		setRoleDialogOpen(true);
	};

	const openEditRole = (id: string) => {
		const role = roles.find((r) => r.id === id);
		if (!role || role.locked) return;
		setEditingRoleId(id);
		setRoleDraft({
			name: role.name,
			userCount: String(role.userCount),
			permissions: role.permissions || {}, // Load permissions cũ
		});
		setRoleDialogOpen(true);
	};

	const deleteRole = (id: string) => {
		const role = roles.find((r) => r.id === id);
		if (!role || role.locked) return;

		// Safeguard: Không cho phép xóa nếu đang có user sử dụng
		if (role.userCount > 0) {
			alert(`Không thể xóa vai trò "${role.name}" vì đang có ${role.userCount} nhân viên sử dụng.\nVui lòng chuyển các nhân viên này sang vai trò khác trước.`);
			return;
		}

		if (window.confirm(`Bạn có chắc chắn muốn xóa vai trò "${role.name}" không? Hành động này không thể hoàn tác.`)) {
			setRoles((prev) => prev.filter((r) => r.id !== id));
		}
	};

	const togglePermission = (moduleId: string, actionId: string) => {
		setRoleDraft((prev) => {
			const modPerms = prev.permissions[moduleId] || [];
			const hasPerm = modPerms.includes(actionId);
			const nextModPerms = hasPerm
				? modPerms.filter((id) => id !== actionId)
				: [...modPerms, actionId];

			return {
				...prev,
				permissions: {
					...prev.permissions,
					[moduleId]: nextModPerms,
				},
			};
		});
	};

	const saveRole = () => {
		const name = roleDraft.name.trim();
		const userCount = Number(roleDraft.userCount);
		const permissions = roleDraft.permissions;
		const mainPermissions = summarizePermissions(permissions); // Tự động tạo câu tóm tắt

		if (!name) {
			alert("Vui lòng nhập tên vai trò");
			return;
		}
		if (!Number.isFinite(userCount) || userCount < 0) {
			alert("Số người dùng không hợp lệ");
			return;
		}

		if (!editingRoleId) {
			const newRole: Role = {
				id: safeId("role"),
				name,
				userCount,
				permissions,
				mainPermissions,
			};
			setRoles((prev) => [newRole, ...prev]);
		} else {
			setRoles((prev) =>
				prev.map((r) =>
					r.id !== editingRoleId
						? r
						: { ...r, name, userCount, permissions, mainPermissions },
				),
			);
		}
		setRoleDialogOpen(false);
	};
	// --- KẾT THÚC: XỬ LÝ ROLE ---

	const saveGeneral = () => {
		writeJson(STORAGE_GENERAL, general);
		alert("Đã lưu thay đổi");
	};

	const savePolicies = () => {
		writeJson(STORAGE_POLICIES, policies);
		alert("Đã lưu thay đổi");
	};

	const toggleWorkDay = (dayId: string) => {
		setGeneral(prev => {
			const isSelected = prev.workDays.includes(dayId);
			return {
				...prev,
				workDays: isSelected 
					? prev.workDays.filter(d => d !== dayId)
					: [...prev.workDays, dayId]
			};
		});
	};

	return (
		<div className="p-6 bg-background min-h-screen">
			{/* Page header */}
			<div className="flex items-center justify-between">
				<div className="text-lg font-semibold text-gray-900">
					Cấu hình &amp; Phân quyền
				</div>
				<Button
					type="button"
					variant="ghost"
					className="text-blue-600 hover:text-blue-700"
					onClick={() => alert("Nhật ký thay đổi (UI demo)")}
				>
					<History className="mr-2 h-4 w-4" /> Xem nhật ký thay đổi
				</Button>
			</div>

			{/* Main card */}
			<Card className="mt-5 shadow-sm">
				<CardContent className="p-0">
					<Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
						<div className="border-b border-gray-100 px-6 pt-4">
							<TabsList className="h-auto bg-transparent p-0">
								<TabsTrigger
									value="general"
									className="rounded-none bg-transparent px-0 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
								>
									Cấu hình chung
								</TabsTrigger>
								<div className="w-8" />
								<TabsTrigger
									value="roles"
									className="rounded-none bg-transparent px-0 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
								>
									Phân quyền (Roles)
								</TabsTrigger>
								<div className="w-8" />
								<TabsTrigger
									value="policies"
									className="rounded-none bg-transparent px-0 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
								>
									Chính sách chung
								</TabsTrigger>
							</TabsList>
						</div>

						{/* General Settings */}
						<TabsContent value="general" className="m-0 p-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<div className="text-sm font-semibold text-gray-900">
										Thời gian &amp; Ngày làm việc
									</div>
									<div className="mt-1 text-sm text-muted-foreground">
										Cấu hình này sẽ được dùng làm cơ sở cho module Chấm công và Lịch làm việc.
									</div>
								</div>
							</div>

							<div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
								<div className="rounded-xl border border-gray-100 bg-white p-4">
									<div className="flex items-start gap-3">
										<div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
											<Clock className="h-5 w-5" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="text-sm font-semibold text-gray-900">
												Khung giờ làm việc mặc định
											</div>
											<div className="mt-3 grid gap-4 sm:grid-cols-2">
												<div className="grid gap-2">
													<Label className="text-xs text-muted-foreground">
														Giờ vào làm
													</Label>
													<Input
														type="time"
														value={general.workTimeStart}
														onChange={(e) =>
															setGeneral((p) => ({ ...p, workTimeStart: e.target.value }))
														}
														className="h-10 bg-white"
													/>
												</div>
												<div className="grid gap-2">
													<Label className="text-xs text-muted-foreground">
														Giờ tan ca
													</Label>
													<Input
														type="time"
														value={general.workTimeEnd}
														onChange={(e) =>
															setGeneral((p) => ({ ...p, workTimeEnd: e.target.value }))
														}
														className="h-10 bg-white"
													/>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className="rounded-xl border border-gray-100 bg-white p-4">
									<div className="flex items-start gap-3">
										<div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-50 text-purple-600">
											<CalendarCheck className="h-5 w-5" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="text-sm font-semibold text-gray-900">
												Ngày làm việc trong tuần
											</div>
											<div className="mt-3 flex flex-wrap gap-2">
												{WEEKDAYS.map((day) => {
													const isActive = general.workDays.includes(day.id);
													return (
														<button
															key={day.id}
															type="button"
															onClick={() => toggleWorkDay(day.id)}
															className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
																isActive
																	? "border-blue-600 bg-blue-50 text-blue-700"
																	: "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
															}`}
														>
															{day.label}
														</button>
													);
												})}
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="mt-6 flex justify-end">
								<Button
									type="button"
									onClick={saveGeneral}
									className="h-10 bg-blue-600 hover:bg-blue-700"
								>
									Lưu thay đổi
								</Button>
							</div>
						</TabsContent>

						{/* Roles */}
						<TabsContent value="roles" className="m-0 p-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<div className="text-sm font-semibold text-gray-900">
										Vai trò &amp; Quyền hạn
									</div>
									<div className="mt-1 text-sm text-muted-foreground">
										Định nghĩa quyền truy cập cho từng nhóm người dùng.
									</div>
								</div>

								<Button
									type="button"
									onClick={openCreateRole}
									className="h-10 bg-blue-600 hover:bg-blue-700"
								>
									<Plus className="mr-2 h-4 w-4" /> Tạo vai trò mới
								</Button>
							</div>

							<div className="mt-5 rounded-xl border border-gray-100 bg-white overflow-hidden">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="text-[11px] uppercase text-muted-foreground">
												Vai trò (Role)
											</TableHead>
											<TableHead className="text-[11px] uppercase text-muted-foreground">
												Người dùng
											</TableHead>
											<TableHead className="text-[11px] uppercase text-muted-foreground">
												Quyền chính
											</TableHead>
											<TableHead className="text-right text-[11px] uppercase text-muted-foreground">
												Hành động
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{roles.map((r) => (
											<TableRow key={r.id} className="hover:bg-gray-50">
												<TableCell className="font-medium text-blue-600">
													{r.name}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{r.userCount} users
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{r.locked ? (
														<span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
															Toàn quyền
														</span>
													) : (
														r.mainPermissions
													)}
												</TableCell>
												<TableCell className="text-right">
													{r.locked ? (
														<span className="inline-flex items-center justify-end text-muted-foreground">
															<Lock className="h-4 w-4" />
														</span>
													) : (
														<div className="flex items-center justify-end gap-3">
															<button
																type="button"
																className="text-sm font-medium text-blue-600 hover:text-blue-700"
																onClick={() => openEditRole(r.id)}
															>
																Sửa
															</button>
															<button
																type="button"
																className="text-sm font-medium text-red-600 hover:text-red-700"
																onClick={() => deleteRole(r.id)}
															>
																Xóa
															</button>
														</div>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							<Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
								<DialogContent className="max-w-[700px] max-h-[90vh] flex flex-col">
									<DialogHeader>
										<DialogTitle>
											{editingRoleId ? "Chỉnh sửa vai trò" : "Tạo vai trò mới"}
										</DialogTitle>
									</DialogHeader>

									<div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5 py-4">
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<div className="grid gap-2">
												<Label>Tên vai trò <span className="text-red-500">*</span></Label>
												<Input
													value={roleDraft.name}
													onChange={(e) =>
														setRoleDraft((p) => ({ ...p, name: e.target.value }))
													}
													placeholder="VD: Asset Manager"
												/>
											</div>
											<div className="grid gap-2">
												<Label>Số người dùng</Label>
												<Input
													type="number"
													min={0}
													value={roleDraft.userCount}
													onChange={(e) =>
														setRoleDraft((p) => ({
															...p,
															userCount: e.target.value,
														}))
													}
												/>
											</div>
										</div>

										<div className="space-y-3">
											<Label>Chi tiết phân quyền</Label>
											<div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/50 p-5">
												{PERMISSION_MODULES.map((mod) => (
													<div key={mod.id} className="space-y-3 pb-4 border-b border-gray-200/50 last:border-0 last:pb-0">
														<div className="text-sm font-semibold text-gray-900">
															{mod.name}
														</div>
														<div className="flex flex-wrap gap-x-6 gap-y-3">
															{mod.actions.map((act) => {
																const isChecked = roleDraft.permissions[mod.id]?.includes(act.id) || false;
																return (
																	<div key={act.id} className="flex items-center gap-2">
																		<Checkbox
																			id={`${mod.id}-${act.id}`}
																			checked={isChecked}
																			onCheckedChange={() => togglePermission(mod.id, act.id)}
																		/>
																		<Label
																			htmlFor={`${mod.id}-${act.id}`}
																			className="text-xs text-muted-foreground font-medium cursor-pointer"
																		>
																			{act.label}
																		</Label>
																	</div>
																);
															})}
														</div>
													</div>
												))}
											</div>
										</div>
									</div>

									<DialogFooter className="mt-2 pt-4 border-t border-gray-100">
										<Button
											type="button"
											variant="ghost"
											onClick={() => setRoleDialogOpen(false)}
										>
											Hủy
										</Button>
										<Button
											type="button"
											onClick={saveRole}
											className="bg-blue-600 hover:bg-blue-700"
										>
											<Check className="mr-2 h-4 w-4" > Lưu </Check>
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</TabsContent>

						{/* Policies */}
						<TabsContent value="policies" className="m-0 p-6">
							<div>
								<div className="text-sm font-semibold text-gray-900">
									Thiết lập Chính sách chung
								</div>
							</div>

							<div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
								{/* Booking Policy */}
								<div className="rounded-xl border border-gray-100 bg-white p-4">
									<div className="flex items-start gap-3">
										<div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
											<CalendarDays className="h-5 w-5" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="text-sm font-semibold text-gray-900">
												Đặt phòng họp
											</div>
											<div className="mt-3 grid gap-2">
												<Label className="text-xs text-muted-foreground">
													Thời gian đặt tối đa (giờ)
												</Label>
												<Input
													type="number"
													min={1}
													value={policies.bookingMaxHours}
													onChange={(e) =>
														setPolicies((p) => ({
															...p,
															bookingMaxHours: Number(e.target.value || 0),
														}))
													}
													className="h-10 bg-white w-full sm:w-1/2"
												/>
											</div>

											<div className="mt-4 flex items-center gap-2">
												<Checkbox
													id="chk-vip"
													checked={policies.bookingRequireApproval}
													onCheckedChange={(v) =>
														setPolicies((p) => ({
															...p,
															bookingRequireApproval: Boolean(v),
														}))
													}
												/>
												<Label htmlFor="chk-vip" className="text-sm text-gray-900 cursor-pointer">
													Yêu cầu duyệt nếu đặt phòng VIP
												</Label>
											</div>
										</div>
									</div>
								</div>

								{/* Leave Policy */}
								<div className="rounded-xl border border-gray-100 bg-white p-4">
									<div className="flex items-start gap-3">
										<div className="grid h-10 w-10 place-items-center rounded-lg bg-yellow-50 text-yellow-600">
											<Palmtree className="h-5 w-5" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="text-sm font-semibold text-gray-900">
												Nghỉ phép
											</div>
											<div className="mt-3 grid gap-2">
												<Label className="text-xs text-muted-foreground">
													Số ngày phép năm mặc định
												</Label>
												<Input
													type="number"
													min={0}
													value={policies.leaveAnnualDays}
													onChange={(e) =>
														setPolicies((p) => ({
															...p,
															leaveAnnualDays: Number(e.target.value || 0),
														}))
													}
													className="h-10 bg-white w-full sm:w-1/2"
												/>
											</div>

											<div className="mt-4 flex items-center gap-2">
												<Checkbox
													id="chk-med"
													checked={policies.leaveRequireMedicalProof}
													onCheckedChange={(v) =>
														setPolicies((p) => ({
															...p,
															leaveRequireMedicalProof: Boolean(v),
														}))
													}
												/>
												<Label htmlFor="chk-med" className="text-sm text-gray-900 cursor-pointer">
													Yêu cầu giấy khám bệnh (nếu nghỉ &gt; 2 ngày)
												</Label>
											</div>
										</div>
									</div>
								</div>

								{/* Payroll & Attendance Policy */}
								<div className="rounded-xl border border-gray-100 bg-white p-4 lg:col-span-2">
									<div className="flex items-start gap-3">
										<div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-50 text-rose-600">
											<Calculator className="h-5 w-5" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="text-sm font-semibold text-gray-900">
												Lương &amp; Chấm công
											</div>
											<div className="mt-3 grid gap-2">
												<Label className="text-xs text-muted-foreground">
													Ngày chốt công định kỳ hàng tháng
												</Label>
												<div className="flex items-center gap-2">
													<Input
														type="number"
														min={1}
														max={31}
														value={policies.attendanceCutoffDay}
														onChange={(e) =>
															setPolicies((p) => ({
																...p,
																attendanceCutoffDay: Number(e.target.value || 0),
															}))
														}
														className="h-10 bg-white w-24 text-center"
													/>
												</div>
												<div className="mt-1 text-xs text-muted-foreground">
													Hệ thống sẽ tự động tổng hợp bảng công và khóa chức năng tạo phép của chu kỳ trước đó.
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="mt-6 flex justify-end">
								<Button
									type="button"
									onClick={savePolicies}
									className="h-10 bg-blue-600 hover:bg-blue-700"
								>
									Lưu thay đổi
								</Button>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* CSS cho thanh cuộn trong Dialog */}
			<style jsx global>{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 6px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background-color: #E2E8F0;
					border-radius: 10px;
				}
				.custom-scrollbar:hover::-webkit-scrollbar-thumb {
					background-color: #CBD5E1;
				}
			`}</style>
		</div>
	);
}