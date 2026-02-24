"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequest } from "ahooks";
import { MapPin, Monitor, PenLine, Users, Wind } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getBookingsByRoomId, type BookingByRoom } from "@/services/DACN/Booking";
import { getRoomById, type Room } from "@/services/DACN/Rooms";

const formatTimeRange = (startIso: string, endIso: string) => {
	const start = new Date(startIso);
	const end = new Date(endIso);
	const date = start.toLocaleDateString("vi-VN", {
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "2-digit",
	});
	const startTime = start.toLocaleTimeString("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
	});
	const endTime = end.toLocaleTimeString("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
	});
	return { date, time: `${startTime} - ${endTime}` };
};

const formatTimeOnly = (iso: string) => {
	const d = new Date(iso);
	return d.toLocaleTimeString("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
	});
};

function toLocalYmdKey(iso: string) {
	const d = new Date(iso);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function normalizeRoomResponse(data: unknown): Room | null {
	if (!data || typeof data !== "object") return null;
	if (data && (data as any).success === true && (data as any).data) {
		return (data as any).data as Room;
	}
	if (data && (data as any).data && typeof (data as any).data === "object") {
		return (data as any).data as Room;
	}
	return null;
}

function normalizeBookingsByRoomResponse(data: unknown): BookingByRoom[] {
	if (!data) return [];
	if (Array.isArray(data)) return data as BookingByRoom[];
	if (typeof data === "object" && data !== null && "data" in data) {
		const arr = (data as any).data;
		if (Array.isArray(arr)) return arr as BookingByRoom[];
	}
	return [];
}

export default function RoomDetailPage() {
	const params = useParams<{ id: string | string[] }>();
	const roomId = React.useMemo(() => {
		const raw = params?.id;
		if (!raw) return null;
		return Array.isArray(raw) ? raw[0] : raw;
	}, [params]);

	const {
		data: roomRaw,
		loading: roomLoading,
		error: roomError,
		refresh: refreshRoom,
	} = useRequest(() => getRoomById(roomId as string), {
		ready: Boolean(roomId),
	});

	const room = React.useMemo(() => normalizeRoomResponse(roomRaw), [roomRaw]);

	const {
		data: bookingsRaw,
		loading: bookingsLoading,
		error: bookingsError,
		refresh: refreshBookings,
	} = useRequest(() => getBookingsByRoomId(roomId as string), {
		ready: Boolean(roomId),
	});

	const bookings = React.useMemo(
		() => {
			const list = normalizeBookingsByRoomResponse(bookingsRaw);
			return [...list].sort((a, b) => {
				const aStart = Date.parse(a.startTime);
				const bStart = Date.parse(b.startTime);
				if (Number.isFinite(aStart) && Number.isFinite(bStart) && aStart !== bStart) {
					return aStart - bStart;
				}
				const aEnd = Date.parse(a.endTime);
				const bEnd = Date.parse(b.endTime);
				if (Number.isFinite(aEnd) && Number.isFinite(bEnd) && aEnd !== bEnd) {
					return aEnd - bEnd;
				}
				return String(a.id).localeCompare(String(b.id));
			});
		},
		[bookingsRaw],
	);

	const bookingsByDay = React.useMemo(() => {
		const groups = new Map<
			string,
			{
				key: string;
				label: string;
				sortKey: number;
				items: BookingByRoom[];
			}
		>();

		for (const b of bookings) {
			const key = toLocalYmdKey(b.startTime);
			let g = groups.get(key);
			if (!g) {
				const d = new Date(b.startTime);
				const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
				g = {
					key,
					label: d.toLocaleDateString("vi-VN", {
						weekday: "short",
						year: "numeric",
						month: "short",
						day: "2-digit",
					}),
					sortKey: dayStart.getTime(),
					items: [],
				};
				groups.set(key, g);
			}
			g.items.push(b);
		}

		const dayGroups = [...groups.values()].sort((a, b) => a.sortKey - b.sortKey);
		for (const g of dayGroups) {
			g.items.sort((a, b) => {
				const aStart = Date.parse(a.startTime);
				const bStart = Date.parse(b.startTime);
				if (Number.isFinite(aStart) && Number.isFinite(bStart) && aStart !== bStart) {
					return aStart - bStart;
				}
				const aEnd = Date.parse(a.endTime);
				const bEnd = Date.parse(b.endTime);
				if (Number.isFinite(aEnd) && Number.isFinite(bEnd) && aEnd !== bEnd) {
					return aEnd - bEnd;
				}
				return String(a.id).localeCompare(String(b.id));
			});
		}

		return dayGroups;
	}, [bookings]);

	return (
		<div className="mx-auto w-full max-w-[1200px] px-6 py-6">
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
				{/* LEFT: image */}
				<div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
					<div className="aspect-[16/9] w-full bg-muted">
						{room?.imageUrl ? (
							<img
								src={room.imageUrl}
								alt={room.name}
								className="h-full w-full object-cover"
								loading="lazy"
							/>
						) : null}
					</div>
				</div>

				{/* RIGHT: detail */}
				<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-border">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<div className="text-xl font-semibold text-foreground truncate">
								{room?.name || "Room"}
							</div>
							{room?.location ? (
								<div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
									<MapPin className="h-4 w-4" />
									<span className="truncate">{room.location}</span>
								</div>
							) : null}
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								refreshRoom();
								refreshBookings();
							}}
							disabled={roomLoading || bookingsLoading}
						>
							Refresh
						</Button>
					</div>

					{roomError ? (
						<div className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
							{(roomError as any)?.message || "Không thể tải thông tin phòng."}
						</div>
					) : roomLoading ? (
						<div className="mt-4 text-sm text-muted-foreground">Đang tải phòng…</div>
					) : !room ? (
						<div className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
							Không tìm thấy phòng.
						</div>
					) : (
						<>
							<div className="mt-5 text-xs font-semibold text-muted-foreground">
								Room Facility :
							</div>

							<div className="mt-3 flex flex-wrap items-center gap-3">
								<div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
									<span className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-border">
										<Users className="h-4 w-4 text-muted-foreground" />
									</span>
									<div className="text-xs">
										<div className="text-muted-foreground">Capacity</div>
										<div className="font-semibold text-foreground">{room.capacity}</div>
									</div>
								</div>

								{Array.isArray(room.equipment)
									? room.equipment.map((eq) => {
											const key = `${room.id}-${eq}`;
											const name = (eq || "").trim();
											let Icon = Monitor;
											if (name.toLowerCase().includes("whiteboard")) Icon = PenLine;
											if (name.toLowerCase() === "ac" || name.toLowerCase().includes("air")) Icon = Wind;
											return (
												<div
													key={key}
													className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2"
												>
													<span className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-border">
														<Icon className="h-4 w-4 text-muted-foreground" />
													</span>
													<div className="text-xs">
														<div className="text-muted-foreground">{name}</div>
														<div className="font-semibold text-foreground">Yes</div>
													</div>
												</div>
										);
									  })
									: null}
							</div>

							<div className="mt-6 flex items-center gap-3">
								<Button
									asChild
									className="rounded-md bg-[#4F7D7B] hover:bg-[#436d6b]"
								>
									<Link href={`/manager/booking/${room.id}/book`}>Book Now</Link>
								</Button>
								<Button asChild variant="outline" className="rounded-md">
									<Link href="/manager/booking">Back</Link>
								</Button>
							</div>
						</>
					)}
				</div>
			</div>

			{/* BOOKED SLOTS: full width below */}
			<div className="mt-8">
				<div className="mb-3 text-sm font-semibold text-foreground">Booked Slots</div>

				{bookingsError ? (
					<div className="rounded-xl bg-white p-8 text-sm text-rose-800 shadow-sm ring-1 ring-rose-200">
						{(bookingsError as any)?.message || "Không thể tải bookings của phòng."}
					</div>
				) : bookingsLoading ? (
					<div className="rounded-xl bg-white p-8 text-sm text-muted-foreground shadow-sm ring-1 ring-border">
						Đang tải bookings…
					</div>
				) : bookings.length === 0 ? (
					<div className="rounded-xl bg-white p-8 text-sm text-muted-foreground shadow-sm ring-1 ring-border">
						No booked slots yet.
					</div>
				) : (
					<div className="rounded-xl bg-white shadow-sm ring-1 ring-border">
						<div className="p-6">
							<div className="space-y-6">
								{bookingsByDay.map((g) => (
									<div key={g.key} className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
										<div className="text-sm font-semibold text-foreground">
											{g.label}
											<div className="mt-1 text-xs font-normal text-muted-foreground">
												{g.items.length} slot{g.items.length > 1 ? "s" : ""}
										</div>
										</div>

										<div className="space-y-0">
											{g.items.map((b, idx) => {
												const time = `${formatTimeOnly(b.startTime)} - ${formatTimeOnly(b.endTime)}`;
												const isLast = idx === g.items.length - 1;
												return (
													<div key={b.id} className="relative pl-8 pb-4">
														<span className="absolute left-[11px] top-[6px] h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white" />
														{!isLast ? (
															<span className="absolute left-[16px] top-[18px] bottom-0 w-px bg-border" />
														) : null}

														<div className="rounded-lg border border-border bg-muted/20 p-4">
															<div className="flex flex-wrap items-center justify-between gap-2">
																<div className="text-sm font-semibold text-foreground">{time}</div>
																<div className="text-xs text-muted-foreground">
																	Organizer: <span className="font-medium text-foreground">{b.name}</span>
																</div>
															</div>

															<div className="mt-1 text-xs text-muted-foreground">
																{b.roomName || room?.name || "Room"}
															</div>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</div>

		</div>
	);
}
