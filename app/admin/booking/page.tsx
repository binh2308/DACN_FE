"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { roomCities, rooms, type RoomCity } from "@/lib/booking/rooms";

type AvailabilityKey = "monitor" | "whiteboard" | "availableNow";

const availabilityOptions: Array<{ key: AvailabilityKey; label: string }> = [
	{ key: "monitor", label: "Monitor Available" },
	{ key: "whiteboard", label: "WhiteBoard Available" },
	{ key: "availableNow", label: "Available now" },
];

export default function BookingPage() {
	const [selectedCities, setSelectedCities] = React.useState<Set<RoomCity>>(
		() => new Set(),
	);
	const [availability, setAvailability] = React.useState<
		Record<AvailabilityKey, boolean>
	>({
		monitor: false,
		whiteboard: false,
		availableNow: false,
	});

	const allMin = React.useMemo(
		() => Math.min(...rooms.map((r) => r.seat.min)),
		[],
	);
	const allMax = React.useMemo(
		() => Math.max(...rooms.map((r) => r.seat.max)),
		[],
	);

	const [seatDraft, setSeatDraft] = React.useState<[number, number]>([
		allMin,
		allMax,
	]);
	const [seatApplied, setSeatApplied] = React.useState<[number, number]>([
		allMin,
		allMax,
	]);

	const filteredRooms = React.useMemo(() => {
		return rooms.filter((room) => {
			if (selectedCities.size > 0 && !selectedCities.has(room.location.city)) {
				return false;
			}

			if (availability.monitor && !room.availability.monitor) return false;
			if (availability.whiteboard && !room.availability.whiteboard) return false;
			if (availability.availableNow && !room.availability.availableNow) return false;

			const [minSeat, maxSeat] = seatApplied;
			if (room.seat.min < minSeat) return false;
			if (room.seat.max > maxSeat) return false;

			return true;
		});
	}, [availability, seatApplied, selectedCities]);

	const toggleCity = (city: RoomCity) => {
		setSelectedCities((prev) => {
			const next = new Set(prev);
			if (next.has(city)) next.delete(city);
			else next.add(city);
			return next;
		});
	};

	const toggleAvailability = (key: AvailabilityKey) => {
		setAvailability((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const clearSeat = () => {
		setSeatDraft([allMin, allMax]);
		setSeatApplied([allMin, allMax]);
	};

	const applySeat = () => {
		const [a, b] = seatDraft;
		setSeatApplied([Math.min(a, b), Math.max(a, b)]);
	};

	return (
		<div className="mx-auto w-full max-w-[1400px] px-6 py-6">
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
				<section>
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-sm font-semibold text-muted-foreground">
							{filteredRooms.length} Rooms Found
						</h2>
					</div>

					{filteredRooms.length === 0 ? (
						<div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-border">
							<div className="text-base font-semibold text-foreground">
								No rooms match your filters
							</div>
							<div className="mt-2 text-sm text-muted-foreground">
								Try clearing filters or widening the seat range.
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
							{filteredRooms.map((room) => (
								<div
									key={room.id}
									className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border"
								>
									<div className="aspect-[16/9] w-full bg-muted">
										<img
											src={room.imageUrl}
											alt={room.name}
											className="h-full w-full object-cover"
											loading="lazy"
										/>
									</div>

									<div className="bg-muted/40 px-4 pb-4 pt-3">
										<div className="mb-1 text-lg font-semibold text-foreground">
											{room.name}
										</div>

										<div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
											<MapPin className="h-4 w-4" />
											<span>
												{room.location.building}, {room.location.city}
											</span>
										</div>

										<div className="mb-3 text-xs text-muted-foreground">
											Max Limit : {room.seat.min}-{room.seat.max}
										</div>

										<Button
											asChild
											className="w-full rounded-md bg-[#4F7D7B] hover:bg-[#436d6b]"
										>
											<Link href={`/admin/booking/${room.id}`}>More Info</Link>
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</section>

				<aside className="h-fit rounded-xl bg-white p-5 shadow-sm ring-1 ring-border">
					<div className="space-y-6">
						<div>
							<div className="mb-3 text-sm font-semibold text-muted-foreground">
								Filter by Location:
							</div>
							<div className="space-y-2">
								{roomCities.map((city) => (
									<label
										key={city}
										className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
									>
										<Checkbox
											checked={selectedCities.has(city)}
											onCheckedChange={() => toggleCity(city)}
										/>
										{city}
									</label>
								))}
							</div>
						</div>

						<div>
							<div className="mb-3 text-sm font-semibold text-muted-foreground">
								Filter by Availability:
							</div>
							<div className="space-y-2">
								{availabilityOptions.map((opt) => (
									<label
										key={opt.key}
										className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
									>
										<Checkbox
											checked={availability[opt.key]}
											onCheckedChange={() => toggleAvailability(opt.key)}
										/>
										{opt.label}
									</label>
								))}
							</div>
						</div>

						<div>
							<div className="mb-3 text-sm font-semibold text-muted-foreground">
								Filter by Seat :
							</div>

							<div className="rounded-xl bg-accent/40 p-4">
								<div className="mb-4">
									<Slider
										min={allMin}
										max={allMax}
										step={1}
										value={[seatDraft[0], seatDraft[1]]}
										onValueChange={(v) =>
											setSeatDraft([v[0] ?? allMin, v[1] ?? allMax])
										}
									/>
								</div>

								<div className="mb-4 flex items-center justify-between gap-3">
									<div className="rounded-md bg-white px-3 py-2 text-center text-xs ring-1 ring-border">
										<div className="text-muted-foreground">Min Limit</div>
										<div className="font-semibold text-foreground">
											{seatApplied[0]}
										</div>
									</div>
									<div className="rounded-md bg-white px-3 py-2 text-center text-xs ring-1 ring-border">
										<div className="text-muted-foreground">Max Limit</div>
										<div className="font-semibold text-foreground">
											{seatApplied[1]}
										</div>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<button
										type="button"
										onClick={clearSeat}
										className={cn(
											"text-xs font-semibold text-muted-foreground hover:text-foreground",
										)}
									>
										Clear
									</button>

									<Button
										type="button"
										onClick={applySeat}
										size="sm"
										className="rounded-md bg-[#4F7D7B] hover:bg-[#436d6b]"
									>
										Apply
									</Button>
								</div>
							</div>
						</div>
					</div>
				</aside>
			</div>
		</div>
	);
}
