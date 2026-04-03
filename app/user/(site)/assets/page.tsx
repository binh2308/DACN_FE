"use client";

import * as React from "react";
import { Package, Search, Shield, Wrench } from "lucide-react";
import {
  AssetType,
  AssetStatus,
  GetAssetsParams,
  getAssets,
  Asset,
} from "@/services/DACN/asset";
import { decodeJwt } from "jose";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSupportTicket } from "@/lib/support/tickets";
import { m } from "framer-motion";

type AssignedAsset = {
  id: string;
  name: string;
  type: AssetType;
  owner: { id: string; name: string } | null;
  location: string | null;
  condition: AssetStatus;
  purchase_date: string;
  warranty_expiration_date: string;
  maintenance_schedule: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateViFromIso(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function warrantyLabel(expireIso: string) {
  const now = new Date();
  const end = new Date(expireIso);
  if (Number.isNaN(end.getTime())) return "";
  const remainingDays = daysBetween(now, end);
  if (remainingDays <= 0) return "Hết bảo hành";
  const years = Math.floor(remainingDays / 365);
  if (years >= 1) return `Còn BH ${years} năm`;
  const months = Math.max(1, Math.floor(remainingDays / 30));
  return `Còn BH ${months} tháng`;
}

function typeMeta(type: AssetType) {
  switch (type) {
    case "PRIVATE":
      return { label: "Cá nhân", badge: "bg-indigo-100 text-indigo-700" };
    case "PUBLIC":
      return { label: "Công ty", badge: "bg-blue-100 text-blue-700" };
    default:
      return { label: type, badge: "bg-gray-100 text-gray-700" };
  }
}

function conditionMeta(condition: AssetStatus) {
  switch (condition) {
    case "NEW":
      return { label: "Mới", badge: "bg-green-100 text-green-700" };
    case "USED":
      return { label: "Đã sử dụng", badge: "bg-yellow-100 text-yellow-700" };
    case "UNDER_MAINTENANCE":
      return {
        label: "Bảo trì",
        badge: "bg-orange-100 text-orange-700",
      };
    case "BROKEN":
      return { label: "Hỏng", badge: "bg-red-100 text-red-700" };
    default:
      return { label: condition, badge: "bg-gray-100 text-gray-700" };
  }
}

export default function UserAssetsPage() {
  const [q, setQ] = React.useState("");
  const [myAssets, setMyAssets] = React.useState<Asset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [type, setType] = React.useState<AssetType>("PRIVATE");
  const [condition, setCondition] = React.useState<AssetStatus | "ALL">("ALL");
  const [page, setPage] = React.useState(1);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportAsset, setReportAsset] = React.useState<Asset | null>(null);
  const [reportIssue, setReportIssue] = React.useState("");
  const [reportError, setReportError] = React.useState<string | null>(null);
  const [submittedTicketId, setSubmittedTicketId] = React.useState<
    string | null
  >(null);
  React.useEffect(() => {
    const fetchMyAssets = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const payload = decodeJwt(token) as any;
        const employeeId = payload?.sub;
        if (!employeeId) return;
        const params: GetAssetsParams = {
          ownerEmployeeId: employeeId,
        };
        const res = await getAssets(params);
        setMyAssets(res.data?.items);
      } catch (error) {
        console.error("Failed to fetch assets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyAssets();
  }, []);
  const pageSize = 6;

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return myAssets.filter((it) => {
      const matchesQ = !query || it.name.toLowerCase().includes(query);
      const matchesType = type === "PRIVATE" || it.type === type;
      const matchesCond = condition === "ALL" || it.condition === condition;
      console.log({ matchesQ, matchesType, matchesCond });
      return matchesQ && matchesType && matchesCond;
    });
  }, [q, type, condition]);
  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length ?? myAssets.length / pageSize),
  );
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems =
    filtered.length !== 0 || condition !== "ALL"
      ? filtered.slice(pageStart, pageStart + pageSize)
      : myAssets.slice(pageStart, pageStart + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [q, type, condition]);

  const openReport = (asset: Asset) => {
    setReportAsset(asset);
    setReportIssue("");
    setReportError(null);
    setSubmittedTicketId(null);
    setReportOpen(true);
  };

  const submitReport = () => {
    if (!reportAsset) return;
    const note = reportIssue.trim();
    if (!note) {
      setReportError("Vui lòng nhập mô tả tình trạng / yêu cầu sửa chữa.");
      return;
    }

    const tm = typeMeta(reportAsset.type);
    const cm = conditionMeta(reportAsset.condition);
    const issue = [
      `Tài sản: ${reportAsset.name}`,
      `Mã tài sản: ${reportAsset.id}`,
      `Loại: ${tm.label}`,
      `Tình trạng hiện tại: ${cm.label}`,
      `Vị trí: ${reportAsset.location || "--"}`,
      "---",
      note,
    ].join("\n");

    const ticket = createSupportTicket({
      subject: `Yêu cầu sửa chữa tài sản: ${reportAsset.name}`,
      issue,
      username: "user",
    });

    setSubmittedTicketId(ticket.id);
    setReportError(null);
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-grey-900">
            Tài sản được cấp
          </div>
          <Badge variant="secondary" className="text-[11px] font-medium">
            Tổng: {filtered.length.toLocaleString("vi-VN")} thiết bị
          </Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mt-5">
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên tài sản..."
            className="h-9 pl-9 text-sm bg-white"
          />
        </div>
        <div className="flex items-center gap-3 md:ml-auto">
          {/* <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="h-9 w-[160px] bg-white text-sm">
              <SelectValue placeholder="Tất cả loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRIVATE">Cá nhân</SelectItem>
              <SelectItem value="COMPANY">Công ty</SelectItem>
            </SelectContent>
          </Select> */}

          <Select
            value={condition}
            onValueChange={(v) => setCondition(v as any)}
          >
            <SelectTrigger className="h-9 w-[180px] bg-white text-sm">
              <SelectValue placeholder="Tất cả tình trạng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả tình trạng</SelectItem>
              <SelectItem value="NEW">Mới</SelectItem>
              <SelectItem value="UNDER_MAINTENANCE">Bảo trì</SelectItem>
              <SelectItem value="GOOD">Tốt</SelectItem>
              <SelectItem value="USED">Đã sử dụng</SelectItem>
              <SelectItem value="BROKEN">Hỏng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white border border-grey-50 rounded-lg mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-background border-b border-grey-50">
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Tài sản</th>
                <th className="px-4 py-3 font-semibold">Loại</th>
                <th className="px-4 py-3 font-semibold">Tình trạng</th>
                <th className="px-4 py-3 font-semibold">Vị trí</th>
                <th className="px-4 py-3 font-semibold">Ngày mua / BH</th>
                <th className="px-4 py-3 font-semibold">Lịch bảo trì</th>
                <th className="px-4 py-3 font-semibold text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((it) => {
                const tm = typeMeta(it.type);
                const cm = conditionMeta(it.condition);
                const wLabel = warrantyLabel(it.warranty_expiration_date);
                return (
                  <tr
                    key={it.id}
                    className="border-b border-grey-50 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-neutral-background border border-grey-50 flex items-center justify-center">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-grey-900 truncate">
                            {it.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {it.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${tm.badge}`}
                      >
                        <Shield className="w-3.5 h-3.5 mr-1" /> {tm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${cm.badge}`}
                      >
                        {cm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {it.location || <span className="italic">--</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-grey-900">
                        {formatDateViFromIso(it.purchase_date)}
                      </div>
                      {wLabel && (
                        <div className="text-[10px] text-green-600">
                          {wLabel}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Wrench className="w-4 h-4" />{" "}
                        {formatDateViFromIso(it.maintenance_schedule)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => openReport(it)}
                      >
                        Báo cáo
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {loading === true && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-muted-foreground italic"
                  >
                    Đang tải...
                  </td>
                </tr>
              )}
              {pageItems.length === 0 && loading === false && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-muted-foreground italic"
                  >
                    Không có tài sản nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-grey-50 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Hiển thị {filtered.length ? pageStart + 1 : 0} -{" "}
            {Math.min(pageStart + pageSize, filtered.length)} trên{" "}
            {filtered.length}
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              ‹
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pageCount}
            >
              ›
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Báo cáo tình trạng tài sản</DialogTitle>
            <DialogDescription>
              Gửi yêu cầu sửa chữa để Admin tiếp nhận.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border bg-muted/20 p-3 text-sm">
              <div className="font-semibold text-foreground">
                {reportAsset?.name || "--"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Mã: {reportAsset?.id || "--"}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả tình trạng / yêu cầu</Label>
              <Textarea
                value={reportIssue}
                onChange={(e) => {
                  setReportIssue(e.target.value);
                  setReportError(null);
                }}
                rows={5}
                placeholder="Ví dụ: Bàn phím bị liệt phím, màn hình bị sọc..."
                className="bg-white mt-2"
              />
              {reportError ? (
                <div className="text-xs text-red-600">{reportError}</div>
              ) : null}
              {submittedTicketId ? (
                <div className="text-xs text-emerald-700">
                  Đã gửi yêu cầu. Mã ticket: {submittedTicketId}
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReportOpen(false)}
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={submitReport}
              disabled={Boolean(submittedTicketId)}
            >
              Gửi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
