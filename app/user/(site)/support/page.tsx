"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Center, Loader } from "@mantine/core";

import {
  getMyAssignedTickets,
  getMyTickets,
  getTicketCategories,
} from "@/services/DACN/Tickets";
import { DACN } from "@/services/DACN/typings";
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
  formatTicketStatus,
  statusBadgeVariant,
  type TicketStatus,
} from "@/lib/support/tickets";
import { formatDate } from "@/lib/utils";

type Filters = {
  status: "all" | TicketStatus;
  category: "all" | string;
};

const TicketCreateModal = dynamic(
  () => import("@/components/support/TicketCreateModal"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <Center style={{ height: "100%" }}>
          <Loader color="green" />
        </Center>
      </div>
    ),
  },
);

function SupportPage() {
  const [tickets, setTickets] = React.useState<DACN.TicketResponseDto[]>([]);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState("My Tickets");

  React.useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const [filters, setFilters] = React.useState<Filters>({
    status: "all",
    category: "all",
  });
  const [categoryData, setCategoryData] = React.useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [limit, setLimit] = React.useState(6);
  const tabs = ["My Tickets", "My Assigned Tickets"];

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getTicketCategories();
        // SỬA LỖI: Thêm optional chaining (?.) vào res.data để tránh lỗi map trên null
        setCategoryData(
          res?.data?.map((item) => ({
            value: item.id,
            label: item.name,
          })) || [],
        );
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        switch (activeTab) {
          case "My Tickets": {
            const res = await getMyTickets();
            const myTickets = res.data?.items || [];
            setTickets(myTickets);
            break;
          }
          case "My Assigned Tickets": {
            const assignedRes = await getMyAssignedTickets();
            const assignedTickets = assignedRes.data?.items || [];
            setTickets(assignedTickets);
            break;
          }
          default:
            break;
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        setLoading(false);
      }
    };

    fetchTickets();
  }, [activeTab, openCreateModal]);

  const filtered = React.useMemo(() => {
    return tickets.filter((t) => {
      if (filters.status !== "all" && t.status !== filters.status) return false;
      // SỬA LỖI: Thêm optional chaining (?.) để kiểm tra an toàn t.category
      if (filters.category !== "all" && t.category?.name !== filters.category)
        return false;
      return true;
    });
  }, [filters, tickets]);

  const visible = filtered.slice(0, limit);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Tổng số:{" "}
          <span className="font-semibold text-foreground">
            {filtered.length}
          </span>{" "}
          Yêu cầu
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-main-600 text-white hover:bg-[#0c820c] hover:text-white rounded-lg"
            onClick={() => setOpenCreateModal(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Tạo yêu cầu
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
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="OPEN">Mở (Open)</SelectItem>
              <SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
              <SelectItem value="CLOSED">Đã đóng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-[220px]">
          <Select
            value={filters.category}
            onValueChange={(v) =>
              setFilters((p) => ({
                ...p,
                category: v as Filters["category"],
              }))
            }
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categoryData.map((cat) => (
                <SelectItem key={cat.value} value={cat.label}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                activeTab === tab
                  ? "bg-gray-100 border-gray-300 text-main-600"
                  : "bg-white border-transparent text-gray-500 hover:bg-gray-50"
              }`}
              type="button"
            >
              {tab === "My Tickets" ? "Yêu cầu của tôi" : "Yêu cầu được giao"}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <Center style={{ height: "50vh" }}>
          <Loader color="green" />
        </Center>
      )}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visible &&
          !loading &&
          visible.map((t) => (
            <Link
              key={t.id}
              href={`/user/support/${
                activeTab === "My Tickets" ? "my-tickets" : "assigned-tickets"
              }/${t.id}`}
              className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <span className="text-sm font-bold">S</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground line-clamp-1">
                    {t.title}
                  </div>
                </div>
                <Badge
                  variant={statusBadgeVariant(t.status)}
                  className="rounded-full shrink-0"
                >
                  {formatTicketStatus(t.status)}
                </Badge>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div>
                  <div className="text-muted-foreground">Người gửi</div>
                  {/* SỬA LỖI: Thêm optional chaining để không crash nếu employee bị null */}
                  <div className="mt-1 font-semibold text-foreground truncate">
                    {t.employee?.email || "Không xác định"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Ngày gửi</div>
                  <div className="mt-1 font-semibold text-foreground">
                    {formatDate(t.createdAt, "DD/MM/YYYY")}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Danh mục</div>
                  {/* SỬA LỖI: Thêm optional chaining để không crash nếu category bị null */}
                  <div className="mt-1 font-semibold text-foreground truncate">
                    {t.category?.name || "Chưa phân loại"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Mã Ticket</div>
                  <div className="mt-1 font-semibold text-foreground truncate">
                    {t.id}
                  </div>
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
            type="button"
          >
            Tải thêm
          </Button>
        ) : null}
      </div>
      {openCreateModal && (
        <TicketCreateModal
          categoryData={categoryData}
          onClose={() => setOpenCreateModal(false)}
        />
      )}
    </div>
  );
}

export default function SupportPageWrapper() {
  return (
    <React.Suspense
      fallback={
        <Center style={{ height: "100vh" }}>
          <Loader color="green" />
        </Center>
      }
    >
      <SupportPage />
    </React.Suspense>
  );
}