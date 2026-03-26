"use client";

import * as React from "react";
import Link from "next/link";
import { useRequest } from "ahooks";
import { MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { getRooms, type Room } from "@/services/DACN/Rooms";

// --- Xử lý dữ liệu API ---
function normalizeRoomsResponse(data: unknown): Room[] {
	if (!data) return [];
	if (Array.isArray(data)) return data as Room[];
	if (typeof data === "object" && data !== null) {
		if ("data" in data && Array.isArray((data as any).data)) {
			return (data as any).data as Room[];
		}
		if ("success" in data && "data" in data && Array.isArray((data as any).data)) {
			return (data as any).data as Room[];
		}
	}
	return [];
}

type RoomApiStatus = "AVAILABLE" | "OCCUPIED" | "MAINTANANCE" | "MAINTENANCE";

// Hàm chuẩn hóa trạng thái phòng
function normalizeRoomStatus(value: unknown): RoomApiStatus | null {
    const s = String(value ?? "").trim().toUpperCase();
    if (!s) return null;
    if (s === "AVAILABLE" || s === "OCCUPIED" || s === "MAINTANANCE" || s === "MAINTENANCE") {
        return s as RoomApiStatus;
    }
    return null;
}

export default function BookingPage() {
	// Cấu hình Polling để cập nhật trạng thái thời gian thực mỗi 10s
	const { data, loading, error, refresh } = useRequest(getRooms, {
		pollingInterval: 10000,
		pollingWhenHidden: false,
	});
	const rooms = React.useMemo(() => normalizeRoomsResponse(data), [data]);

	const [searchText, setSearchText] = React.useState("");
	const [selectedLocations, setSelectedLocations] = React.useState<Set<string>>(
		() => new Set(),
	);
	const [selectedEquipment, setSelectedEquipment] = React.useState<Set<string>>(
		() => new Set(),
	);

	const locationOptions = React.useMemo(() => {
		const set = new Set<string>();
		for (const r of rooms) {
			const loc = (r.location || "").trim();
			if (loc) set.add(loc);
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b));
	}, [rooms]);

	const allMin = React.useMemo(() => {
		if (rooms.length === 0) return 0;
		return Math.min(...rooms.map((r) => r.capacity ?? 0));
	}, [rooms]);
	const allMax = React.useMemo(() => {
		if (rooms.length === 0) return 0;
		return Math.max(...rooms.map((r) => r.capacity ?? 0));
	}, [rooms]);

	const [seatDraft, setSeatDraft] = React.useState<[number, number]>([
		allMin,
		allMax,
	]);
	const [seatApplied, setSeatApplied] = React.useState<[number, number]>([
		allMin,
		allMax,
	]);

	React.useEffect(() => {
		setSeatDraft([allMin, allMax]);
		setSeatApplied([allMin, allMax]);
	}, [allMin, allMax]);

	const equipmentOptions = React.useMemo(() => {
		const set = new Set<string>();
		for (const r of rooms) {
			for (const eq of r.equipment || []) {
				const trimmed = (eq || "").trim();
				if (trimmed) set.add(trimmed);
			}
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b));
	}, [rooms]);

	const filteredRooms = React.useMemo(() => {
		const q = searchText.trim().toLowerCase();
		return rooms.filter((room) => {
			if (selectedLocations.size > 0) {
				const loc = (room.location || "").trim();
				if (!loc || !selectedLocations.has(loc)) return false;
			}

			const [minCap, maxCap] = seatApplied;
			if (room.capacity < minCap) return false;
			if (room.capacity > maxCap) return false;

			if (selectedEquipment.size > 0) {
				for (const eq of selectedEquipment) {
					if (!room.equipment?.includes(eq)) return false;
				}
			}

			if (!q) return true;
			const haystack = [
				room.name,
				room.location || "",
				String(room.capacity),
				...(room.equipment || []),
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			return haystack.includes(q);
		});
	}, [rooms, searchText, seatApplied, selectedEquipment, selectedLocations]);

	const toggleLocation = (location: string) => {
		setSelectedLocations((prev) => {
			const next = new Set(prev);
			if (next.has(location)) next.delete(location);
			else next.add(location);
			return next;
		});
	};

	const toggleEquipment = (eq: string) => {
		setSelectedEquipment((prev) => {
			const next = new Set(prev);
			if (next.has(eq)) next.delete(eq);
			else next.add(eq);
			return next;
		});
	};

	const clearSeat = () => {
		setSeatDraft([allMin, allMax]);
		setSeatApplied([allMin, allMax]);
	};

	const applySeat = () => {
		const [a, b] = seatDraft;
		setSeatApplied([Math.min(a, b), Math.max(a, b)]);
	};

	const clearFilters = () => {
		setSearchText("");
		setSelectedLocations(new Set());
		setSelectedEquipment(new Set());
		clearSeat();
	};

	return (
		<div className="mx-auto w-full max-w-[1400px] px-6 py-6">
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
				<section>
					<div className="mb-4 flex items-center justify-between gap-3">
						<h2 className="text-sm font-semibold text-muted-foreground">
							{filteredRooms.length} Rooms Found
						</h2>
					</div>

					{/* SỬA LỖI CHỚP MÀN HÌNH BẰNG ĐIỀU KIỆN (!data && loading) */}
					{error ? (
						<div className="rounded-xl bg-white p-10 shadow-sm ring-1 ring-border">
							<div className="text-base font-semibold text-foreground">
								Không thể tải danh sách phòng
							</div>
							<div className="mt-2 text-sm text-muted-foreground">
								{(error as any)?.message || "Vui lòng thử lại."}
							</div>
							<div className="mt-4">
								<Button
									type="button"
									className="rounded-md bg-[#4F7D7B] hover:bg-[#436d6b]"
									onClick={() => refresh()}
								>
									Thử lại
								</Button>
							</div>
						</div>
					) : (!data && loading) ? (
						<div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-border animate-pulse">
							<div className="text-base font-semibold text-foreground">
								Đang tải danh sách phòng…
							</div>
							<div className="mt-2 text-sm text-muted-foreground">
								Vui lòng chờ một chút.
							</div>
						</div>
					) : filteredRooms.length === 0 ? (
						<div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-border">
							<div className="text-base font-semibold text-foreground">
								Không có phòng nào phù hợp bộ lọc
							</div>
							<div className="mt-2 text-sm text-muted-foreground">
								Thử xoá bộ lọc hoặc thay đổi sức chứa.
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
							{filteredRooms.map((room) => {
								// TÍNH TOÁN TRẠNG THÁI TỪ API
								const apiStatus = normalizeRoomStatus((room as any).status) ?? "AVAILABLE";
                                const statusType =
                                    apiStatus === "AVAILABLE"
                                        ? "available"
                                        : apiStatus === "OCCUPIED"
                                            ? "busy"
                                            : "maintenance";

								return (
									<div
										key={room.id}
										className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border hover:shadow-md transition-shadow relative"
									>
										{/* Hình ảnh và Huy hiệu trạng thái */}
										<div className="relative aspect-[16/9] w-full bg-muted">
											{room.imageUrl ? (
												<img
													src={room.imageUrl}
													alt={room.name}
													className="h-full w-full object-cover"
													loading="lazy"
												/>
											) : null}
											
											{/* Badge overlay hiển thị trạng thái */}
                                            <div className="absolute top-3 right-3 z-10">
                                                {statusType === 'available' && <span className="bg-[#10B981] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">Trống</span>}
                                                {statusType === 'busy' && <span className="bg-[#EF4444] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">Đang sử dụng</span>}
                                                {statusType === 'maintenance' && <span className="bg-[#F97316] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">Bảo trì</span>}
                                            </div>
										</div>

										<div className="bg-muted/40 px-4 pb-4 pt-3">
											<div className="mb-1 text-lg font-semibold text-foreground">
												{room.name}
											</div>
											<div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
												<MapPin className="h-4 w-4" />
												<span>{room.location || "No location"}</span>
											</div>

											<div className="mb-4 text-xs text-muted-foreground">
												Capacity : {room.capacity}
											</div>

											<Button
												asChild
												className={`w-full rounded-md font-medium transition-colors ${
													statusType === 'maintenance' 
														? 'bg-gray-200 text-gray-500 hover:bg-gray-200 cursor-not-allowed' 
														: 'bg-[#4F7D7B] hover:bg-[#436d6b] text-white'
												}`}
											>
												<Link 
													href={`/manager/booking/${room.id}`}
													onClick={(e) => {
														// Chặn không cho bấm nếu phòng đang bận hoặc bảo trì
														if (statusType === 'maintenance') e.preventDefault();
													}}
												>
													{statusType === 'available' || statusType === 'busy' ? 'More Info' : 'Đang bảo trì'}
												</Link>
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</section>

				<aside className="h-fit rounded-xl bg-white p-5 shadow-sm ring-1 ring-border sticky top-6">
					<div className="space-y-6">
						<div>
							<div className="mb-2 text-sm font-semibold text-muted-foreground">
								Search
							</div>
							<div className="relative">
								<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									value={searchText}
									onChange={(e) => setSearchText(e.target.value)}
									placeholder="Room name, capacity, equipment…"
									className="pl-9"
								/>
							</div>
						</div>

						<div>
							<div className="mb-3 text-sm font-semibold text-muted-foreground">
								Filter by Location:
							</div>
							<div className="space-y-2 max-h-48 overflow-y-auto">
								{locationOptions.length === 0 ? (
									<div className="text-sm text-muted-foreground">No location</div>
								) : (
									locationOptions.map((loc) => (
										<label
											key={loc}
											className="flex cursor-pointer items-center gap-3 text-sm text-foreground hover:bg-gray-50 p-1 -ml-1 rounded"
										>
											<Checkbox
												checked={selectedLocations.has(loc)}
												onCheckedChange={() => toggleLocation(loc)}
											/>
											{loc}
										</label>
									))
								)}
							</div>
						</div>

						<div>
							<div className="mb-3 text-sm font-semibold text-muted-foreground">
								Filter by Equipment:
							</div>
							<div className="space-y-2 max-h-48 overflow-y-auto">
								{equipmentOptions.length === 0 ? (
									<div className="text-sm text-muted-foreground">No equipment</div>
								) : (
									equipmentOptions.map((eq) => (
										<label
											key={eq}
											className="flex cursor-pointer items-center gap-3 text-sm text-foreground hover:bg-gray-50 p-1 -ml-1 rounded"
										>
											<Checkbox
												checked={selectedEquipment.has(eq)}
												onCheckedChange={() => toggleEquipment(eq)}
											/>
											{eq}
										</label>
									))
								)}
							</div>
						</div>

						<div>
							<div className="mb-3 text-sm font-semibold text-muted-foreground">
								Filter by Capacity:
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
											{seatDraft[0]}
										</div>
									</div>
									<div className="rounded-md bg-white px-3 py-2 text-center text-xs ring-1 ring-border">
										<div className="text-muted-foreground">Max Limit</div>
										<div className="font-semibold text-foreground">
											{seatDraft[1]}
										</div>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<Button type="button" variant="ghost" onClick={clearFilters}>
										Clear filters
									</Button>

									<Button
										type="button"
										onClick={applySeat}
										size="sm"
										className="rounded-md bg-[#4F7D7B] hover:bg-[#436d6b] text-white"
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