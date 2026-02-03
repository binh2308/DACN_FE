"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Bỏ Card, CardContent cho phần slot con để tiết kiệm diện tích
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookingSlots, type BookingSlot } from "@/lib/booking/bookings";
import { getRoomById } from "@/lib/booking/rooms";

type StatusFilter = "all" | "upcoming" | "past";

const formatTimeRange = (startIso: string, endIso: string) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = start.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const startTime = start.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const endTime = end.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { date, time: `${startTime} - ${endTime}` };
};

const isPast = (slot: BookingSlot, now: number) =>
  new Date(slot.end).getTime() < now;

export default function BookedRoomsPage() {
  const organizers = React.useMemo(() => {
    return Array.from(new Set(bookingSlots.map((b) => b.organizer))).sort(
      (a, b) => a.localeCompare(b)
    );
  }, []);

  const defaultOrganizer = organizers.includes("Nijh") ? "Nijh" : "all";
  const [organizer, setOrganizer] = React.useState<string>(defaultOrganizer);
  const [status, setStatus] = React.useState<StatusFilter>("upcoming");

  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
  }, []);

  const roomsWithBookings = React.useMemo(() => {
    if (now === null) return [];

    const filtered = bookingSlots.filter((slot) => {
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

    const items = Array.from(map.entries())
      .map(([roomId, slots]) => {
        const room = getRoomById(roomId);
        if (!room) return null;

        const sortedSlots = [...slots].sort((a, b) =>
          a.start.localeCompare(b.start)
        );
        const nextUpcoming = sortedSlots.find((s) => !isPast(s, now));
        const sortKey =
          nextUpcoming?.start ?? sortedSlots[sortedSlots.length - 1]?.end;
        return {
          room,
          slots: sortedSlots,
          sortKey: sortKey ?? "9999-99-99T99:99:99",
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a!.sortKey < b!.sortKey ? -1 : 1));

    return items as Array<{
      room: NonNullable<ReturnType<typeof getRoomById>>;
      slots: BookingSlot[];
      sortKey: string;
    }>;
  }, [now, organizer, status]);

  if (now === null) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Booked Rooms</h1>
          <p className="text-sm text-muted-foreground">
            {roomsWithBookings.length} room(s) found
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Select value={organizer} onValueChange={setOrganizer}>
            <SelectTrigger className="w-full bg-white sm:w-[180px]">
              <SelectValue placeholder="Organizer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All organizers</SelectItem>
              {organizers.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(v) => setStatus(v as StatusFilter)}
          >
            <SelectTrigger className="w-full bg-white sm:w-[140px]">
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

      {roomsWithBookings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No booked rooms</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try switching filters or book a new room.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/manager/booking">Go to booking</Link>
          </Button>
        </div>
      ) : (
        // THAY ĐỔI LỚN NHẤT Ở ĐÂY:
        // Grid responsive: 1 cột (mobile) -> 2 cột (sm) -> 3 cột (lg) -> 4 cột (xl)
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roomsWithBookings.map(({ room, slots }) => (
            <div
              key={room.id}
              // Chuyển sang Flex-col để ảnh nằm trên, nội dung nằm dưới
              className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Ảnh: Aspect ratio 16/9 hoặc 4/3 cho gọn */}
              <div className="aspect-[16/9] w-full bg-muted">
                <img
                  src={room.imageUrl}
                  alt={room.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Nội dung chính */}
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground line-clamp-1">
                      {room.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">
                        {room.location.building}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <span className="block font-medium text-foreground">
                      {room.seat.max}
                    </span>
                    seats
                  </div>
                </div>

                {/* Các nút hành động: Grid 2 cột cho đều */}
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/manager/booking/${room.id}`}>Info</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-[#4F7D7B] hover:bg-[#436d6b]"
                  >
                    <Link href={`/manager/booking/${room.id}/book`}>Re-book</Link>
                  </Button>
                </div>

                {/* Phần Slot: Viền trên ngăn cách */}
                <div className="mt-auto border-t pt-3">
                  <div className="mb-2 text-xs font-semibold text-muted-foreground">
                    Next Schedules:
                  </div>

                  <div className="flex flex-col gap-2">
                    {slots.map((slot) => {
                      const { date, time } = formatTimeRange(
                        slot.start,
                        slot.end
                      );
                      const past = isPast(slot, now!);
                      return (
                        // Slot hiển thị gọn gàng dạng block nhỏ
                        <div
                          key={slot.id}
                          className="rounded-md bg-slate-50 p-2 ring-1 ring-slate-100"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-foreground">
                              {slot.title}
                            </span>
                            <Badge
                              variant={past ? "secondary" : "default"}
                              className="h-5 px-1.5 text-[10px]"
                            >
                              {past ? "Past" : "Up"}
                            </Badge>
                          </div>
                          
                          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <CalendarClock className="h-3 w-3" />
                                <span>{date}</span>
                            </div>
                            <span className="font-medium text-foreground/80">{time}</span>
                          </div>
                          <div className="mt-1 text-[10px] text-muted-foreground">
                             by {slot.organizer}
                          </div>
                        </div>
                      );
                    })}
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