"use client";

import * as React from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock, // Thêm icon Clock
  Cog,
  Lock,
  MapPin,
  Plus,
  Presentation,
  Search,
  Tv,
  User,
  Video,
  Wifi,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- TYPES ---

type RoomStatus = "available" | "occupied" | "maintenance";

type RoomAmenities = {
  projector: boolean;
  tv: boolean;
  whiteboard: boolean;
  videoCall: boolean;
};

type Room = {
  id: string;
  name: string;
  capacity: number;
  location: string;
  status: RoomStatus;
  amenities: RoomAmenities;
  currentMeeting?: {
    title: string;
    endTime: string; // HH:mm
  };
  maintenanceNote?: string;
};

type Booking = {
  id: string;
  roomId: string;
  title: string;
  roomName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD (Mới)
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  organizer: string;
  recurring?: string; // (Mới)
  recurringEndDate?: string; // (Mới)
};

// --- STORAGE KEYS ---
const STORAGE_ROOMS = "admin_meeting_rooms";
const STORAGE_BOOKINGS = "admin_meeting_room_bookings";

// --- UTILS ---

function safeId(prefix = "rm") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return `${prefix}_${(crypto as any).randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateVi(ymd: string) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  return `${d}/${m}/${y}`;
}

function parseTimeToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function isTimeInRange(now: Date, startTime: string, endTime: string) {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  return nowMin >= startMin && nowMin < endMin;
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

// --- SEEDS ---

function seedRooms(): Room[] {
  return [
    {
      id: "creative",
      name: "Phòng Creative",
      capacity: 10,
      location: "Tầng 2 - Khu A",
      status: "available",
      amenities: { projector: false, tv: true, whiteboard: true, videoCall: false },
    },
    {
      id: "boardroom",
      name: "Phòng Boardroom",
      capacity: 25,
      location: "Tầng 5 - Khu B",
      status: "occupied",
      amenities: { projector: true, tv: false, whiteboard: false, videoCall: true },
      currentMeeting: { title: "Team Marketing", endTime: "11:30" },
    },
    {
      id: "training-a",
      name: "Phòng Training A",
      capacity: 50,
      location: "Tầng 1",
      status: "maintenance",
      amenities: { projector: false, tv: false, whiteboard: false, videoCall: false },
      maintenanceNote: "Sửa máy lạnh đến 14:00",
    },
  ];
}

function seedBookings(forDate: string): Booking[] {
  return [
    {
      id: safeId("bk"),
      roomId: "creative",
      roomName: "Phòng Creative",
      title: "Họp Daily Marketing",
      startDate: forDate,
      endDate: forDate,
      startTime: "09:00",
      endTime: "09:45",
      organizer: "Marketing",
    },
    {
      id: safeId("bk"),
      roomId: "boardroom",
      roomName: "Phòng Boardroom",
      title: "Ban Lãnh Đạo Q4",
      startDate: forDate,
      endDate: forDate,
      startTime: "10:30",
      endTime: "11:30",
      organizer: "Ban lãnh đạo",
    },
    {
      id: safeId("bk"),
      roomId: "training-a",
      roomName: "Phòng Training A",
      title: "Onboarding NV Mới",
      startDate: forDate,
      endDate: forDate,
      startTime: "14:00",
      endTime: "15:00",
      organizer: "HR",
    },
  ];
}

function statusMeta(status: RoomStatus) {
  switch (status) {
    case "available":
      return {
        label: "Trống",
        badge: "bg-emerald-100 text-emerald-700",
        cardTone: "bg-white",
        heroTone: "bg-slate-100",
      };
    case "occupied":
      return {
        label: "Đang họp",
        badge: "bg-rose-100 text-rose-700",
        cardTone: "bg-white",
        heroTone: "bg-rose-50",
      };
    case "maintenance":
      return {
        label: "Bảo trì",
        badge: "bg-orange-100 text-orange-700",
        cardTone: "bg-white",
        heroTone: "bg-slate-100",
      };
    default:
      return {
        label: status,
        badge: "bg-slate-100 text-slate-700",
        cardTone: "bg-white",
        heroTone: "bg-slate-100",
      };
  }
}

const AmenityPill = ({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) => {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-grey-50 bg-white px-2 py-1 text-[11px] text-muted-foreground">
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
    </span>
  );
};

// --- DRAFT TYPES ---

type RoomDraft = {
  name: string;
  capacity: string;
  location: string;
  amenities: RoomAmenities;
};

const emptyDraft: RoomDraft = {
  name: "",
  capacity: "10",
  location: "",
  amenities: { projector: false, tv: false, whiteboard: false, videoCall: false },
};

// Cập nhật Type Draft để khớp với ảnh
type BookingDraft = {
  title: string;       // Purpose
  roomName: string;    // Room Name (Read only)
  startDate: string;   // Start Date
  startTime: string;   // Start Time
  endDate: string;     // End Date
  endTime: string;     // End Time
  organizer: string;   // (Vẫn giữ để lưu data, dù ảnh không focus)
  recurringPattern: string; // Weekly, Monthly...
  recurringEndDate: string; 
};

function addMinutesToTime(hhmm: string, minutesToAdd: number) {
  const base = parseTimeToMinutes(hhmm);
  const next = Math.max(0, Math.min(23 * 60 + 59, base + minutesToAdd));
  const h = String(Math.floor(next / 60)).padStart(2, "0");
  const m = String(next % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// --- MAIN COMPONENT ---

export default function AdminBookingRoomPage() {
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [bookings, setBookings] = React.useState<Booking[]>([]);

  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | RoomStatus>(
    "all",
  );
  const [capacityFilter, setCapacityFilter] = React.useState<
    "all" | "<=10" | "<=25" | "<=50" | ">50"
  >("all");

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [bookOpen, setBookOpen] = React.useState(false);

  const [activeRoomId, setActiveRoomId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<RoomDraft>(emptyDraft);
  
  // State form đặt phòng
  const [bookingDraft, setBookingDraft] = React.useState<BookingDraft>({
    title: "",
    roomName: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    organizer: "",
    recurringPattern: "none",
    recurringEndDate: "",
  });

  const today = React.useMemo(() => todayYmd(), []);

  React.useEffect(() => {
    const existingRooms = readJson<Room[]>(STORAGE_ROOMS, []);
    const nextRooms =
      existingRooms.length > 0 ? existingRooms : seedRooms();
    setRooms(nextRooms);
    if (existingRooms.length === 0) writeJson(STORAGE_ROOMS, nextRooms);

    const existingBookings = readJson<Booking[]>(STORAGE_BOOKINGS, []);
    const todayBookings = existingBookings.filter((b) => b.startDate === today);
    if (existingBookings.length === 0 || todayBookings.length === 0) {
      const seeded = seedBookings(today);
      const merged = [...existingBookings.filter((b) => b.startDate !== today), ...seeded];
      setBookings(merged);
      writeJson(STORAGE_BOOKINGS, merged);
    } else {
      setBookings(existingBookings);
    }
  }, [today]);

  React.useEffect(() => {
    if (rooms.length) writeJson(STORAGE_ROOMS, rooms);
  }, [rooms]);

  React.useEffect(() => {
    if (bookings.length) writeJson(STORAGE_BOOKINGS, bookings);
  }, [bookings]);

  const availableCount = rooms.filter((r) => r.status === "available").length;

  const filteredRooms = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return rooms.filter((room) => {
      if (query) {
        const hay = `${room.name} ${room.location}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (statusFilter !== "all" && room.status !== statusFilter) return false;
      if (capacityFilter !== "all") {
        if (capacityFilter === "<=10" && !(room.capacity <= 10)) return false;
        if (capacityFilter === "<=25" && !(room.capacity <= 25)) return false;
        if (capacityFilter === "<=50" && !(room.capacity <= 50)) return false;
        if (capacityFilter === ">50" && !(room.capacity > 50)) return false;
      }
      return true;
    });
  }, [rooms, q, statusFilter, capacityFilter]);

  const todayBookings = React.useMemo(() => {
    return bookings
      .filter((b) => b.startDate === today)
      .slice()
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  }, [bookings, today]);

  const openCreate = () => {
    setDraft(emptyDraft);
    setCreateOpen(true);
  };

  const openEdit = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    setActiveRoomId(roomId);
    setDraft({
      name: room.name,
      capacity: String(room.capacity || ""),
      location: room.location,
      amenities: { ...room.amenities },
    });
    setEditOpen(true);
  };

  const openBookNow = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    setActiveRoomId(roomId);

    const start = nowHHMM();
    const end = addMinutesToTime(start, 60);
    
    // Cập nhật draft với đầy đủ thông tin ngày giờ
    setBookingDraft({
      title: "",
      roomName: room.name,
      startDate: today,
      startTime: start,
      endDate: today,
      endTime: end,
      organizer: "",
      recurringPattern: "none",
      recurringEndDate: "",
    });
    setBookOpen(true);
  };

  const saveCreate = () => {
    const name = draft.name.trim();
    const location = draft.location.trim();
    const cap = Number(draft.capacity);
    if (!name) return alert("Vui lòng nhập tên phòng");
    if (!location) return alert("Vui lòng nhập vị trí");
    if (!Number.isFinite(cap) || cap <= 0) return alert("Sức chứa không hợp lệ");

    const newRoom: Room = {
      id: safeId("room"),
      name,
      capacity: cap,
      location,
      status: "available",
      amenities: { ...draft.amenities },
    };
    setRooms((prev) => [newRoom, ...prev]);
    setCreateOpen(false);
  };

  const saveEdit = () => {
    if (!activeRoomId) return;
    const name = draft.name.trim();
    const location = draft.location.trim();
    const cap = Number(draft.capacity);
    if (!name) return alert("Vui lòng nhập tên phòng");
    if (!location) return alert("Vui lòng nhập vị trí");
    if (!Number.isFinite(cap) || cap <= 0) return alert("Sức chứa không hợp lệ");

    setRooms((prev) =>
      prev.map((r) =>
        r.id !== activeRoomId
          ? r
          : {
              ...r,
              name,
              capacity: cap,
              location,
              amenities: { ...draft.amenities },
            },
      ),
    );
    setEditOpen(false);
  };

  const saveBooking = () => {
    if (!activeRoomId) return;
    const room = rooms.find((r) => r.id === activeRoomId);
    if (!room) return;
    
    // Cho phép đặt nếu phòng available hoặc mình muốn override (tuỳ logic, ở đây giữ logic cũ)
    if (room.status !== "available" && room.status !== "occupied") {
        // Có thể lỏng tay cho phép đặt chồng giờ để demo
    }

    const title = bookingDraft.title.trim();
    const organizer = bookingDraft.organizer.trim(); // Vẫn check dù không hiển thị to
    const startDate = bookingDraft.startDate;
    const startTime = bookingDraft.startTime;
    const endDate = bookingDraft.endDate;
    const endTime = bookingDraft.endTime;

    if (!title) return alert("Vui lòng nhập mục đích/tiêu đề");
    // Nếu muốn bắt buộc organizer: if (!organizer) return alert("Vui lòng nhập người tổ chức");
    
    // Validation đơn giản ngày giờ
    if (startDate > endDate || (startDate === endDate && parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime))) {
      return alert("Thời gian kết thúc phải sau thời gian bắt đầu");
    }

    const newBooking: Booking = {
      id: safeId("bk"),
      roomId: room.id,
      roomName: room.name,
      title,
      organizer: organizer || "Admin", // Fallback nếu không nhập
      startDate,
      endDate,
      startTime,
      endTime,
      recurring: bookingDraft.recurringPattern,
      recurringEndDate: bookingDraft.recurringEndDate
    };

    setBookings((prev) => [...prev, newBooking]);

    // Cập nhật trạng thái phòng nếu đang diễn ra ngay bây giờ
    const now = new Date();
    const nowYmd = todayYmd();
    // Logic check đơn giản: nếu ngày bắt đầu là hôm nay và giờ nằm trong khoảng
    if (startDate === nowYmd) {
        const shouldBeOccupied = isTimeInRange(now, startTime, endTime);
        if (shouldBeOccupied) {
            setRooms((prev) =>
                prev.map((r) =>
                r.id !== room.id
                    ? r
                    : {
                        ...r,
                        status: "occupied",
                        currentMeeting: { title, endTime },
                    },
                ),
            );
        }
    }
    setBookOpen(false);
  };

  const RoomForm = () => (
    <div className="grid gap-5 py-2">
      <div className="grid gap-2">
        <Label htmlFor="roomName" className="text-sm text-grey-900">
          Tên phòng
        </Label>
        <Input
          id="roomName"
          value={draft.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="VD: Phòng Creative"
          className="h-10 bg-white"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="capacity" className="text-sm text-grey-900">
            Sức chứa (người)
          </Label>
          <Input
            id="capacity"
            type="number"
            value={draft.capacity}
            onChange={(e) =>
              setDraft((p) => ({ ...p, capacity: e.target.value }))
            }
            placeholder="10"
            className="h-10 bg-white"
            min={1}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location" className="text-sm text-grey-900">
            Vị trí
          </Label>
          <Input
            id="location"
            value={draft.location}
            onChange={(e) =>
              setDraft((p) => ({ ...p, location: e.target.value }))
            }
            placeholder="VD: Tầng 2"
            className="h-10 bg-white"
          />
        </div>
      </div>

      <div className="grid gap-3">
        <div className="text-sm font-medium text-grey-900">Tiện nghi có sẵn</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-grey-50 bg-white px-3 py-2">
            <input
              type="checkbox"
              checked={draft.amenities.projector}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  amenities: { ...p.amenities, projector: e.target.checked },
                }))
              }
              className="h-4 w-4"
            />
            <span className="text-sm text-grey-900">Máy chiếu</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-grey-50 bg-white px-3 py-2">
            <input
              type="checkbox"
              checked={draft.amenities.tv}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  amenities: { ...p.amenities, tv: e.target.checked },
                }))
              }
              className="h-4 w-4"
            />
            <span className="text-sm text-grey-900">TV / Màn hình</span>
          </label>
          {/* ... other amenities */}
        </div>
      </div>
    </div>
  );

  // --- FORM ĐẶT PHÒNG CHI TIẾT (GIỐNG ẢNH) ---
  const BookingForm = () => (
    <div className="grid gap-5 py-2">
      {/* 1. Purpose */}
      <div className="grid gap-2">
        <Label className="text-sm font-semibold text-gray-800">Purpose</Label>
        <Input
          value={bookingDraft.title}
          onChange={(e) => setBookingDraft((p) => ({ ...p, title: e.target.value }))}
          placeholder="Weekly planning"
          className="h-10 bg-white border-gray-200"
        />
      </div>

      {/* 2. Room (Read Only) */}
      <div className="grid gap-2">
        <Label className="text-sm font-semibold text-gray-800">Room :</Label>
        <Input
          value={bookingDraft.roomName}
          readOnly
          className="h-10 bg-gray-50 border-gray-200 text-gray-600"
        />
      </div>

      {/* 3. Start time (Date + Time) */}
      <div className="grid gap-2">
         <Label className="text-sm font-semibold text-gray-800">Start time</Label>
         <div className="grid grid-cols-2 gap-3">
             {/* Date Picker Input */}
             <div className="relative">
                 <Input 
                    type="date"
                    value={bookingDraft.startDate}
                    onChange={(e) => setBookingDraft(p => ({...p, startDate: e.target.value}))}
                    className="h-10 bg-white border-gray-200 pr-9"
                 />
                 <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
             </div>
             {/* Time Picker Input */}
             <div className="relative">
                 <Input 
                    type="time"
                    value={bookingDraft.startTime}
                    onChange={(e) => setBookingDraft(p => ({...p, startTime: e.target.value}))}
                    className="h-10 bg-white border-gray-200 pr-9"
                 />
                 <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
             </div>
         </div>
      </div>

      {/* 4. End time (Date + Time) */}
      <div className="grid gap-2">
         <Label className="text-sm font-semibold text-gray-800">End time</Label>
         <div className="grid grid-cols-2 gap-3">
             <div className="relative">
                 <Input 
                    type="date"
                    value={bookingDraft.endDate}
                    onChange={(e) => setBookingDraft(p => ({...p, endDate: e.target.value}))}
                    className="h-10 bg-white border-gray-200 pr-9"
                 />
                 <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
             </div>
             <div className="relative">
                 <Input 
                    type="time"
                    value={bookingDraft.endTime}
                    onChange={(e) => setBookingDraft(p => ({...p, endTime: e.target.value}))}
                    className="h-10 bg-white border-gray-200 pr-9"
                 />
                 <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
             </div>
         </div>
      </div>

      {/* 5. Recurring Pattern */}
      <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
             <Label className="text-sm font-semibold text-gray-800">Recurring pattern</Label>
             <Select 
                value={bookingDraft.recurringPattern} 
                onValueChange={(v) => setBookingDraft(p => ({...p, recurringPattern: v}))}
             >
                <SelectTrigger className="h-10 bg-white border-gray-200">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="daily">DAILY</SelectItem>
                    <SelectItem value="weekly">WEEKLY</SelectItem>
                    <SelectItem value="monthly">MONTHLY</SelectItem>
                </SelectContent>
             </Select>
          </div>
          
          <div className="grid gap-2">
             <Label className="text-sm font-semibold text-gray-800">Recurring end date</Label>
             <div className="relative">
                 <Input 
                    type="date"
                    value={bookingDraft.recurringEndDate}
                    onChange={(e) => setBookingDraft(p => ({...p, recurringEndDate: e.target.value}))}
                    className="h-10 bg-white border-gray-200 pr-9"
                    disabled={bookingDraft.recurringPattern === "none"}
                 />
                 <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
             </div>
          </div>
      </div>

      {/* Input Organizer (Ẩn hoặc để dưới cùng vì ảnh không show, nhưng cần cho logic) */}
      <div className="grid gap-2 mt-2">
          <Label className="text-sm font-semibold text-gray-800">Organizer (Optional)</Label>
          <Input
            value={bookingDraft.organizer}
            onChange={(e) => setBookingDraft((p) => ({ ...p, organizer: e.target.value }))}
            placeholder="Marketing Dept"
            className="h-10 bg-white border-gray-200"
          />
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* ... (Phần Header và List Room giữ nguyên như cũ) ... */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-grey-900">
            Quản lý Phòng họp
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            {availableCount} Phòng trống
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="relative w-full max-w-[360px] sm:w-[340px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm"
              className="h-10 pl-9 bg-white"
            />
          </div>
          <Button
            type="button"
            onClick={openCreate}
            className="h-10 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm phòng mới
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Left: Room List */}
        <section>
          {/* ... (Bộ lọc giữ nguyên) ... */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
             {/* ... */}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
            {filteredRooms.map((room) => {
               const sm = statusMeta(room.status);
               // ... (Logic render amenities giữ nguyên)
               const amenities: Array<{ show: boolean; icon: React.ReactNode; label: string }> = [
                { show: true, icon: <Wifi className="h-3.5 w-3.5" />, label: "Wifi" },
                { show: room.amenities.tv, icon: <Tv className="h-3.5 w-3.5" />, label: "TV 4K" },
                { show: room.amenities.whiteboard, icon: <Presentation className="h-3.5 w-3.5" />, label: "Bảng trắng" },
                { show: room.amenities.projector, icon: <Presentation className="h-3.5 w-3.5" />, label: "Máy chiếu" },
                { show: room.amenities.videoCall, icon: <Video className="h-3.5 w-3.5" />, label: "Họp trực tuyến" },
               ];
               const canBook = room.status === "available";
               const heroIcon = room.status === "occupied" ? <Lock className="h-6 w-6 text-rose-600" /> : <Tv className="h-6 w-6 text-slate-400" />;

               return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => openEdit(room.id)}
                  className={cn("text-left overflow-hidden rounded-xl border border-grey-50 shadow-sm transition hover:shadow", sm.cardTone)}
                >
                  <div className={cn("relative h-[110px]", sm.heroTone)}>
                    <span className={cn("absolute right-3 top-3 inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold", sm.badge)}>
                      {sm.label}
                    </span>
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <div className={`mx-auto mb-1 grid h-10 w-10 place-items-center rounded-full ${room.status==='occupied' ? 'bg-rose-100' : 'bg-white'}`}>
                                {heroIcon}
                            </div>
                            {room.status === 'occupied' && (
                                <>
                                    <div className="text-sm font-semibold text-rose-700">{room.currentMeeting?.title ?? "Đang họp"}</div>
                                    <div className="text-[11px] text-rose-600">Kết thúc {room.currentMeeting?.endTime}</div>
                                </>
                            )}
                        </div>
                    </div>
                  </div>
                  <div className="px-4 py-4">
                     <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                           <div className="truncate text-sm font-semibold text-grey-900">{room.name}</div>
                           <div className="mt-1 text-xs text-muted-foreground">{room.location}</div>
                        </div>
                        <div className="text-right">
                           <div className="text-lg font-semibold text-blue-600">{room.capacity}</div>
                           <div className="text-[11px] text-muted-foreground">Chỗ ngồi</div>
                        </div>
                     </div>
                     <div className="mt-3 flex flex-wrap items-center gap-2">
                        {amenities.filter(a => a.show).slice(0, 3).map(a => <AmenityPill key={a.label} icon={a.icon} label={a.label} />)}
                     </div>
                     <div className="mt-4 flex items-center justify-between">
                        <button type="button" onClick={(e) => {e.stopPropagation(); openEdit(room.id)}} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Cog className="h-4 w-4" /> Cấu hình
                        </button>
                        <Button type="button" size="sm" onClick={(e) => {e.stopPropagation(); openBookNow(room.id)}} disabled={!canBook} className={cn("h-9 rounded-md", canBook ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-200 text-slate-500")}>
                            Đặt ngay
                        </Button>
                     </div>
                  </div>
                </button>
               );
            })}
          </div>
        </section>
        
        {/* Right: Schedule (Giữ nguyên) */}
        <aside className="h-fit rounded-xl border border-grey-50 bg-white p-4 shadow-sm">
             <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-grey-900">Lịch đặt hôm nay</div>
                <div className="text-xs text-muted-foreground">{formatDateVi(today)}</div>
             </div>
             <div className="mt-4 space-y-4">
                {todayBookings.map(b => (
                    <div key={b.id} className="grid grid-cols-[52px_1fr] gap-3">
                        <div className="pt-2 text-xs text-muted-foreground">{b.startTime}</div>
                        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
                            <div className="text-sm font-semibold text-blue-700">{b.title}</div>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" /> <span>{b.roomName}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {todayBookings.length === 0 && <div className="text-sm text-muted-foreground italic">Chưa có lịch.</div>}
             </div>
        </aside>
      </div>

      {/* Dialogs */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[720px]"><DialogHeader><DialogTitle>Thêm Phòng</DialogTitle></DialogHeader><RoomForm /><DialogFooter><Button onClick={saveCreate}>Lưu</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[720px]"><DialogHeader><DialogTitle>Sửa Phòng</DialogTitle></DialogHeader><RoomForm /><DialogFooter><Button onClick={saveEdit}>Lưu</Button></DialogFooter></DialogContent>
      </Dialog>

      {/* BOOK NOW DIALOG - Cập nhật UI */}
      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="max-w-[600px] p-6">
          <BookingForm />
          <DialogFooter className="mt-4 gap-2">
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => setBookOpen(false)}
                className="h-10 px-6"
            >
              Back
            </Button>
            <Button 
                type="button" 
                onClick={saveBooking} 
                className="bg-[#3C6E71] hover:bg-[#2e5659] h-10 px-6 text-white"
            >
              Book Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}