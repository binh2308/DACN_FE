"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useRequest } from "ahooks";
import { Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getBookingDetail,
  updateBooking,
  type BookingDetailDto,
  type RecurringPattern,
  type UpdateBookingRequest,
} from "@/services/DACN/Booking";
import { getRoomById, type Room } from "@/services/DACN/Rooms";
import {
  getEmployeeProfile,
  getEmployees,
  getFullName,
  type EmployeeDto,
} from "@/services/DACN/employee";

function normalizeRoomResponse(data: unknown): Room | null {
  if (!data || typeof data !== "object") return null;
  if ((data as any).success === true && (data as any).data) return (data as any).data;
  if ((data as any).data) return (data as any).data;
  return null;
}

function normalizeEmployeesResponse(raw: any): EmployeeDto[] {
  const payload = raw?.data ?? raw;
  if (Array.isArray(payload)) return payload as EmployeeDto[];
  if (Array.isArray(payload?.data)) return payload.data as EmployeeDto[];
  if (Array.isArray(payload?.items)) return payload.items as EmployeeDto[];
  if (Array.isArray(payload?.data?.items)) return payload.data.items as EmployeeDto[];
  return [];
}

function normalizeBookingDetailResponse(raw: unknown): BookingDetailDto | null {
  if (!raw) return null;

  const direct = raw as any;
  const payload = direct?.data ?? direct;

  if (payload && typeof payload === "object" && payload !== null) {
    if (payload?.data && typeof payload.data === "object" && payload.data !== null && "id" in payload.data) {
      return payload.data as BookingDetailDto;
    }
    if ("id" in payload) return payload as BookingDetailDto;
  }

  return null;
}

