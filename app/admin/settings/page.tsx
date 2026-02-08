
"use client";

import * as React from "react";
import {
	Briefcase,
	CalendarDays,
	Check,
	CreditCard,
	History,
	Lock,
	Plus,
	Settings2,
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
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ModuleKey = "booking" | "assets" | "payroll";

type ModuleSetting = {
	key: ModuleKey;
	title: string;
	description: string;
	enabled: boolean;
};

type Role = {
	id: string;
	name: string;
	userCount: number;
	mainPermissions: string;
	locked?: boolean;
};

type Policies = {
	bookingMaxHours: number;
	bookingRequireVipApproval: boolean;
	assetsMaintenanceEmail: string;
	assetsAutoRecallReminder: boolean;
};

const STORAGE_MODULES = "admin_settings_modules";
const STORAGE_ROLES = "admin_settings_roles";
const STORAGE_POLICIES = "admin_settings_policies";

function safeId(prefix = "id") {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

function seedModules(): ModuleSetting[] {
	return [
		{
			key: "booking",
			title: "Booking Phòng họp",
			description: "Cho phép nhân viên đặt lịch, xem lịch phòng họp.",
			enabled: true,
		},
		{
			key: "assets",
			title: "Quản lý Tài sản",
			description: "Theo dõi cấp phát, thu hồi và bảo trì thiết bị.",
			enabled: true,
		},
		{
			key: "payroll",
			title: "Tính lương (Payroll)",
			description: "Module đang phát triển (Beta).",
			enabled: false,
		},
	];
}

function seedRoles(): Role[] {
	return [
		{
			id: "super_admin",
			name: "Super Admin",
			userCount: 2,
			mainPermissions: "Toàn quyền",
			locked: true,
		},
		{
			id: "hr_manager",
			name: "HR Manager",
			userCount: 5,
			mainPermissions: "Quản lý nhân viên, Duyệt nghỉ phép",
		},
		{
			id: "asset_manager",
			name: "Asset Manager",
			userCount: 3,
			mainPermissions: "CRUD Tài sản, Booking phòng",
		},
		{
			id: "staff",
			name: "Staff (Nhân viên)",
			userCount: 120,
			mainPermissions: "Xem thông tin, Tạo Ticket, Đặt phòng",
		},
	];
}

function seedPolicies(): Policies {
	return {
		bookingMaxHours: 4,
		bookingRequireVipApproval: true,
		assetsMaintenanceEmail: "it-support@company.com",
		assetsAutoRecallReminder: true,
	};
}

type RoleDraft = {
	name: string;
	userCount: string;
	mainPermissions: string;
};

const emptyRoleDraft: RoleDraft = {
	name: "",
	userCount: "0",
	mainPermissions: "",
};

export default function AdminSettingsPage() {
	const [tab, setTab] = React.useState<"modules" | "roles" | "policies">(
		"modules",
	);

	const [modules, setModules] = React.useState<ModuleSetting[]>([]);
	const [roles, setRoles] = React.useState<Role[]>([]);
	const [policies, setPolicies] = React.useState<Policies>(seedPolicies());

	const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
	const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null);
	const [roleDraft, setRoleDraft] = React.useState<RoleDraft>(emptyRoleDraft);

	React.useEffect(() => {
		const savedModules = readJson<ModuleSetting[]>(STORAGE_MODULES, []);
		const nextModules = savedModules.length ? savedModules : seedModules();
		setModules(nextModules);
		if (!savedModules.length) writeJson(STORAGE_MODULES, nextModules);

		const savedRoles = readJson<Role[]>(STORAGE_ROLES, []);
		const nextRoles = savedRoles.length ? savedRoles : seedRoles();
		setRoles(nextRoles);
		if (!savedRoles.length) writeJson(STORAGE_ROLES, nextRoles);

		const savedPolicies = readJson<Policies | null>(STORAGE_POLICIES, null);
		const nextPolicies = savedPolicies ?? seedPolicies();
		setPolicies(nextPolicies);
		if (!savedPolicies) writeJson(STORAGE_POLICIES, nextPolicies);
	}, []);

	React.useEffect(() => {
		if (modules.length) writeJson(STORAGE_MODULES, modules);
	}, [modules]);

	React.useEffect(() => {
		if (roles.length) writeJson(STORAGE_ROLES, roles);
	}, [roles]);

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
			mainPermissions: role.mainPermissions,
		});
		setRoleDialogOpen(true);
	};

	const saveRole = () => {
		const name = roleDraft.name.trim();
		const userCount = Number(roleDraft.userCount);
		const mainPermissions = roleDraft.mainPermissions.trim();

		if (!name) {
			alert("Vui lòng nhập tên vai trò");
			return;
		}
		if (!Number.isFinite(userCount) || userCount < 0) {
			alert("Số người dùng không hợp lệ");
			return;
		}
		if (!mainPermissions) {
			alert("Vui lòng nhập quyền chính");
			return;
		}

		if (!editingRoleId) {
			const newRole: Role = {
				id: safeId("role"),
				name,
				userCount,
				mainPermissions,
			};
			setRoles((prev) => [newRole, ...prev]);
		} else {
			setRoles((prev) =>
				prev.map((r) =>
					r.id !== editingRoleId
						? r
						: { ...r, name, userCount, mainPermissions },
				),
			);
		}
		setRoleDialogOpen(false);
	};

	const savePolicies = () => {
		writeJson(STORAGE_POLICIES, policies);
		alert("Đã lưu thay đổi");
	};

	const ModuleIcon = ({ k }: { k: ModuleKey }) => {
		const base = "grid h-11 w-11 place-items-center rounded-lg";
		if (k === "booking")
			return (
				<div className={`${base} bg-blue-50 text-blue-600`}>
					<CalendarDays className="h-5 w-5" />
				</div>
			);
		if (k === "assets")
			return (
				<div className={`${base} bg-purple-50 text-purple-600`}>
					<Briefcase className="h-5 w-5" />
				</div>
			);
		return (
			<div className={`${base} bg-yellow-50 text-yellow-700`}>
				<CreditCard className="h-5 w-5" />
			</div>
		);
	};

	return (
		<div className="p-6 bg-background min-h-screen">
			{/* Page header */}
			<div className="flex items-center justify-between">
				<div className="text-lg font-semibold text-grey-900">
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
						<div className="border-b border-grey-50 px-6 pt-4">
							<TabsList className="h-auto bg-transparent p-0">
								<TabsTrigger
									value="modules"
									className="rounded-none bg-transparent px-0 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
								>
									Modules &amp; Tính năng
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

						{/* Modules */}
						<TabsContent value="modules" className="m-0 p-6">
							<div>
								<div className="text-sm font-semibold text-grey-900">Quản lý Modules</div>
								<div className="mt-1 text-sm text-muted-foreground">
									Bật/tắt các phân hệ chức năng cho toàn công ty.
								</div>
							</div>

							<div className="mt-5 space-y-4">
								{modules.map((m) => (
									<div
										key={m.key}
										className="flex items-center justify-between gap-4 rounded-xl border border-grey-50 bg-white px-4 py-4"
									>
										<div className="flex items-center gap-4">
											<ModuleIcon k={m.key} />
											<div>
												<div className="text-sm font-semibold text-grey-900">
													{m.title}
												</div>
												<div className="mt-1 text-xs text-muted-foreground">
													{m.description}
												</div>
											</div>
										</div>

										<Switch
											checked={m.enabled}
											onCheckedChange={(checked) =>
												setModules((prev) =>
													prev.map((x) =>
														x.key !== m.key ? x : { ...x, enabled: checked },
													),
												)
											}
											aria-label={m.title}
										/>
									</div>
								))}
							</div>
						</TabsContent>

						{/* Roles */}
						<TabsContent value="roles" className="m-0 p-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<div className="text-sm font-semibold text-grey-900">
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

							<div className="mt-5 rounded-xl border border-grey-50 bg-white overflow-hidden">
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
											<TableRow key={r.id} className="hover:bg-neutral-background">
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
														<button
															type="button"
															className="text-sm font-medium text-blue-600 hover:text-blue-700"
															onClick={() => openEditRole(r.id)}
														>
															Sửa
														</button>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							<Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
								<DialogContent className="max-w-[620px]">
									<DialogHeader>
										<DialogTitle>
											{editingRoleId ? "Chỉnh sửa vai trò" : "Tạo vai trò mới"}
										</DialogTitle>
									</DialogHeader>

									<div className="grid gap-4 py-2">
										<div className="grid gap-2">
											<Label>Tên vai trò</Label>
											<Input
												value={roleDraft.name}
												onChange={(e) =>
													setRoleDraft((p) => ({ ...p, name: e.target.value }))
												}
												placeholder="VD: Asset Manager"
											/>
										</div>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
											<div className="grid gap-2">
												<Label>Quyền chính</Label>
												<Input
													value={roleDraft.mainPermissions}
													onChange={(e) =>
														setRoleDraft((p) => ({
															...p,
															mainPermissions: e.target.value,
														}))
													}
													placeholder="VD: CRUD Tài sản, Booking phòng"
												/>
											</div>
										</div>
									</div>

									<DialogFooter>
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
								<div className="text-sm font-semibold text-grey-900">
									Thiết lập Chính sách chung
								</div>
							</div>

							<div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
								<div className="rounded-xl border border-grey-50 bg-white p-4">
									<div className="flex items-start gap-3">
										<div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
											<CalendarDays className="h-5 w-5" />
										</div>
										<div className="min-w-0">
											<div className="text-sm font-semibold text-grey-900">
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
													className="h-10 bg-white"
												/>
											</div>

											<div className="mt-3 flex items-center gap-2">
												<Checkbox
													checked={policies.bookingRequireVipApproval}
													onCheckedChange={(v) =>
														setPolicies((p) => ({
															...p,
															bookingRequireVipApproval: Boolean(v),
														}))
													}
												/>
												<div className="text-sm text-grey-900">
													Yêu cầu duyệt nếu đặt phòng VIP
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className="rounded-xl border border-grey-50 bg-white p-4">
									<div className="flex items-start gap-3">
										<div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-50 text-purple-600">
											<Settings2 className="h-5 w-5" />
										</div>
										<div className="min-w-0">
											<div className="text-sm font-semibold text-grey-900">
												Tài sản &amp; Thiết bị
											</div>

											<div className="mt-3 grid gap-2">
												<Label className="text-xs text-muted-foreground">
													Email nhận thông báo bảo trì
												</Label>
												<Input
													value={policies.assetsMaintenanceEmail}
													onChange={(e) =>
														setPolicies((p) => ({
															...p,
															assetsMaintenanceEmail: e.target.value,
														}))
													}
													className="h-10 bg-white"
												/>
											</div>

											<div className="mt-3 flex items-center gap-2">
												<Checkbox
													checked={policies.assetsAutoRecallReminder}
													onCheckedChange={(v) =>
														setPolicies((p) => ({
															...p,
															assetsAutoRecallReminder: Boolean(v),
														}))
													}
												/>
												<div className="text-sm text-grey-900">
													Tự động nhắc thu hồi trước 3 ngày
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
		</div>
	);
}

