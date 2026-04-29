"use client";

import * as React from "react";
import Link from "next/link";
import { Filter, Plus, RefreshCw, X } from "lucide-react";
import {
  getMyAssignedTickets,
  getMyTickets,
  getTicketCategories,
  createSupportTicket,
} from "@/services/DACN/Tickets";
import {
  Button as MantineButton,
  TextInput,
  Textarea,
  Select as MantineSelect,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { Center, Loader } from "@mantine/core";
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
  type TicketPriority,
  type TicketStatus,
} from "@/lib/support/tickets";
import { formatDate } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { set } from "react-hook-form";

type TicketCreateValue = {
  category_id: string;
  title: string;
  description: string;
};

type Filters = {
  status: "all" | TicketStatus;
  category: "all" | "IT Support";
};

function TicketCreateModal({
  categoryData,

  onClose,
}: {
  categoryData: any[];

  onClose: () => void;
}) {
  const form = useForm<TicketCreateValue>({
    initialValues: {
      category_id: "",
      title: "",
      description: "",
    },

    validate: {
      category_id: (value) =>
        value.length < 1 ? "Vui lòng chọn loại yêu cầu" : null,
      title: (value) =>
        value.trim().length < 3 ? "Vui lòng nhập tiêu đề" : null,
      description: (value) =>
        value.trim().length < 3 ? "Vui lòng nhập mô tả vấn đề" : null,
    },
  });

  const handleSubmit = async (values: TicketCreateValue) => {
    try {
      await createSupportTicket({
        title: values.title,
        description: values.description,
        category_id: values.category_id,
      });

      notifications.show({
        title: "Success",
        message: "Ticket created successfully",
        color: "green",
      });
      form.reset();
      onClose();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error?.message || error,
        color: "red",
      });
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header Modal */}
        <div className="p-6 pb-2">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <RefreshCw size={32} className="text-gray-800" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create Support Ticket
              </h2>
              <p className="text-sm text-gray-500">
                Fill in the details to create a new support ticket.
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4">
          <div className="p-6 space-y-4">
            <div>
              <MantineSelect
                data={categoryData}
                label="Loại yêu cầu"
                placeholder="Chọn loại yêu cầu"
                {...form.getInputProps("category_id")}
              />
            </div>

            <div>
              <TextInput
                label="Tiêu đề"
                labelProps={{
                  className: "block text-sm font-medium text-gray-600 mb-1",
                }}
                required
                placeholder="Nhập tiêu đề"
                {...form.getInputProps("title")}
              />
            </div>

            <div>
              <Textarea
                rows={3}
                label="Mô tả"
                labelProps={{
                  className: "block text-sm font-medium text-gray-600 mb-1",
                }}
                placeholder="Mô tả chi tiết"
                {...form.getInputProps("description")}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="px-6 py-3 pt-0">
            {/* <button
          type="submit"
            className={`w-full bg-emerald-500 border border-emerald-500 text-white font-semibold py-2.5 rounded cursor-pointer`}
          >
            Submit
          </button> */}
            <MantineButton
              fullWidth
              color="green.7"
              type="submit"
              h={45}
              fw={600}
            >
              Create
            </MantineButton>
          </div>
        </form>
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full border border-red-500 text-red-500 font-semibold py-2.5 rounded hover:bg-red-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [tickets, setTickets] = React.useState<DACN.TicketResponseDto[]>([]);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState(() => {
    return searchParams?.get("tab") || "My Tickets";
  });
  const [filters, setFilters] = React.useState<Filters>({
    status: "all",
    category: "all",
  });
  const [categoryData, setCategoryData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [limit, setLimit] = React.useState(6);
  const tabs = ["My Tickets", "My Assigned Tickets"];
  React.useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        switch (activeTab) {
          case "My Tickets":
            const res = await getMyTickets();
            const myTickets = res.data?.items || [];
            setTickets(myTickets);
            break;
          case "My Assigned Tickets":
            const assignedRes = await getMyAssignedTickets();
            const assignedTickets = assignedRes.data?.items || [];
            setTickets(assignedTickets);
            break;
          default:
            break;
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await getTicketCategories();
        setCategoryData(
          res?.data.map((item) => ({
            value: item.id,
            label: item.name,
          })) || [],
        );
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchTickets();
    fetchCategories();
  }, [activeTab, openCreateModal]);

  const filtered = React.useMemo(() => {
    return tickets.filter((t) => {
      if (filters.status !== "all" && t.status !== filters.status) return false;
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
          Total:{" "}
          <span className="font-semibold text-foreground">
            {filtered.length}
          </span>{" "}
          Tickets
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-main-600 text-white hover:bg-[#0c820c] hover:text-white rounded-lg"
            onClick={() => setOpenCreateModal(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Create
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
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
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
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="IT Support">IT Support</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="other">Other</SelectItem>
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
            >
              {tab}
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
              href={`/user/support/${activeTab === "My Tickets" ? "my-tickets" : "assigned-tickets"}/${t.id}`}
              className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <span className="text-sm font-bold">S</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {t.title}
                  </div>
                </div>
                <Badge
                  variant={statusBadgeVariant(t.status)}
                  className="rounded-full"
                >
                  {formatTicketStatus(t.status)}
                </Badge>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div>
                  <div className="text-muted-foreground">User</div>
                  <div className="mt-1 font-semibold text-foreground">
                    {t.employee.email}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Submitted</div>
                  <div className="mt-1 font-semibold text-foreground">
                    {formatDate(t.createdAt, "DD/MM/YYYY")}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Category</div>
                  <div className="mt-1 font-semibold text-foreground">
                    {t.category.name}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Ticket ID</div>
                  <div className="mt-1 font-semibold text-foreground">
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
          >
            Load More
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
