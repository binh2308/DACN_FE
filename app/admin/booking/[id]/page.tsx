import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, MapPin, Monitor, PenLine, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSlotsByRoomId } from "@/lib/booking/bookings";
import { getRoomById } from "@/lib/booking/rooms";

const formatTimeRange = (startIso: string, endIso: string) => {
	const start = new Date(startIso);
	const end = new Date(endIso);
	const date = start.toLocaleDateString(undefined, {
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "2-digit",
	});
	const startTime = start.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	});
	const endTime = end.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	});
	return { date, time: `${startTime} - ${endTime}` };
};

export default function RoomDetailPage({
	params,
}: {
	params: { id: string };
}) {
	const room = getRoomById(params.id);
	if (!room) notFound();

	const slots = getSlotsByRoomId(room.id);

	return (
		<div className="mx-auto w-full max-w-[1200px] px-6 py-6">
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
				<div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
					<div className="aspect-[16/9] w-full bg-muted">
						<img
							src={room.imageUrl}
							alt={room.name}
							className="h-full w-full object-cover"
							loading="lazy"
						/>
					</div>
				</div>

				<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-border">
					<div className="text-xl font-semibold text-foreground">{room.name}</div>

					<div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
						<MapPin className="h-4 w-4" />
						<span>
							{room.location.building}, {room.location.city}
						</span>
					</div>

					<div className="mt-3 text-sm text-muted-foreground">
						{room.description}
					</div>

					<div className="mt-6">
						<div className="text-xs font-semibold text-muted-foreground">
							Room Facility :
						</div>

						<div className="mt-3 flex flex-wrap items-center gap-3">
							<div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
								<span className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-border">
									<Wifi className="h-4 w-4 text-muted-foreground" />
								</span>
								<div className="text-xs">
									<div className="text-muted-foreground">Wifi</div>
									<div className="font-semibold text-foreground">
										{room.facilities.wifi ? "Yes" : "No"}
									</div>
								</div>
							</div>

							<div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
								<span className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-border">
									<Monitor className="h-4 w-4 text-muted-foreground" />
								</span>
								<div className="text-xs">
									<div className="text-muted-foreground">Monitor</div>
									<div className="font-semibold text-foreground">
										{room.facilities.monitor ? "Yes" : "No"}
									</div>
								</div>
							</div>

							<div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
								<span className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-border">
									<PenLine className="h-4 w-4 text-muted-foreground" />
								</span>
								<div className="text-xs">
									<div className="text-muted-foreground">Whiteboard</div>
									<div className="font-semibold text-foreground">
										{room.facilities.whiteboard ? "Yes" : "No"}
									</div>
								</div>
							</div>

							<div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
								<span className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-border">
									<CalendarClock className="h-4 w-4 text-muted-foreground" />
								</span>
								<div className="text-xs">
									<div className="text-muted-foreground">Max Limit</div>
									<div className="font-semibold text-foreground">
										{room.seat.min}-{room.seat.max}
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="mt-6 flex items-center gap-3">
						<Button
							asChild
							className="rounded-md bg-[#4F7D7B] hover:bg-[#436d6b]"
						>
							<Link href={`/admin/booking/${room.id}/book`}>Book Now</Link>
						</Button>
						<Button asChild variant="outline" className="rounded-md">
							<Link href="/admin/booking">Back</Link>
						</Button>
					</div>
				</div>
			</div>

			<div className="mt-8">
				<div className="mb-3 text-sm font-semibold text-foreground">Booked Slots</div>

				{slots.length === 0 ? (
					<div className="rounded-xl bg-white p-8 text-sm text-muted-foreground shadow-sm ring-1 ring-border">
						No booked slots yet.
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{slots.map((slot) => {
							const { date, time } = formatTimeRange(slot.start, slot.end);
							return (
								<Card key={slot.id} className="shadow-sm">
									<CardContent className="p-4">
										<div className="text-sm font-semibold text-foreground">
											{slot.title}
										</div>
										<div className="mt-1 text-xs text-muted-foreground">
											Organizer : {slot.organizer}
										</div>
										<div className="mt-2 text-xs text-muted-foreground">
											{date}
										</div>
										<div className="text-xs font-semibold text-foreground">
											{time}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