type FormState = {
  purpose: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  recurringPattern: RecurringPattern;
  recurringEndDate: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalParts(iso?: string | null): { date: string; time: string } {
  const value = String(iso ?? "").trim();
  if (!value) return { date: "", time: "" };
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return { date: "", time: "" };

  const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return { date, time };
}

function toIsoFromLocal(date: string, time: string) {
  const normalizedTime = time.split(":").length === 2 ? `${time}:00` : time;
  return new Date(`${date}T${normalizedTime}`).toISOString();
}

function pickString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();

  const bookingId = React.useMemo(() => {
    const raw = params?.id;
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const {
    data: bookingRaw,
    loading: bookingLoading,
    error: bookingError,
  } = useRequest(() => getBookingDetail(bookingId as string), {
    ready: Boolean(bookingId),
  });

  const booking = React.useMemo(
    () => normalizeBookingDetailResponse(bookingRaw),
    [bookingRaw],
  );

  const roomId = React.useMemo(() => {
    return (
      pickString(booking?.room?.id) ||
      pickString((booking as any)?.room_id) ||
      null
    );
  }, [booking]);

  const {
    data: roomRaw,
    loading: roomLoading,
    error: roomError,
  } = useRequest(() => getRoomById(roomId as string), {
    ready: Boolean(roomId),
  });

  const room = React.useMemo(() => normalizeRoomResponse(roomRaw), [roomRaw]);

  const { data: profileRaw } = useRequest(getEmployeeProfile);

  const {
    data: employeesRaw,
    loading: employeesLoading,
    error: employeesError,
    refresh: refreshEmployees,
  } = useRequest(getEmployees);

  const employees = React.useMemo(() => {
    const list = normalizeEmployeesResponse(employeesRaw);

    let myId = pickString((profileRaw as any)?.data?.id);
    let myEmail = pickString((profileRaw as any)?.data?.email);
    if (myId && !list.some((e) => e.id === myId)) myId = undefined;
    if (myEmail && !list.some((e) => (e.email || "").trim() === myEmail)) myEmail = undefined;

    const filtered = list.filter((e) => {
      if (myId) return e.id !== myId;
      if (myEmail) return (e.email || "").trim() !== myEmail;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const an = (getFullName(a) || a.email || "").toLowerCase();
      const bn = (getFullName(b) || b.email || "").toLowerCase();
      return an.localeCompare(bn);
    });
  }, [employeesRaw, profileRaw]);

  const [submitted, setSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [attendeeIds, setAttendeeIds] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<string>("");
  const [initialized, setInitialized] = React.useState(false);

  const [form, setForm] = React.useState<FormState>({
    purpose: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    recurringPattern: "WEEKLY",
    recurringEndDate: "",
  });

  React.useEffect(() => {
    if (initialized) return;
    if (!booking) return;

    const startIso = pickString((booking as any)?.start_time) || pickString((booking as any)?.startTime);
    const endIso = pickString((booking as any)?.end_time) || pickString((booking as any)?.endTime);

    const startParts = toLocalParts(startIso);
    const endParts = toLocalParts(endIso);

    const recurringPattern =
      (booking as any)?.recurring_pattern &&
      ["NONE", "DAILY", "WEEKLY", "MONTHLY"].includes(String((booking as any).recurring_pattern))
        ? (booking as any).recurring_pattern
        : ("WEEKLY" as RecurringPattern);

    const recurringEndIso = pickString((booking as any)?.recurring_end_date);
    const recurringEndDate = recurringEndIso
      ? toLocalParts(recurringEndIso).date
      : endParts.date;

    setForm({
      purpose: String((booking as any)?.purpose ?? ""),
      startDate: startParts.date,
      startTime: startParts.time,
      endDate: endParts.date,
      endTime: endParts.time,
      recurringPattern,
      recurringEndDate,
    });

    setStatus(String((booking as any)?.status ?? ""));

    const initialAttendees = Array.isArray((booking as any)?.attendees)
      ? (booking as any).attendees
          .map((a: any) => pickString(a?.id))
          .filter(Boolean)
      : [];
    setAttendeeIds(initialAttendees as string[]);

    setInitialized(true);
  }, [booking, initialized]);

  const { runAsync: submitUpdate, loading: submitting } = useRequest(
    (id: string, body: UpdateBookingRequest) => updateBooking(id, body),
    { manual: true },
  );

  if (!bookingId) notFound();

  if (bookingLoading) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-6 py-6">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-border">
          <div className="text-sm text-muted-foreground">Đang tải booking…</div>
        </div>
      </div>
    );
  }

  if (bookingError) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-6 py-6">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-border">
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
            {(bookingError as any)?.message || "Không thể tải thông tin booking."}
          </div>
          <div className="mt-4">
            <Button asChild variant="outline" type="button">
              <Link href="/user/booked-rooms">Back</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) notFound();

  const onChange = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;

    setSubmitError(null);
    setSubmitted(false);

    const start = toIsoFromLocal(form.startDate, form.startTime);
    const end = toIsoFromLocal(form.endDate, form.endTime);
    if (new Date(end).getTime() <= new Date(start).getTime()) {
      setSubmitError("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    try {
      const payload: UpdateBookingRequest = {
        status: status || "CHECKED_IN",
        room_id: roomId,
        start_time: start,
        end_time: end,
        purpose: form.purpose,
        attendee_ids: attendeeIds,
      };

      if (form.recurringPattern !== "NONE") {
        const recurringEndDate = form.recurringEndDate || form.endDate;
        if (!recurringEndDate) {
          setSubmitError("Vui lòng chọn recurring end date.");
          return;
        }

        const recurringEndIso = toIsoFromLocal(recurringEndDate, "23:59:59");
        payload.recurring_pattern = form.recurringPattern;
        payload.recurring_end_date = recurringEndIso;
      }

      await submitUpdate(bookingId, payload);
      setSubmitted(true);
      router.push("/user/booked-rooms");
    } catch (err) {
      setSubmitError((err as any)?.message || "Cập nhật booking thất bại.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_460px]">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-border">
          {roomLoading ? (
            <div className="text-sm text-muted-foreground">Đang tải phòng…</div>
          ) : roomError ? (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
              {(roomError as any)?.message || "Không thể tải thông tin phòng."}
            </div>
          ) : room?.imageUrl ? (
            <div className="overflow-hidden rounded-xl ring-1 ring-border">
              <div className="aspect-[16/9] w-full bg-muted">
                <img
                  src={room.imageUrl}
                  alt={room.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          ) : null}

          <div className="mt-5 text-xs font-semibold text-muted-foreground">ROOM</div>
          <div className="mt-2 text-xl font-semibold text-foreground">
            {room?.name || booking?.room?.name || "Room"}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Capacity:{" "}
            <span className="font-medium text-foreground">
              {room?.capacity ?? booking?.room?.capacity ?? "?"}
            </span>
          </div>
          {Array.isArray(room?.equipment) && room.equipment.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {room.equipment.map((eq) => (
                <Badge key={eq} variant="secondary" className="rounded-md">
                  {eq}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              {submitted ? (
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
                  Booking updated. Redirecting…
                </div>
              ) : null}

              {submitError ? (
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
                  {submitError}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={form.purpose}
                  onChange={onChange("purpose")}
                  placeholder="Weekly planning"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room">Room :</Label>
                <Input id="room" value={room?.name || booking?.room?.name || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status :</Label>
                <Input id="status" value={status || ""} disabled />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="startDate">Start time</Label>

                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-[#4F7D7B] transition-colors" />
                    <Input
                      id="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={onChange("startDate")}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <Input
                      type="time"
                      value={form.startTime}
                      onChange={onChange("startTime")}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="endDate">End time</Label>

                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-[#4F7D7B] transition-colors" />
                    <Input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={onChange("endDate")}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <Input
                      type="time"
                      value={form.endTime}
                      onChange={onChange("endTime")}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="recurringPattern">Recurring pattern</Label>
                  <select
                    id="recurringPattern"
                    value={form.recurringPattern}
                    onChange={(e) =>
                      setForm((prev) => {
                        const nextPattern = e.target.value as RecurringPattern;
                        return {
                          ...prev,
                          recurringPattern: nextPattern,
                          recurringEndDate: nextPattern === "NONE" ? "" : prev.recurringEndDate,
                        };
                      })
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:border-[#4F7D7B] transition-colors"
                  >
                    <option value="NONE">NONE</option>
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurringEndDate">Recurring end date</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-[#4F7D7B] transition-colors" />
                    <Input
                      id="recurringEndDate"
                      type="date"
                      value={form.recurringEndDate}
                      onChange={onChange("recurringEndDate")}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors"
                      required={form.recurringPattern !== "NONE"}
                      disabled={form.recurringPattern === "NONE"}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Attendees</div>
                    <div className="text-xs text-muted-foreground">
                      Select the staff members from your department to participate in the meeting.
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => refreshEmployees()}
                    disabled={employeesLoading}
                  >
                    Refresh
                  </Button>
                </div>

                {employeesError ? (
                  <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800 ring-1 ring-rose-200">
                    {(employeesError as any)?.message ||
                      "Không thể tải danh sách nhân viên."}
                  </div>
                ) : null}

                <div className="max-h-56 overflow-auto rounded-md border border-input bg-background">
                  {employeesLoading ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      Đang tải danh sách...
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      Không có nhân viên trong phòng ban.
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {employees.map((emp) => {
                        const name = getFullName(emp) || emp.email;
                        const checked = attendeeIds.includes(emp.id);
                        return (
                          <li key={emp.id} className="flex items-start gap-3 p-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                const next = Boolean(v);
                                setAttendeeIds((prev) => {
                                  if (next) return prev.includes(emp.id) ? prev : [...prev, emp.id];
                                  return prev.filter((x) => x !== emp.id);
                                });
                              }}
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {emp.email}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Selected:{" "}
                  <span className="font-medium text-foreground">{attendeeIds.length}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button asChild variant="outline" type="button">
                  <Link href="/user/booked-rooms">Back</Link>
                </Button>
                <Button
                  type="submit"
                  className="rounded-md bg-[#4F7D7B] hover:bg-[#436d6b]"
                  disabled={submitted || submitting}
                >
                  {submitting ? "Updating…" : "Update"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
