"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, MapPin, Trash2, Users, Clock, Pencil } from "lucide-react";
import { useRequest } from "ahooks";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteBooking,
  getBookingsOfEmployee,
  type BookingByRoom,
  type BookingDetailDto,
} from "@/services/DACN/Booking";
import { getRooms, type Room } from "@/services/DACN/Rooms";

// --- Helper Functions ---
type StatusFilter = "all" | "upcoming" | "past";

const normalizeKey = (value: string) =>
  value.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");

const formatTimeRange = (startIso: string, endIso: string) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = start.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "2-digit" });
  const startTime = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const endTime = end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return { date, time: `${startTime} - ${endTime}` };
};

type BookingSlot = {
  id: string;
  roomId: string;
  roomName: string;
  organizer: string;
  start: string;
  end: string;
  attendees: Array<{ id: string; name: string; email?: string }>;
};

const isPast = (slot: BookingSlot, now: number) => new Date(slot.end).getTime() < now;

function formatPersonName(person: any) {
  if (!person) return "";
  const direct = String(person?.name ?? "").trim();
  if (direct) return direct;
  const parts = [person?.lastName, person?.middleName, person?.firstName]
    .map((p: any) => String(p ?? "").trim())
    .filter(Boolean);
  if (parts.length) return parts.join(" ");
  return String(person?.email ?? "").trim();
}

