"use client";

import * as React from "react";
import {
  Download,
  Plus,
  Search,
  MoreHorizontal,
  UserPlus,
  Pencil,
  Trash2,
  Package,
  Warehouse,
  Users,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- 1. Cập nhật Type để khớp với ảnh ---
type AssetStatus = "in_use" | "in_stock" | "maintenance";
type AssetCategory = "Laptop / Máy tính" | "Màn hình" | "Thiết bị VP";

type Assignee = {
  name: string;
  department: string;
};

type Asset = {
  id: string;
  name: string;
  code: string; // Mã quản lý (Asset Tag)
  serialNumber: string; // MỚI: Số Serial (S/N)
  category: AssetCategory;
  status: AssetStatus;
  location: string; // MỚI: Vị trí lưu kho
  assignee?: Assignee;
  purchaseDate: string; // YYYY-MM-DD
  warrantyUntil?: string; // YYYY-MM-DD
  value: number; // MỚI: Giá trị (VNĐ)
};

const STORAGE_KEY = "admin_assets";

function safeId(prefix = "as") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return `${prefix}_${(crypto as any).randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateVi(ymd: string) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  return `${pad2(Number(d))}/${pad2(Number(m))}/${y}`;
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function warrantyLabel(purchaseDate: string, warrantyUntil?: string) {
  if (!warrantyUntil) return "";
  const now = new Date();
  const end = new Date(warrantyUntil);
  if (Number.isNaN(end.getTime())) return "";
  const remainingDays = daysBetween(now, end);
  if (remainingDays <= 0) return "Hết bảo hành";
  const years = Math.floor(remainingDays / 365);
  if (years >= 1) return `Còn BH ${years} năm`;
  const months = Math.max(1, Math.floor(remainingDays / 30));
  return `Còn BH ${months} tháng`;
}

function statusMeta(status: AssetStatus) {
  switch (status) {
    case "in_use":
      return { label: "Đang sử dụng", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
    case "in_stock":
      return { label: "Trong kho", badge: "bg-green-100 text-green-700", dot: "bg-green-500" };
    case "maintenance":
      return { label: "Đang bảo trì", badge: "bg-red-100 text-red-700", dot: "bg-red-500" };
    default:
      return { label: status, badge: "bg-gray-100 text-gray-700", dot: "bg-gray-500" };
  }
}

// --- 2. Cập nhật dữ liệu mẫu (Seed Data) ---
function seedAssets(): Asset[] {
  const base: Asset[] = [
    {
      id: safeId(),
      name: "MacBook Pro M2",
      code: "AST-001",
      serialNumber: "C02FK123",
      category: "Laptop / Máy tính",
      status: "in_use",
      location: "Kho IT (Tầng 3)",
      assignee: { name: "Nguyễn Dũng", department: "Phòng IT" },
      purchaseDate: "2024-10-10",
      warrantyUntil: "2026-10-10",
      value: 35000000,
    },
    {
      id: safeId(),
      name: "Màn hình Dell Ultrasharp",
      code: "AST-002",
      serialNumber: "DL-998877",
      category: "Màn hình",
      status: "in_stock",
      location: "Kho Tổng",
      purchaseDate: "2023-05-15",
      warrantyUntil: "2025-05-15",
      value: 8500000,
    },
    {
      id: safeId(),
      name: "Máy in Canon 2900",
      code: "AST-003",
      serialNumber: "CN-112233",
      category: "Thiết bị VP",
      status: "maintenance",
      location: "Phòng Hành Chính",
      assignee: { name: "Phòng Hành Chính", department: "" },
      purchaseDate: "2022-01-01",
      warrantyUntil: "2023-01-01",
      value: 3200000,
    },
  ];

  const items: Asset[] = [];
  for (let i = 0; i < 50; i += 1) { // Giảm số lượng mẫu xuống để demo nhanh
    const src = base[i % base.length];
    const n = i + 1;
    items.push({
      ...src,
      id: safeId(),
      name: src.name,
      code: `AST-${pad2(n + 100)}`,
      serialNumber: `${src.serialNumber}-${n}`,
    });
  }
  return items;
}

function readAssets(): Asset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Asset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAssets(items: Asset[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

// --- 3. Cập nhật AssetDraft cho Form ---
type AssetDraft = {
  name: string;
  code: string;
  serialNumber: string;
  category: AssetCategory;
  status: AssetStatus;
  location: string;
  purchaseDate: string;
  warrantyUntil: string;
  value: number;
};

const emptyDraft: AssetDraft = {
  name: "",
  code: "",
  serialNumber: "",
  category: "Laptop / Máy tính",
  status: "in_stock",
  location: "Kho IT (Tầng 3)",
  purchaseDate: "",
  warrantyUntil: "",
  value: 0,
};

type AssigneeOption = Assignee & { id: string };

const defaultAssignees: AssigneeOption[] = [
  { id: "emp_nd", name: "Nguyễn Dũng", department: "Phòng IT" },
  { id: "emp_hc", name: "Phòng Hành Chính", department: "" },
  { id: "emp_hr", name: "Phòng Nhân Sự", department: "" },
];

function assetIcon(category: AssetCategory) {
  switch (category) {
    case "Laptop / Máy tính":
      return <Package className="w-4 h-4 text-muted-foreground" />;
    case "Màn hình":
      return <Users className="w-4 h-4 text-muted-foreground" />;
    case "Thiết bị VP":
      return <Wrench className="w-4 h-4 text-muted-foreground" />;
    default:
      return <Package className="w-4 h-4 text-muted-foreground" />;
  }
}

export default function AdminAssetsPage() {
  const [items, setItems] = React.useState<Asset[]>([]);
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState<"all" | AssetCategory>("all");
  const [status, setStatus] = React.useState<"all" | AssetStatus>("all");
  const [page, setPage] = React.useState(1);
  const pageSize = 5;

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const [draft, setDraft] = React.useState<AssetDraft>(emptyDraft);
  const [assigneeId, setAssigneeId] = React.useState<string>(defaultAssignees[0]!.id);

  React.useEffect(() => {
    const existing = readAssets();
    if (existing.length === 0) {
      const seeded = seedAssets();
      setItems(seeded);
      writeAssets(seeded);
      return;
    }
    setItems(existing);
  }, []);

  React.useEffect(() => {
    if (items.length) writeAssets(items);
  }, [items]);

  const total = items.length;
  const countInStock = items.filter((x) => x.status === "in_stock").length;
  const countInUse = items.filter((x) => x.status === "in_use").length;
  const countMaintenance = items.filter((x) => x.status === "maintenance").length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((it) => {
      const matchesQ =
        !query ||
        it.name.toLowerCase().includes(query) ||
        it.code.toLowerCase().includes(query) ||
        it.serialNumber.toLowerCase().includes(query);
      const matchesCat = category === "all" || it.category === category;
      const matchesStatus = status === "all" || it.status === status;
      return matchesQ && matchesCat && matchesStatus;
    });
  }, [items, q, category, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [q, category, status]);

  const openCreate = () => {
    setDraft(emptyDraft);
    setCreateOpen(true);
  };

  const openEdit = (id: string) => {
    const found = items.find((x) => x.id === id);
    if (!found) return;
    setActiveId(id);
    setDraft({
      name: found.name,
      code: found.code,
      serialNumber: found.serialNumber,
      category: found.category,
      status: found.status,
      location: found.location,
      purchaseDate: found.purchaseDate,
      warrantyUntil: found.warrantyUntil ?? "",
      value: found.value,
    });
    setEditOpen(true);
  };

  const openAssign = (id: string) => {
    setActiveId(id);
    setAssigneeId(defaultAssignees[0]!.id);
    setAssignOpen(true);
  };

  const saveCreate = () => {
    if (!draft.name.trim()) {
      alert("Vui lòng nhập tên tài sản");
      return;
    }
    const newItem: Asset = {
      id: safeId(),
      name: draft.name.trim(),
      code: draft.code.trim() || `AST-${Math.floor(Math.random() * 1000)}`,
      serialNumber: draft.serialNumber.trim(),
      category: draft.category,
      status: draft.status,
      location: draft.location,
      purchaseDate: draft.purchaseDate || new Date().toISOString().split("T")[0],
      warrantyUntil: draft.warrantyUntil || undefined,
      value: draft.value || 0,
    };
    setItems((prev) => [newItem, ...prev]);
    setCreateOpen(false);
  };

  const saveEdit = () => {
    if (!activeId) return;
    if (!draft.name.trim()) {
      alert("Vui lòng nhập tên tài sản");
      return;
    }
    setItems((prev) =>
      prev.map((x) =>
        x.id !== activeId
          ? x
          : {
              ...x,
              name: draft.name.trim(),
              code: draft.code.trim(),
              serialNumber: draft.serialNumber.trim(),
              category: draft.category,
              status: draft.status,
              location: draft.location,
              purchaseDate: draft.purchaseDate,
              warrantyUntil: draft.warrantyUntil || undefined,
              value: draft.value,
            }
      )
    );
    setEditOpen(false);
  };

  const saveAssign = () => {
    if (!activeId) return;
    const selected = defaultAssignees.find((x) => x.id === assigneeId);
    if (!selected) return;
    setItems((prev) =>
      prev.map((x) =>
        x.id !== activeId
          ? x
          : {
              ...x,
              assignee: { name: selected.name, department: selected.department },
              status: "in_use",
            }
      )
    );
    setAssignOpen(false);
  };

  const onDelete = (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa tài sản này không?")) return;
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const StatCard = ({
    title,
    value,
    percent,
    icon,
    tone,
  }: {
    title: string;
    value: number;
    percent: number;
    icon: React.ReactNode;
    tone: "blue" | "green" | "indigo" | "red";
  }) => {
    const toneMap: Record<typeof tone, string> = {
      blue: "bg-blue-50 text-blue-600",
      green: "bg-green-50 text-green-600",
      indigo: "bg-indigo-50 text-indigo-600",
      red: "bg-red-50 text-red-600",
    };
    return (
      <div className="bg-white border border-grey-50 rounded-lg px-4 py-3 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${toneMap[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
            {title}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold text-grey-900">
              {value.toLocaleString("vi-VN")}
            </div>
            <div className="text-[10px] text-muted-foreground">({percent}%)</div>
          </div>
        </div>
      </div>
    );
  };

  // --- COMPONENT FORM (Dùng chung cho Create và Edit) ---
  const AssetFormContent = () => (
    <div className="grid gap-6 py-2">
      
      {/* 1. THÔNG TIN ĐỊNH DANH */}
      <div>
        <h3 className="text-blue-600 text-sm font-bold uppercase mb-3">
          1. Thông tin định danh
        </h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="text-xs font-medium mb-1.5 block text-gray-700">
                Tên tài sản <span className="text-red-500">*</span>
              </label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                placeholder="VD: MacBook Pro 14 inch"
                className="h-9 text-sm"
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-medium mb-1.5 block text-gray-700">
                Loại thiết bị
              </label>
              <Select
                value={draft.category}
                onValueChange={(v) => setDraft((p) => ({ ...p, category: v as any }))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laptop / Máy tính">Laptop / Máy tính</SelectItem>
                  <SelectItem value="Màn hình">Màn hình</SelectItem>
                  <SelectItem value="Thiết bị VP">Thiết bị VP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block text-gray-700">
                Mã quản lý (Asset Tag)
              </label>
              <Input
                value={draft.code}
                onChange={(e) => setDraft((p) => ({ ...p, code: e.target.value }))}
                placeholder="AST-001"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block text-gray-700">
                Số Serial (S/N)
              </label>
              <Input
                value={draft.serialNumber}
                onChange={(e) => setDraft((p) => ({ ...p, serialNumber: e.target.value }))}
                placeholder="SERIAL NUMBER"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TRẠNG THÁI & PHÂN BỐ */}
      <div>
        <h3 className="text-blue-600 text-sm font-bold uppercase mb-3 border-t pt-4">
          2. Trạng thái & Phân bố
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block text-gray-700">
              Trạng thái hiện tại
            </label>
            <Select
              value={draft.status}
              onValueChange={(v) => setDraft((p) => ({ ...p, status: v as any }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <div className="flex items-center gap-2">
                    {/* Hiển thị chấm màu trong select giống ảnh */}
                    <div className={`w-2 h-2 rounded-full ${statusMeta(draft.status).dot}`} />
                    <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">Trong kho</SelectItem>
                <SelectItem value="in_use">Đang sử dụng</SelectItem>
                <SelectItem value="maintenance">Đang bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block text-gray-700">
              Vị trí lưu kho
            </label>
            <Select
                value={draft.location}
                onValueChange={(v) => setDraft((p) => ({ ...p, location: v }))}
            >
                <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Chọn vị trí" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Kho IT (Tầng 3)">Kho IT (Tầng 3)</SelectItem>
                    <SelectItem value="Kho Tổng">Kho Tổng</SelectItem>
                    <SelectItem value="Phòng Hành Chính">Phòng Hành Chính</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 3. MUA SẮM & BẢO HÀNH */}
      <div>
        <h3 className="text-blue-600 text-sm font-bold uppercase mb-3 border-t pt-4">
          3. Mua sắm & Bảo hành
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block text-gray-700">
              Ngày mua
            </label>
            <Input
              type="date"
              value={draft.purchaseDate}
              onChange={(e) => setDraft((p) => ({ ...p, purchaseDate: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block text-gray-700">
              Hạn bảo hành
            </label>
            <Input
              type="date"
              value={draft.warrantyUntil}
              onChange={(e) => setDraft((p) => ({ ...p, warrantyUntil: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block text-gray-700">
              Giá trị (VNĐ)
            </label>
            <Input
              type="number"
              value={draft.value}
              onChange={(e) => setDraft((p) => ({ ...p, value: Number(e.target.value) }))}
              className="h-9 text-sm text-right"
              placeholder="0"
            />
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-grey-900">Quản lý Tài sản</div>
          <Badge variant="secondary" className="text-[11px] font-medium">
            Tổng: {total.toLocaleString("vi-VN")} thiết bị
          </Badge>
        </div>
        <div className="flex items-center gap-2">
            {/* ...Buttons (Giữ nguyên) */}
            <Button type="button" variant="outline" className="h-9 text-xs">
                <Download className="w-4 h-4 mr-2" /> Xuất Excel
            </Button>
            <Button type="button" className="h-9 text-xs" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" /> Thêm Tài sản mới
            </Button>
        </div>
      </div>

      {/* Stats (Giữ nguyên) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
        <StatCard title="Tổng tài sản" value={total} percent={100} icon={<Package className="w-4 h-4" />} tone="blue" />
        <StatCard title="Trong kho" value={countInStock} percent={pct(countInStock)} icon={<Warehouse className="w-4 h-4" />} tone="green" />
        <StatCard title="Đang sử dụng" value={countInUse} percent={pct(countInUse)} icon={<Users className="w-4 h-4" />} tone="indigo" />
        <StatCard title="Bảo trì" value={countMaintenance} percent={pct(countMaintenance)} icon={<Wrench className="w-4 h-4" />} tone="red" />
      </div>

      {/* Filters (Giữ nguyên logic cũ) */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mt-5">
        <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, mã, serial..." className="h-9 pl-9 text-sm bg-white" />
        </div>
        <div className="flex items-center gap-3 md:ml-auto">
             <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger className="h-9 w-[160px] bg-white text-sm"><SelectValue placeholder="Tất cả loại" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    <SelectItem value="Laptop / Máy tính">Laptop / Máy tính</SelectItem>
                    <SelectItem value="Màn hình">Màn hình</SelectItem>
                    <SelectItem value="Thiết bị VP">Thiết bị VP</SelectItem>
                </SelectContent>
            </Select>
            {/* Status Select (Giữ nguyên) */}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-grey-50 rounded-lg mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-background border-b border-grey-50">
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Tài sản / Mã</th>
                <th className="px-4 py-3 font-semibold">Serial</th> {/* Thêm cột Serial */}
                <th className="px-4 py-3 font-semibold">Loại</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Được cấp cho</th>
                <th className="px-4 py-3 font-semibold">Ngày mua / BH</th>
                <th className="px-4 py-3 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((it) => {
                const sm = statusMeta(it.status);
                const wLabel = warrantyLabel(it.purchaseDate, it.warrantyUntil);
                return (
                  <tr key={it.id} className="border-b border-grey-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-neutral-background border border-grey-50 flex items-center justify-center">
                          {assetIcon(it.category)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-grey-900 truncate">{it.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{it.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-grey-700 font-mono text-[11px]">
                        {it.serialNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{it.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${sm.badge}`}>
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                        {/* Logic hiển thị assignee giữ nguyên */}
                        {it.assignee ? (
                             <div className="text-sm text-grey-900">{it.assignee.name}</div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic">--</div>
                        )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-grey-900">{formatDateVi(it.purchaseDate)}</div>
                      {wLabel && <div className="text-[10px] text-green-600">{wLabel}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" onClick={() => openAssign(it.id)} className="p-2 rounded-md hover:bg-neutral-background text-green-600"><UserPlus className="w-4 h-4" /></button>
                        <button type="button" onClick={() => openEdit(it.id)} className="p-2 rounded-md hover:bg-neutral-background text-blue-600"><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => onDelete(it.id)} className="p-2 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination giữ nguyên */}
        <div className="px-4 py-3 border-t border-grey-50 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Hiển thị {pageStart + 1} - {Math.min(pageStart + pageSize, filtered.length)} trên {filtered.length}</div>
            <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>‹</Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => p + 1)} disabled={page >= pageCount}>›</Button>
            </div>
        </div>
      </div>

      {/* --- CREATE DIALOG --- */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[800px]"> {/* Tăng chiều rộng popup */}
          <DialogHeader>
            <DialogTitle>Thêm Tài sản mới</DialogTitle>
          </DialogHeader>
          {/* Sử dụng Component Form đã tách */}
          <AssetFormContent />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="h-9">Hủy bỏ</Button>
            <Button type="button" onClick={saveCreate} className="h-9 bg-blue-600 hover:bg-blue-700 text-white">Lưu thông tin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- EDIT DIALOG --- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tài sản</DialogTitle>
          </DialogHeader>
          <AssetFormContent />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="h-9">Hủy bỏ</Button>
            <Button type="button" onClick={saveEdit} className="h-9 bg-blue-600 hover:bg-blue-700 text-white">Lưu thông tin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ASSIGN DIALOG (Giữ nguyên) --- */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Gắn nhân viên</DialogTitle></DialogHeader>
             <div className="grid gap-3 py-4">
                 <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {defaultAssignees.map(op => <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>)}
                    </SelectContent>
                 </Select>
             </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setAssignOpen(false)}>Hủy</Button>
                <Button onClick={saveAssign}>Xác nhận</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}