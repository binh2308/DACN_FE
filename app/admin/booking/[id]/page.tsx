"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequest } from "ahooks";
import { 
	Image as ImageIcon, 
	Plus, 
	X, 
	ArrowLeft, 
	Save, 
	RefreshCw, 
	Users, 
	MapPin, 
	MonitorPlay,
	UploadCloud
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
	getRoomById,
	uploadRoomImageById,
	updateRoomById,
	type Room,
	type UpdateRoomRequest,
} from "@/services/DACN/Rooms";

// --- GIỮ NGUYÊN LOGIC CŨ ---
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

function normalizeEquipment(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	const out: string[] = [];
	const seen = new Set<string>();
	for (const raw of value) {
		const name = String(raw ?? "").trim();
		if (!name) continue;
		const k = name.toLowerCase();
		if (seen.has(k)) continue;
		seen.add(k);
		out.push(name);
	}
	return out;
}

function toNullableTrimmed(value: string) {
	const v = value.trim();
	return v ? v : null;
}

function fileToPreviewUrl(file: File | null) {
	if (!file) return null;
	return URL.createObjectURL(file);
}

export default function RoomDetailPage() {
	const { toast } = useToast();
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

	const [name, setName] = React.useState("");
	const [capacity, setCapacity] = React.useState("");
	const [location, setLocation] = React.useState("");
	const [equipment, setEquipment] = React.useState<string[]>([]);
	const [newEquipment, setNewEquipment] = React.useState("");
	const [uploadFile, setUploadFile] = React.useState<File | null>(null);
	const [uploadPreviewUrl, setUploadPreviewUrl] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!room) return;
		setName(room.name ?? "");
		setCapacity(String(room.capacity ?? ""));
		setLocation(room.location ?? "");
		setEquipment(normalizeEquipment(room.equipment));
		setNewEquipment("");
		setUploadFile(null);
	}, [room?.id, room]);

	React.useEffect(() => {
		if (!uploadFile) {
			setUploadPreviewUrl(null);
			return;
		}
		const url = fileToPreviewUrl(uploadFile);
		setUploadPreviewUrl(url);
		return () => {
			if (url) URL.revokeObjectURL(url);
		};
	}, [uploadFile]);

	const { runAsync: saveAsync, loading: saveLoading } = useRequest(
		async (payload: UpdateRoomRequest) => {
			if (!roomId) throw new Error("Missing room id");
			return updateRoomById(roomId, payload);
		},
		{ manual: true },
	);

	const { runAsync: uploadAsync, loading: uploadLoading } = useRequest(
		async (file: File) => {
			if (!roomId) throw new Error("Missing room id");
			return uploadRoomImageById(roomId, file);
		},
		{ manual: true },
	);

	const canSave = React.useMemo(() => {
		if (!room) return false;
		if (roomLoading) return false;
		if (saveLoading) return false;
		return true;
	}, [room, roomLoading, saveLoading]);

	const canUpload = React.useMemo(() => {
		if (!room) return false;
		if (roomLoading) return false;
		if (uploadLoading) return false;
		return Boolean(uploadFile);
	}, [room, roomLoading, uploadFile, uploadLoading]);

	const addEquipment = React.useCallback(() => {
		const value = newEquipment.trim();
		if (!value) return;
		setEquipment((prev) => {
			const exists = prev.some((x) => x.trim().toLowerCase() === value.toLowerCase());
			if (exists) return prev;
			return [...prev, value];
		});
		setNewEquipment("");
	}, [newEquipment]);

	const removeEquipment = React.useCallback((value: string) => {
		setEquipment((prev) => prev.filter((x) => x !== value));
	}, []);

	const onSave = React.useCallback(async () => {
		const trimmedName = name.trim();
		const capNum = Number(capacity);
		if (!trimmedName) {
			toast({
				variant: "destructive",
				title: "Thiếu thông tin",
				description: "Vui lòng nhập tên phòng.",
			});
			return;
		}
		if (!Number.isFinite(capNum) || capNum <= 0) {
			toast({
				variant: "destructive",
				title: "Sức chứa không hợp lệ",
				description: "Sức chứa (Capacity) phải là số lớn hơn 0.",
			});
			return;
		}

		const payload: UpdateRoomRequest = {
			name: trimmedName,
			capacity: Math.floor(capNum),
			equipment: normalizeEquipment(equipment),
			imageUrl: room?.imageUrl ?? null,
			imageKey: room?.imageKey ?? null,
			location: toNullableTrimmed(location),
		};

		try {
			await saveAsync(payload);
			toast({ title: "Thành công", description: "Đã cập nhật thông tin phòng họp." });
			refreshRoom();
		} catch (e: any) {
			toast({
				variant: "destructive",
				title: "Lỗi lưu dữ liệu",
				description: e?.message || "Không thể cập nhật cấu hình phòng.",
			});
		}
	}, [capacity, equipment, location, name, refreshRoom, room?.imageKey, room?.imageUrl, saveAsync, toast]);

	const onUploadImage = React.useCallback(async () => {
		if (!uploadFile) return;
		try {
			await uploadAsync(uploadFile);
			toast({ title: "Thành công", description: "Đã cập nhật hình ảnh phòng họp." });
			setUploadFile(null);
			refreshRoom();
		} catch (e: any) {
			toast({
				variant: "destructive",
				title: "Lỗi tải ảnh",
				description: e?.message || "Không thể tải lên hình ảnh.",
			});
		}
	}, [refreshRoom, toast, uploadAsync, uploadFile]);


	// --- GIAO DIỆN ĐÃ ĐƯỢC TỐI ƯU UX/UI ---
	return (
		<div className="min-h-screen bg-[#F8FAFC] pb-20">
			
			{/* Sticky Header / Action Bar */}
			<div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[#E9EAEC] px-6 py-4 shadow-sm">
				<div className="mx-auto max-w-[1200px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-4">
						<Link 
							href="/admin/booking" 
							className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
							title="Quay lại danh sách"
						>
							<ArrowLeft size={20} />
						</Link>
						<div>
							<h1 className="text-xl font-bold text-gray-900 truncate">Cấu hình phòng họp</h1>
							<p className="text-xs text-gray-500 mt-0.5">Mã phòng: <span className="font-mono bg-gray-100 px-1 rounded">{roomId}</span></p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => refreshRoom()}
							disabled={roomLoading || saveLoading}
							className="text-gray-600 border-gray-200 hover:bg-gray-50"
						>
							<RefreshCw className={`w-4 h-4 mr-2 ${roomLoading ? 'animate-spin' : ''}`} /> 
							Tải lại
						</Button>
						<Button 
							type="button" 
							onClick={onSave} 
							disabled={!canSave}
							className="bg-[#0B9F57] hover:bg-[#098b4c] text-white font-semibold px-6"
						>
							<Save className="w-4 h-4 mr-2" />
							{saveLoading ? "Đang lưu…" : "Lưu cấu hình"}
						</Button>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-[1200px] px-6 py-8">
				{/* Trạng thái lỗi */}
				{roomError ? (
					<div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 flex items-center justify-between">
						<div>
							<strong className="block mb-1">Đã có lỗi xảy ra!</strong>
							<span className="text-sm">{(roomError as any)?.message || "Không thể tải thông tin phòng từ máy chủ."}</span>
						</div>
						<Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-100" onClick={refreshRoom}>Thử lại</Button>
					</div>
				) : null}

				{/* Trạng thái đang tải (Skeleton UX) */}
				{roomLoading && !room ? (
					<div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 animate-pulse">
						<div className="h-[400px] bg-gray-200 rounded-2xl"></div>
						<div className="space-y-6">
							<div className="h-[250px] bg-gray-200 rounded-2xl"></div>
							<div className="h-[150px] bg-gray-200 rounded-2xl"></div>
						</div>
					</div>
				) : !room && !roomLoading && !roomError ? (
					<div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
						<MonitorPlay className="w-16 h-16 mx-auto text-gray-300 mb-4" />
						<h2 className="text-lg font-bold text-gray-700">Không tìm thấy phòng</h2>
						<p className="text-gray-500 mt-2 mb-6">Phòng họp này có thể đã bị xóa hoặc đường dẫn không hợp lệ.</p>
						<Button asChild className="bg-gray-800">
							<Link href="/admin/booking">Quay lại danh sách</Link>
						</Button>
					</div>
				) : (
					/* Nội dung Form chính */
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr] items-start">
						
						{/* Cột trái: Quản lý Hình ảnh */}
						<Card className="rounded-2xl border-[#E9EAEC] shadow-sm overflow-hidden sticky top-[100px]">
							<CardHeader className="bg-gray-50 border-b border-gray-100 px-5 py-4">
								<CardTitle className="text-sm uppercase tracking-wider text-gray-500 font-bold">Hình ảnh phòng</CardTitle>
							</CardHeader>
							<CardContent className="p-5">
								<div className="relative group overflow-hidden rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 aspect-[4/3] flex flex-col items-center justify-center text-center transition-colors hover:border-gray-300">
									{(uploadPreviewUrl || room?.imageUrl || "").trim() ? (
										<img
											src={uploadPreviewUrl || room?.imageUrl || ""}
											alt={name || room?.name}
											className="absolute inset-0 h-full w-full object-cover z-0"
											loading="lazy"
										/>
									) : (
										<div className="z-0 p-4">
											<ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
											<p className="text-sm font-medium text-gray-500">Chưa có hình ảnh</p>
											<p className="text-xs text-gray-400 mt-1">Tỉ lệ khuyến nghị 16:9</p>
										</div>
									)}

									{/* Lớp overlay khi người dùng chọn ảnh mới (Cải thiện luồng UX) */}
									<label htmlFor="roomImage" className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/0 hover:bg-black/40 cursor-pointer transition-all opacity-0 hover:opacity-100">
										<div className="bg-white/90 backdrop-blur text-gray-800 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg">
											<UploadCloud size={16} /> Chọn ảnh khác
										</div>
									</label>
									<Input
										id="roomImage"
										type="file"
										accept="image/*"
										className="hidden"
										onChange={(e) => {
											const f = e.target.files?.[0] || null;
											setUploadFile(f);
										}}
									/>
								</div>

								{/* Vùng hành động Upload */}
								{uploadFile && (
									<div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
										<p className="text-xs text-blue-800 font-medium">Bạn đã chọn 1 ảnh mới. Hãy Tải ảnh lên để lưu ảnh này vào hệ thống.</p>
										<div className="flex items-center gap-2">
											<Button
												type="button"
												variant="ghost"
												className="flex-1 text-gray-500 hover:bg-gray-200"
												onClick={() => setUploadFile(null)}
												disabled={uploadLoading}
											>
												Hủy
											</Button>
											<Button
												type="button"
												className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
												onClick={onUploadImage}
												disabled={uploadLoading}
											>
												{uploadLoading ? "Đang xử lý…" : "Tải ảnh lên"}
											</Button>
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Cột phải: Form Thông tin & Thiết bị */}
						<div className="space-y-6">
							
							{/* Thẻ Thông tin cơ bản */}
							<Card className="rounded-2xl border-[#E9EAEC] shadow-sm">
								<CardHeader className="bg-gray-50 border-b border-gray-100 px-6 py-4">
									<CardTitle className="text-sm uppercase tracking-wider text-gray-500 font-bold">Thông tin chung</CardTitle>
								</CardHeader>
								<CardContent className="p-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
										
										<div className="space-y-2 md:col-span-2">
											<Label htmlFor="name" className="text-gray-700 font-semibold">Tên phòng <span className="text-red-500">*</span></Label>
											<Input
												id="name"
												value={name}
												onChange={(e) => setName(e.target.value)}
												placeholder="Ví dụ: Phòng họp Boardroom..."
												className="h-10 bg-white border-gray-200 focus-visible:ring-[#0B9F57]"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="capacity" className="text-gray-700 font-semibold">Sức chứa (Người) <span className="text-red-500">*</span></Label>
											<div className="relative">
												<Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
												<Input
													id="capacity"
													type="number"
													min={1}
													value={capacity}
													onChange={(e) => setCapacity(e.target.value)}
													placeholder="Ví dụ: 10"
													className="h-10 pl-9 bg-white border-gray-200 focus-visible:ring-[#0B9F57]"
												/>
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor="location" className="text-gray-700 font-semibold">Vị trí / Tầng</Label>
											<div className="relative">
												<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
												<Input
													id="location"
													value={location}
													onChange={(e) => setLocation(e.target.value)}
													placeholder="Ví dụ: Tầng 3, Tòa nhà A..."
													className="h-10 pl-9 bg-white border-gray-200 focus-visible:ring-[#0B9F57]"
												/>
											</div>
										</div>

									</div>
								</CardContent>
							</Card>

							{/* Thẻ Thiết bị */}
							<Card className="rounded-2xl border-[#E9EAEC] shadow-sm">
								<CardHeader className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex flex-row items-center justify-between">
									<div>
										<CardTitle className="text-sm uppercase tracking-wider text-gray-500 font-bold">Trang thiết bị</CardTitle>
										<CardDescription className="text-xs mt-1">Gắn thẻ các tiện ích có trong phòng</CardDescription>
									</div>
								</CardHeader>
								<CardContent className="p-6">
									
									<div className="flex flex-col sm:flex-row items-start gap-3">
										<div className="relative flex-1 w-full">
											<MonitorPlay className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
											<Input
												value={newEquipment}
												onChange={(e) => setNewEquipment(e.target.value)}
												placeholder='Nhập tên thiết bị (VD: Tivi 4K, Bảng trắng...) và ấn Enter'
												className="h-10 pl-9 bg-white border-gray-200 focus-visible:ring-[#0B9F57]"
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														addEquipment();
													}
												}}
											/>
										</div>
										<Button
											type="button"
											onClick={addEquipment}
											disabled={!newEquipment.trim()}
											className="h-10 w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white"
										>
											<Plus className="h-4 w-4 mr-1" /> Thêm
										</Button>
									</div>

									{/* Hiển thị danh sách thiết bị dạng Tag (Badge) */}
									<div className="mt-5 min-h-[60px] p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
										{equipment.length === 0 ? (
											<div className="text-sm text-gray-400 text-center italic py-2">
												Chưa có thiết bị nào được cấu hình.
											</div>
										) : (
											<div className="flex flex-wrap gap-2">
												{equipment.map((eq) => (
													<Badge key={eq} variant="secondary" className="px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 shadow-sm transition-all group">
														<span className="max-w-[300px] truncate">{eq}</span>
														<button
															type="button"
															className="ml-2 -mr-1 p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
															onClick={() => removeEquipment(eq)}
															aria-label={`Xóa ${eq}`}
														>
															<X className="h-3.5 w-3.5" />
														</button>
													</Badge>
												))}
											</div>
										)}
									</div>

								</CardContent>
							</Card>

						</div>
					</div>
				)}
			</div>
		</div>
	);
}