function getInitials(name: string) {
  const value = String(name ?? "").trim();
  if (!value) return "?";
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function normalizeBookingsByEmployeeResponse(data: unknown): Array<BookingByRoom | BookingDetailDto> {
  if (!data) return [];
  const payload = (data as any)?.data ?? data;
  if (Array.isArray(payload)) return payload as any[];
  if (typeof payload === "object" && payload !== null && Array.isArray((payload as any).data)) {
    return (payload as any).data as any[];
  }
  return [];
}

function toSlot(b: any): BookingSlot | null {
  // New backend shape
  const roomName = String(b?.room?.name ?? b?.roomName ?? "").trim();
  const roomId = String(b?.room?.id ?? "").trim();
  const start = String(b?.start_time ?? b?.startTime ?? "").trim();
  const end = String(b?.end_time ?? b?.endTime ?? "").trim();
  const organizer =
    String(b?.name ?? "").trim() ||
    formatPersonName(b?.employee) ||
    "-";

  const id = String(b?.id ?? "").trim();
  if (!id || !start || !end || !roomName) return null;

  const attendeesRaw = Array.isArray(b?.attendees) ? b.attendees : [];
  const attendees = attendeesRaw
    .map((a: any) => ({
      id: String(a?.id ?? "").trim(),
      name: formatPersonName(a) || String(a?.email ?? "").trim() || "-",
      email: String(a?.email ?? "").trim() || undefined,
    }))
    .filter((a: any) => a.id && a.name);

  return {
    id,
    roomId: roomId || `room:${normalizeKey(roomName)}`,
    roomName,
    organizer,
    start,
    end,
    attendees,
  };
}
function normalizeRoomsResponse(data: unknown): Room[] {
    if (!data) return [];
    if (Array.isArray(data)) return data as Room[];
    if (typeof data === "object" && data !== null && "data" in data) {
        const arr = (data as any).data;
        if (Array.isArray(arr)) return arr as Room[];
    }
    return [];
}

export default function BookedRoomsPage() {
  const router = useRouter();
  const [organizer, setOrganizer] = React.useState<string>("all");
  const [status, setStatus] = React.useState<StatusFilter>("upcoming");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => { setNow(Date.now()); }, []);

  const { data: bookingsRaw, loading: bookingsLoading, error: bookingsError, refresh: refreshBookings } = useRequest(getBookingsOfEmployee);
  const { data: roomsRaw, loading: roomsLoading, error: roomsError } = useRequest(getRooms);
  const { runAsync: runDeleteBooking } = useRequest(deleteBooking, { manual: true });

  const onDelete = React.useCallback(async (bookingId: string) => {
      const ok = window.confirm("Bạn có chắc muốn hủy booking này?");
      if (!ok) return;
      setDeletingId(bookingId);
      try { await runDeleteBooking(bookingId); await refreshBookings(); } 
      catch (err) { alert((err as any)?.message || "Xóa booking thất bại."); } 
      finally { setDeletingId(null); }
  }, [refreshBookings, runDeleteBooking]);

  const bookings = React.useMemo(() => normalizeBookingsByEmployeeResponse(bookingsRaw), [bookingsRaw]);
  const rooms = React.useMemo(() => normalizeRoomsResponse(roomsRaw), [roomsRaw]);

  const roomByName = React.useMemo(() => {
    const map = new Map<string, Room>();
    for (const r of rooms) { if (r?.name) map.set(normalizeKey(r.name), r); }
    return map;
  }, [rooms]);

  const roomsWithBookings = React.useMemo(() => {
    if (now === null) return [];
    const slots: BookingSlot[] = bookings
      .map((b) => toSlot(b))
      .filter(Boolean) as BookingSlot[];

    const filtered = slots.filter((slot) => {
        if (organizer !== "all" && slot.organizer !== organizer) return false;
        if (status === "past" && !isPast(slot, now)) return false;
        if (status === "upcoming" && isPast(slot, now)) return false;
        return true;
    });

    const map = new Map<string, BookingSlot[]>();
    for (const slot of filtered) {
        const list = map.get(slot.roomId) ?? [];
        list.push(slot);
        map.set(slot.roomId, list);
    }

    return Array.from(map.entries()).map(([roomId, roomSlots]) => {
        const first = roomSlots[0];
        const resolvedRoom = first ? roomByName.get(normalizeKey(first.roomName || "")) : undefined;
        const sortedSlots = [...roomSlots].sort((a, b) => a.start.localeCompare(b.start));
        const nextUpcoming = sortedSlots.find((s) => !isPast(s, now));
        const sortKey = nextUpcoming?.start ?? sortedSlots[sortedSlots.length - 1]?.end;
        return { roomId, roomName: first?.roomName ?? "Room", room: resolvedRoom, slots: sortedSlots, sortKey: sortKey ?? "9999-99-99T99:99:99" };
    }).sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1));
  }, [now, organizer, status, bookings, roomByName]);

  if (now === null) return <div className="p-6">Loading...</div>;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Booked Rooms</h1>
          <p className="text-sm text-muted-foreground mt-1">
             Manage your upcoming room reservations ({roomsWithBookings.length} found)
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {/* Sử dụng Router Back thay vì Link */}
            <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="w-full sm:w-auto"
            >
                Back
            </Button>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                <SelectTrigger className="w-full bg-white sm:w-[160px]">
                <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
                <SelectItem value="all">All</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {bookingsLoading || roomsLoading ? (
        <div className="py-20 text-center text-muted-foreground">Loading bookings...</div>
      ) : bookingsError || roomsError ? (
        <div className="py-20 text-center text-red-500">Failed to load data</div>
      ) : roomsWithBookings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            No rooms found matching your filters.
        </div>
      ) : (
        // Sử dụng Grid với items-start để thẻ không bị kéo giãn chiều cao
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
          {roomsWithBookings.map(({ room, roomId, roomName, slots }) => (
            <div
              key={roomId}
              className="group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
            >
              {/* Image Section (Tỉ lệ 16/9 cố định) */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                {room?.imageUrl ? (
                  <img
                    src={room.imageUrl}
                    alt={room.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary/50 text-muted-foreground text-sm">
                    No Image
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="flex flex-col p-4">
                
                {/* --- PHẦN THÔNG TIN --- */}
                <div className="mb-5">
                  <div className="flex items-start justify-between">
                    
                    {/* Cột Trái: Tên, Location, Nút Detail */}
                    {/* pt-1.5 để đẩy nội dung xuống thấp 1 chút cho cân đối */}
                    <div className="min-w-0 pr-3 pt-1.5 flex flex-col gap-1">
                        <h3 className="font-bold text-lg leading-tight tracking-tight truncate" title={room?.name ?? roomName}>
                            {room?.name ?? roomName}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{room?.location || "Unknown"}</span>
                        </div>
                    </div>

                    {/* Cột Phải: Capacity, Nút Re-book */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                        {/* Capacity */}
                        <div className="text-right">
                            <span className="text-sm font-semibold text-foreground block leading-none">
                                {room?.capacity || "?"}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase">capacity</span>
                        </div>
                        
                        {/* Nút Re-book nằm dưới Capacity */}
                        <Button 
                            asChild 
                            size="sm" 
                            className="h-8 px-4 text-xs bg-[#4F7D7B] hover:bg-[#436d6b] shadow-sm"
                            disabled={!room?.id}
                        >
                            <Link href={`/user/booking/${room?.id ?? '#'}/book`}>Re-book</Link>
                        </Button>
                    </div>
                  </div>
                </div>

                {/* --- PHẦN SCHEDULES --- */}
                {/* Clean List Design */}
                <div className="border-t pt-3">
                  <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Next Schedules
                  </div>

                  <div className="flex flex-col">
                    {slots.slice(0, 2).map((slot, index) => {
                      const { date, time } = formatTimeRange(slot.start, slot.end);
                      const past = isPast(slot, now!);
                      const attendeeNames = slot.attendees
                        .map((a) => a.name)
                        .filter(Boolean);
                      const attendeePreview = attendeeNames.slice(0, 3).join(", ");
                      const extraCount = Math.max(0, attendeeNames.length - 3);
                      return (
                        <div 
                            key={slot.id} 
                            className={`group/slot relative flex items-start justify-between py-2 ${index !== slots.length -1 && index !== 1 ? 'border-b border-border/50' : ''}`}
                        >
                          <div className="min-w-0 pr-2">
               <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 text-sm font-medium text-foreground truncate">
                  {slot.organizer}
                </div>
                {slot.attendees.length > 0 ? (
                  <div className="flex items-center -space-x-2">
                    {slot.attendees.map((attendee) => {
                      const displayName = String(attendee?.name ?? "").trim() || "-";
                      return (
                        <HoverCard key={attendee.id} openDelay={150} closeDelay={80}>
                          <HoverCardTrigger asChild>
                            <Avatar className="h-6 w-6 border border-background">
                              <AvatarImage src={(attendee as any)?.avatar_url ?? (attendee as any)?.avatarUrl ?? ""} alt={displayName} />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-auto">
                            <div className="text-sm font-medium text-foreground">
                              {displayName}
                            </div>
                            {attendee.email ? (
                              <div className="text-xs text-muted-foreground">{attendee.email}</div>
                            ) : null}
                          </HoverCardContent>
                        </HoverCard>
                    );
                  })}
                  </div>
                ) : null}
               </div>
                             <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <span className={past ? "line-through opacity-70" : ""}>{date}</span>
                                <span className="text-[10px]">•</span> 
                                <span className={past ? "opacity-70" : "text-[#4F7D7B] font-medium"}>{time}</span>
                             </div>
                             {attendeeNames.length > 0 ? (
                               <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                                 <Users className="h-3.5 w-3.5 shrink-0" />
                                 <span className="truncate">
                                   {attendeePreview}
                                   {extraCount > 0 ? `, +${extraCount}` : ""}
                                 </span>
                               </div>
                             ) : null}
                          </div>
                          

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost" size="icon"
                              className="h-6 w-6 text-muted-foreground hover:bg-[#4F7D7B]/10 hover:text-[#4F7D7B] opacity-100 sm:opacity-0 sm:group-hover/slot:opacity-100 transition-opacity"
                              onClick={() => router.push(`/user/booking/${slot.id}/edit`)}
                              aria-label="Edit booking"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost" size="icon"
                              className="h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover/slot:opacity-100 transition-opacity"
                              onClick={() => onDelete(slot.id)}
                              disabled={deletingId === slot.id}
                              aria-label="Delete booking"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {slots.length > 2 && (
                        <div className="mt-1 text-center">
                            <span className="text-[10px] px-2 py-0.5 bg-secondary rounded-full text-muted-foreground font-medium">
                                +{slots.length - 2} more
                            </span>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}