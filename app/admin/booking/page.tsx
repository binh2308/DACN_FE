"use client";

import * as React from "react";
import Link from "next/link";
import { useRequest } from "ahooks";
import { 
  MapPin, 
  Search, 
  Plus, 
  MonitorPlay, 
  Users, 
  Wrench, 
  Settings, 
  Wifi, 
  Tv, 
  PenTool, 
  ChevronDown,
  Video,
  X,
  Image as ImageIcon,
  UploadCloud
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    createRoom,
    deleteRoomById,
    getRooms,
    uploadRoomImageById, // Bổ sung API upload ảnh
    type CreateRoomRequest,
    type Room,
} from "@/services/DACN/Rooms";

// --- HELPER FUNCTIONS CHO NGÀY THÁNG LẤY TỪ ĐOẠN CODE CỦA BẠN ---
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

function normalizeEquipment(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const raw of value) {
        const name = String(raw ?? "").trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(name);
    }
    return out;
}

type RoomApiStatus = "AVAILABLE" | "OCCUPIED" | "MAINTANANCE" | "MAINTENANCE";

function normalizeRoomStatus(value: unknown): RoomApiStatus | null {
    const s = String(value ?? "").trim().toUpperCase();
    if (!s) return null;
    if (s === "AVAILABLE" || s === "OCCUPIED" || s === "MAINTANANCE" || s === "MAINTENANCE") {
        return s as RoomApiStatus;
    }
    return null;
}

export default function BookingPage() {
    const { toast } = useToast();
    const { data, loading, error, refresh } = useRequest(getRooms, {
        pollingInterval: 5000,
        pollingWhenHidden: false,
    });
    const rooms = React.useMemo(() => normalizeRoomsResponse(data), [data]);

    const [createOpen, setCreateOpen] = React.useState(false);
    const [createName, setCreateName] = React.useState("");
    const [createCapacity, setCreateCapacity] = React.useState("20");
    const [createLocation, setCreateLocation] = React.useState("");
    const [createEquipment, setCreateEquipment] = React.useState<string[]>([]);
    const [createNewEquipment, setCreateNewEquipment] = React.useState("");
    
    // --- STATE CHO UPLOAD ẢNH ---
    const [createFile, setCreateFile] = React.useState<File | null>(null);
    const [createPreviewUrl, setCreatePreviewUrl] = React.useState<string | null>(null);

    // Hiển thị URL Preview khi người dùng chọn ảnh
    React.useEffect(() => {
        if (!createFile) {
            setCreatePreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(createFile);
        setCreatePreviewUrl(url);
        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [createFile]);

    const { runAsync: createAsync, loading: creating } = useRequest(
        async (payload: CreateRoomRequest) => createRoom(payload),
        { manual: true },
    );

    const { runAsync: deleteAsync, loading: deleting } = useRequest(
        async (roomId: string) => deleteRoomById(roomId),
        { manual: true },
    );

    const resetCreateForm = React.useCallback(() => {
        setCreateName("");
        setCreateCapacity("20");
        setCreateLocation("");
        setCreateEquipment([]);
        setCreateNewEquipment("");
        setCreateFile(null); // Reset file ảnh
    }, []);

    const addCreateEquipment = React.useCallback(() => {
        const value = createNewEquipment.trim();
        if (!value) return;
        setCreateEquipment((prev) => {
            const exists = prev.some((x) => x.trim().toLowerCase() === value.toLowerCase());
            if (exists) return prev;
            return [...prev, value];
        });
        setCreateNewEquipment("");
    }, [createNewEquipment]);

    const removeCreateEquipment = React.useCallback((value: string) => {
        setCreateEquipment((prev) => prev.filter((x) => x !== value));
    }, []);

    const onCreateRoom = React.useCallback(async () => {
        const name = createName.trim();
        const capNum = Number(createCapacity);
        if (!name) {
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
                description: "Capacity phải là số > 0.",
            });
            return;
        }

        try {
            // 1. Gửi request tạo phòng mới
            const res = await createAsync({
                name,
                capacity: Math.floor(capNum),
                equipment: normalizeEquipment(createEquipment),
                location: createLocation.trim(),
            });

            // 2. Lấy ID của phòng vừa tạo để upload ảnh (nếu có chọn ảnh)
            const newRoomId = (res as any)?.data?.id ?? (res as any)?.id;
            
            if (newRoomId && createFile) {
                try {
                    await uploadRoomImageById(newRoomId, createFile);
                } catch (imgError) {
                    console.error("Lỗi upload ảnh:", imgError);
                    toast({
                        variant: "destructive",
                        title: "Lỗi tải ảnh",
                        description: "Phòng đã tạo thành công nhưng hình ảnh tải lên bị lỗi.",
                    });
                }
            }

            toast({ title: "Đã tạo phòng", description: "Tạo phòng họp thành công." });
            setCreateOpen(false);
            resetCreateForm();
            refresh();
        } catch (e: any) {
            toast({
                variant: "destructive",
                title: "Tạo phòng thất bại",
                description: e?.message || "Không thể tạo phòng.",
            });
        }
    }, [
        createAsync,
        createCapacity,
        createEquipment,
        createLocation,
        createName,
        createFile,
        refresh,
        resetCreateForm,
        toast,
    ]);

    const onDeleteRoom = React.useCallback(
        async (room: Room) => {
            const ok = window.confirm(`Xoá phòng "${room.name}"? Thao tác này không thể hoàn tác.`);
            if (!ok) return;
            try {
                await deleteAsync(room.id);
                toast({ title: "Đã xoá", description: "Xoá phòng họp thành công." });
                refresh();
            } catch (e: any) {
                toast({
                    variant: "destructive",
                    title: "Xoá thất bại",
                    description: e?.message || "Không thể xoá phòng.",
                });
            }
        },
        [deleteAsync, refresh, toast],
    );

    const [searchText, setSearchText] = React.useState("");
    const [selectedLocations, setSelectedLocations] = React.useState<Set<string>>(() => new Set());
    const [selectedEquipment, setSelectedEquipment] = React.useState<Set<string>>(() => new Set());

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

    const [seatDraft, setSeatDraft] = React.useState<[number, number]>([allMin, allMax]);
    const [seatApplied, setSeatApplied] = React.useState<[number, number]>([allMin, allMax]);

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
            ].filter(Boolean).join(" ").toLowerCase();
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

    const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

    const today = todayYmd();

    const mockSchedule = [
        { time: "09:00", title: "Họp Daily Marketing", room: "Phòng Creative", avatars: ["bg-blue-300", "bg-teal-300"], extra: "+5", current: false },
        { time: "10:30", title: "Ban Lãnh Đạo Q4", room: "Phòng Boardroom", status: "Đang diễn ra", current: true },
        { time: "14:00", title: "Onboarding NV Mới", room: "Phòng Training A", current: false },
    ];

    return (
        <div className="mx-auto w-full min-h-screen bg-[#F8FAFC]">
            
            {/* Top Header Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">Quản lý Phòng họp</h1>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {filteredRooms.length} Phòng
                    </div>
                </div>
                <Button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    disabled={creating}
                    className="bg-[#3B82F6] hover:bg-blue-600 text-white"
                >
                    <Plus size={16} className="mr-2" /> Thêm phòng mới
                </Button>
            </div>

            <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
                
                {/* Left Column: Danh sách phòng */}
                <section>
                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h2 className="text-lg font-bold text-gray-800">Danh sách phòng</h2>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="Tìm kiếm..."
                                    className="pl-9 h-9 w-48 rounded-full bg-gray-100 border-transparent focus-visible:ring-1"
                                />
                            </div>

                            <div className="relative">
                                <button 
                                    onClick={() => setOpenDropdown(openDropdown === 'loc' ? null : 'loc')}
                                    className="flex items-center gap-2 h-9 px-4 rounded-full bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors"
                                >
                                    Tất cả vị trí <ChevronDown size={14} />
                                </button>
                                {openDropdown === 'loc' && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 p-3 z-50">
                                        <div className="font-semibold text-xs text-gray-500 mb-2 uppercase">Lọc theo vị trí</div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {locationOptions.length === 0 ? (
                                                <div className="text-sm text-gray-400">Không có dữ liệu</div>
                                            ) : (
                                                locationOptions.map((loc) => (
                                                    <label key={loc} className="flex cursor-pointer items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 p-1 rounded">
                                                        <Checkbox checked={selectedLocations.has(loc)} onCheckedChange={() => toggleLocation(loc)} />
                                                        {loc}
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <button 
                                    onClick={() => setOpenDropdown(openDropdown === 'cap' ? null : 'cap')}
                                    className="flex items-center gap-2 h-9 px-4 rounded-full bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors"
                                >
                                    Tất cả sức chứa <ChevronDown size={14} />
                                </button>
                                {openDropdown === 'cap' && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 p-4 z-50">
                                        <div className="font-semibold text-xs text-gray-500 mb-4 uppercase">Lọc theo sức chứa</div>
                                        <Slider min={allMin} max={allMax} step={1} value={[seatDraft[0], seatDraft[1]]} onValueChange={(v) => setSeatDraft([v[0] ?? allMin, v[1] ?? allMax])} />
                                        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                                            <span>Min: {seatDraft[0]}</span>
                                            <span>Max: {seatDraft[1]}</span>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <Button size="sm" variant="outline" className="w-full" onClick={clearSeat}>Xóa</Button>
                                            <Button size="sm" className="w-full bg-[#3B82F6]" onClick={() => { applySeat(); setOpenDropdown(null); }}>Áp dụng</Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {(searchText || selectedLocations.size > 0 || selectedEquipment.size > 0 || seatApplied[0] !== allMin || seatApplied[1] !== allMax) && (
                                <button onClick={clearFilters} className="text-sm text-red-500 hover:underline">Xóa bộ lọc</button>
                            )}
                        </div>
                    </div>

                    {/* Loading / Error States */}
                    {error ? (
                        <div className="rounded-xl bg-white p-10 text-center shadow-sm border border-red-100">
                            <div className="text-red-500 font-semibold">Lỗi tải dữ liệu</div>
                            <Button className="mt-4 bg-[#3B82F6]" onClick={() => refresh()}>Thử lại</Button>
                        </div>
                    ) : (!data && loading) ? (
                        <div className="rounded-xl bg-white p-10 text-center shadow-sm border border-gray-100 animate-pulse">
                            <div className="text-gray-500 font-semibold">Đang tải danh sách phòng...</div>
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="rounded-xl bg-white p-10 text-center shadow-sm border border-gray-100">
                            <div className="text-gray-500 font-semibold">Không tìm thấy phòng phù hợp.</div>
                        </div>
                    ) : (
                        /* Room Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredRooms.map((room) => {
                                const apiStatus = normalizeRoomStatus((room as any).status) ?? "AVAILABLE";
                                const statusType =
                                    apiStatus === "AVAILABLE"
                                        ? "available"
                                        : apiStatus === "OCCUPIED"
                                            ? "busy"
                                            : "maintenance";
                                
                                return (
                                    <div key={room.id} className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                        
                                        {/* Card Header (Graphic Area) */}
                                        <div className={`relative h-40 flex items-center justify-center overflow-hidden
                                            ${statusType === 'available' ? 'bg-[#F8FAFC]' : statusType === 'busy' ? 'bg-[#FEF2F2]' : 'bg-[#F3F4F6]'}
                                        `}>
                                            {room.imageUrl ? (
                                                <>
                                                    <img 
                                                        src={room.imageUrl} 
                                                        alt={room.name} 
                                                        className="absolute inset-0 w-full h-full object-cover z-0"
                                                    />
                                                    <div className="absolute inset-0 bg-black/10 z-0"></div>
                                                </>
                                            ) : (
                                                <div className="z-0">
                                                    {statusType === 'available' && <MonitorPlay size={48} className="text-gray-400" />}
                                                    {statusType === 'busy' && (
                                                        <div className="text-center">
                                                            <div className="flex justify-center mb-2"><Users size={32} className="text-red-500" /></div>
                                                            <div className="text-red-600 font-bold text-sm">Đang họp</div>
                                                        </div>
                                                    )}
                                                    {statusType === 'maintenance' && <Wrench size={48} className="text-gray-400" />}
                                                </div>
                                            )}

                                            <div className="absolute top-3 right-3 z-10">
                                                {statusType === 'available' && <span className="bg-[#10B981] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">Trống</span>}
                                                {statusType === 'busy' && <span className="bg-[#EF4444] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">Đang họp</span>}
                                                {statusType === 'maintenance' && <span className="bg-[#F97316] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">Bảo trì</span>}
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-gray-900 text-lg">{room.name}</h3>
                                                <div className="text-right shrink-0 ml-2">
                                                    <span className="text-[#3B82F6] font-bold text-xl leading-none">{room.capacity}</span>
                                                    <div className="text-[10px] text-gray-400 uppercase">Chỗ ngồi</div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                                <MapPin size={14}/> {room.location || "Chưa cập nhật vị trí"}
                                            </div>

                                            {/* Equipment Pills */}
                                            <div className="flex flex-wrap gap-2 mt-auto mb-4">
                                                {room.equipment?.slice(0, 4).map((eq, i) => {
                                                    const eqLower = eq.toLowerCase();
                                                    let Icon = MonitorPlay;
                                                    
                                                    if (eqLower.includes('wifi')) Icon = Wifi;
                                                    else if (eqLower.includes('tv') || eqLower.includes('screen')) Icon = Tv;
                                                    else if (eqLower.includes('bảng') || eqLower.includes('whiteboard')) Icon = PenTool;
                                                    else if (eqLower.includes('projector') || eqLower.includes('máy chiếu')) Icon = Video;

                                                    return (
                                                        <span key={i} className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs px-2.5 py-1.5 rounded-md">
                                                            <Icon size={12}/>
                                                            {eq}
                                                        </span>
                                                    );
                                                })}
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                                <Link 
                                                    href={`/admin/booking/${room.id}`} 
                                                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                                                >
                                                    <Settings size={16} /> Cấu hình
                                                </Link>
                                                
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => onDeleteRoom(room)}
                                                    disabled={deleting}
                                                >
                                                    Xoá phòng
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Right Column: Lịch đặt hôm nay (Sidebar) */}
                <aside>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-bold text-gray-900">Lịch đặt hôm nay</h2>
                            <span className="text-xs text-gray-400 font-medium">{formatDateVi(today)}</span>
                        </div>

                        {mockSchedule && mockSchedule.length > 0 ? (
                            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                {mockSchedule.map((item, idx) => (
                                    <div key={idx} className="relative flex items-start gap-4 pb-6 group">
                                        <div className="w-10 text-xs font-bold text-gray-500 pt-1 shrink-0">{item.time}</div>
                                        
                                        <div className="relative z-10 w-2 h-2 rounded-full bg-gray-300 mt-2 ring-4 ring-white shrink-0"></div>
                                        
                                        <div className={`flex-1 rounded-xl p-3 border ${item.current ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                                            <h4 className={`text-sm font-bold mb-1 ${item.current ? 'text-red-600' : 'text-[#3B82F6]'}`}>
                                                {item.title}
                                            </h4>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                                                <MapPin size={12} /> {item.room}
                                            </div>
                                            
                                            {item.current && (
                                                <div className="text-xs font-bold text-red-500">Đang diễn ra</div>
                                            )}
                                            
                                            {item.avatars && (
                                                <div className="flex items-center mt-2">
                                                    {item.avatars.map((bg, i) => (
                                                        <div key={i} className={`w-6 h-6 rounded-full border-2 border-white ${bg} -ml-2 first:ml-0`}></div>
                                                    ))}
                                                    <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 text-[9px] font-bold text-gray-600 flex items-center justify-center -ml-2">
                                                        {item.extra}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 mb-6 text-sm text-gray-500 italic text-center">Chưa có lịch.</div>
                        )}

                        <Link 
                            href="/admin/booking-room" 
                            className="flex items-center justify-center w-full mt-2 py-2.5 rounded-lg border border-blue-200 text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors"
                        >
                            Xem toàn bộ lịch
                        </Link>
                    </div>
                </aside>

            </div>

            {/* MODAL TẠO PHÒNG MỚI */}
            <Dialog
                open={createOpen}
                onOpenChange={(open) => {
                    setCreateOpen(open);
                    if (!open) resetCreateForm();
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Thêm phòng mới</DialogTitle>
                        <DialogDescription>
                            Cấu hình thông số và hình ảnh cho phòng họp mới.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 py-2">
                        {/* KHU VỰC UPLOAD ẢNH PHÒNG MỚI */}
                        <div className="grid gap-2">
                            <Label className="font-semibold text-gray-700">Hình ảnh phòng</Label>
                            <div className="relative group overflow-hidden rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 aspect-[16/9] flex flex-col items-center justify-center text-center transition-colors hover:border-gray-300">
                                {createPreviewUrl ? (
                                    <img
                                        src={createPreviewUrl}
                                        alt="Preview"
                                        className="absolute inset-0 h-full w-full object-cover z-0"
                                    />
                                ) : (
                                    <div className="z-0 p-4">
                                        <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-gray-500">Tải ảnh lên</p>
                                        <p className="text-xs text-gray-400 mt-1">Tỉ lệ khuyến nghị 16:9</p>
                                    </div>
                                )}

                                <label htmlFor="createRoomImage" className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/0 hover:bg-black/40 cursor-pointer transition-all opacity-0 hover:opacity-100">
                                    <div className="bg-white/90 backdrop-blur text-gray-800 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg">
                                        <UploadCloud size={16} /> Chọn ảnh
                                    </div>
                                </label>
                                <Input
                                    id="createRoomImage"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] || null;
                                        setCreateFile(f);
                                    }}
                                />
                            </div>
                        </div>

                        {/* CÁC TRƯỜNG THÔNG TIN KHÁC */}
                        <div className="grid gap-2">
                            <Label htmlFor="createName" className="font-semibold text-gray-700">Tên phòng</Label>
                            <Input
                                id="createName"
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                placeholder="Ví dụ: Meeting Room B"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="createCapacity" className="font-semibold text-gray-700">Sức chứa</Label>
                                <Input
                                    id="createCapacity"
                                    type="number"
                                    min={1}
                                    value={createCapacity}
                                    onChange={(e) => setCreateCapacity(e.target.value)}
                                    placeholder="Ví dụ: 20"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="createLocation" className="font-semibold text-gray-700">Vị trí / Tầng</Label>
                                <Input
                                    id="createLocation"
                                    value={createLocation}
                                    onChange={(e) => setCreateLocation(e.target.value)}
                                    placeholder="Ví dụ: Building B, Floor 3"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label className="font-semibold text-gray-700">Trang thiết bị</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={createNewEquipment}
                                    onChange={(e) => setCreateNewEquipment(e.target.value)}
                                    placeholder='Ví dụ: "Projector"'
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addCreateEquipment();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addCreateEquipment}
                                    disabled={!createNewEquipment.trim()}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Thêm
                                </Button>
                            </div>
                            {createEquipment.length === 0 ? (
                                <div className="text-sm text-muted-foreground mt-1">Chưa có thiết bị nào.</div>
                            ) : (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {createEquipment.map((eq) => (
                                        <Badge key={eq} variant="secondary" className="gap-1 pr-1 bg-gray-100 text-gray-700">
                                            <span className="max-w-[200px] truncate">{eq}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 ml-1 text-gray-400 hover:text-red-500"
                                                onClick={() => removeCreateEquipment(eq)}
                                                aria-label={`Remove ${eq}`}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCreateOpen(false)}
                            disabled={creating}
                        >
                            Huỷ
                        </Button>
                        <Button 
                            type="button" 
                            onClick={onCreateRoom} 
                            disabled={creating}
                            className="bg-[#3B82F6] hover:bg-blue-600 text-white"
                        >
                            {creating ? "Đang tạo…" : "Tạo phòng"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}