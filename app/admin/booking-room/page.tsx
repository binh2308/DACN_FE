"use client";

import * as React from "react";
import Link from "next/link";
import { useRequest } from "ahooks";
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";

import { getBookings } from "@/services/DACN/Booking";

type AnyBooking = any;

// --- UTILS XỬ LÝ DỮ LIỆU API ---
function normalizeAllBookingsResponse(data: unknown): AnyBooking[] {
	if (!data) return [];
	if (Array.isArray(data)) return data as AnyBooking[];
	if (typeof data === "object" && data !== null) {
		if ("data" in data && Array.isArray((data as any).data)) {
			return (data as any).data as AnyBooking[];
		}
		if ("success" in data && "data" in data && Array.isArray((data as any).data)) {
			return (data as any).data as AnyBooking[];
		}
	}
	return [];
}

// --- UTILS XỬ LÝ NGÀY THÁNG ---
const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
// Mở rộng lưới thời gian từ 00:00 đến 23:00 (24 tiếng)
const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => i); 

// Lấy ngày thứ 2 đầu tuần của một ngày bất kỳ
function getStartOfWeek(date: Date) {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh để Thứ 2 là đầu tuần
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function addDays(date: Date, days: number) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

function isSameDay(d1: Date, d2: Date) {
	return d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate();
}

function formatTime(date: Date) {
	return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// Sinh ra mảng ngày cho Mini Calendar (bao gồm cả các ngày bù của tháng trước/sau)
function getMiniCalendarDays(year: number, month: number) {
	const firstDayOfMonth = new Date(year, month, 1);
	const lastDayOfMonth = new Date(year, month + 1, 0);

	const startDate = getStartOfWeek(firstDayOfMonth);
	const endDate = new Date(getStartOfWeek(lastDayOfMonth));
	endDate.setDate(endDate.getDate() + 6); // Chủ nhật cuối cùng

	const days = [];
	let current = new Date(startDate);
	while (current <= endDate) {
		days.push(new Date(current));
		current.setDate(current.getDate() + 1);
	}
	return days;
}

// Các màu nền Pastel ngẫu nhiên cho sự kiện
const EVENT_COLORS = [
	{ bg: "bg-green-100", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
	{ bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
	{ bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500" },
	{ bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200", dot: "bg-pink-500" },
	{ bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
];

export default function BookingCalendarPage() {
	// --- STATE QUẢN LÝ VIEW VÀ THỜI GIAN ---
	const [viewMode, setViewMode] = React.useState<'day' | 'week'>('week');
	const [currentDate, setCurrentDate] = React.useState(new Date());
	const [miniCalendarDate, setMiniCalendarDate] = React.useState(new Date());
	const [currentTime, setCurrentTime] = React.useState(new Date());

	// Update vạch đỏ thời gian thực mỗi phút
	React.useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	// Đồng bộ mini calendar khi currentDate bị đổi qua nút Next/Prev
	React.useEffect(() => {
		setMiniCalendarDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
	}, [currentDate]);

	// --- CALL API ---
	const { data, loading } = useRequest(getBookings);
	const allBookings = React.useMemo(() => normalizeAllBookingsResponse(data), [data]);

	// --- TÍNH TOÁN DỮ LIỆU HIỂN THỊ LỊCH ---
	const startOfWeekDate = getStartOfWeek(currentDate);
	
	// Xác định các cột hiển thị dựa trên View Mode
	const displayDays = React.useMemo(() => {
		if (viewMode === 'day') return [currentDate];
		return Array.from({ length: 7 }, (_, i) => addDays(startOfWeekDate, i));
	}, [viewMode, currentDate, startOfWeekDate]);

	const handlePrevTime = () => setCurrentDate(addDays(currentDate, viewMode === 'week' ? -7 : -1));
	const handleNextTime = () => setCurrentDate(addDays(currentDate, viewMode === 'week' ? 7 : 1));

	// Logic Mini Calendar
	const handlePrevMonth = () => setMiniCalendarDate(new Date(miniCalendarDate.setMonth(miniCalendarDate.getMonth() - 1)));
	const handleNextMonth = () => setMiniCalendarDate(new Date(miniCalendarDate.setMonth(miniCalendarDate.getMonth() + 1)));
	const handleSelectDate = (date: Date) => {
		setCurrentDate(date);
		// Tự động chuyển sang chế độ Xem Ngày (Day view) khi người dùng bấm vào 1 ngày trên lịch nhỏ
		setViewMode('day'); 
	};

	const miniCalDays = React.useMemo(() => {
		return getMiniCalendarDays(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth());
	}, [miniCalendarDate]);

	// Chuẩn hóa danh sách Booking
	const mappedBookings = React.useMemo(() => {
		return allBookings.map((b, index) => {
			const start = new Date(b.start_time ?? b.startTime);
			const end = new Date(b.end_time ?? b.endTime);
			const color = EVENT_COLORS[index % EVENT_COLORS.length];
			return {
				id: b.id,
				title: b.purpose ?? b.name ?? "Họp nội bộ",
				room: b.room?.name ?? b.roomName ?? "Phòng chưa rõ",
				start,
				end,
				color
			};
		});
	}, [allBookings]);

	// Danh sách "Hôm nay" và "Ngày mai" (Sidebar)
	const today = new Date();
	const tomorrow = addDays(today, 1);

	const todayEvents = mappedBookings.filter(b => isSameDay(b.start, today)).sort((a, b) => a.start.getTime() - b.start.getTime());
	const tomorrowEvents = mappedBookings.filter(b => isSameDay(b.start, tomorrow)).sort((a, b) => a.start.getTime() - b.start.getTime());

	// Tính toán vị trí Vạch đỏ (Hệ quy chiếu mới: 0h - 23h)
	const currentHour = currentTime.getHours();
	const currentMin = currentTime.getMinutes();
	// 1 Hour = 80px -> 1 Min = 1.333px
	const redLineTop = (currentHour * 80) + (currentMin * (80 / 60));
	const isCurrentView = displayDays.some(d => isSameDay(d, today));

	return (
		// Thay h-screen bằng h-[calc(100vh-70px)] hoặc h-full flex-1 để sửa lỗi Double Scrollbar
		<div className="flex h-full min-h-[calc(100vh-75px)] w-full bg-white font-sans overflow-hidden rounded-xl shadow-sm border border-gray-100">
			
			{/* ============================================================ */}
			{/* LEFT SIDEBAR */}
			{/* ============================================================ */}
			<aside className="w-[300px] flex-shrink-0 border-r border-gray-100 bg-white flex flex-col h-full min-h-0">
				<div className="p-6 pb-2 shrink-0">
					<Link
                        href="/admin/booking"
                        className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white border-gray-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                    >
                        ← Back
                    </Link>
				</div>

				<div className="flex-1 min-h-0 overflow-y-auto p-6 pt-4 space-y-8 custom-scrollbar">
					
					{/* Mini Calendar Header */}
					<div>
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-bold text-gray-900">{miniCalendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h3>
							<div className="flex items-center gap-1 text-gray-400">
								<ChevronLeft size={18} className="cursor-pointer hover:text-gray-900 transition-colors" onClick={handlePrevMonth} />
								<ChevronRight size={18} className="cursor-pointer hover:text-gray-900 transition-colors" onClick={handleNextMonth} />
							</div>
						</div>
						
						<div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-500 mb-2">
							<div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
						</div>
						
						<div className="grid grid-cols-7 text-center text-sm gap-y-1">
							{miniCalDays.map((day, i) => {
								const isThisMonth = day.getMonth() === miniCalendarDate.getMonth();
								const isSelected = isSameDay(day, currentDate);
								const isTodayLocal = isSameDay(day, today);

								let baseClass = "h-8 w-8 mx-auto flex items-center justify-center rounded-full cursor-pointer transition-colors text-xs ";
								
								if (isSelected) {
									baseClass += "bg-[#0B9F57] text-white font-bold shadow-md";
								} else if (isTodayLocal) {
									baseClass += "text-[#0B9F57] font-bold bg-green-50 hover:bg-green-100";
								} else if (!isThisMonth) {
									baseClass += "text-gray-300 hover:bg-gray-50";
								} else {
									baseClass += "text-gray-700 font-medium hover:bg-gray-100";
								}

								return (
									<div key={i} className={baseClass} onClick={() => handleSelectDate(day)}>
										{day.getDate()}
									</div>
								)
							})}
						</div>
					</div>

					{/* Agenda: Hôm nay */}
					<div>
						<h3 className="font-bold text-gray-900 mb-4 text-sm">Hôm nay</h3>
						<div className="space-y-3">
							{todayEvents.length === 0 ? <p className="text-xs text-gray-400 italic">Không có lịch</p> : null}
							{todayEvents.map((event) => (
								<div key={event.id} className="flex items-center justify-between text-sm group">
									<div className="flex items-center gap-2 overflow-hidden pr-2">
										<span className={`w-2 h-2 rounded-full flex-shrink-0 ${event.color.dot}`}></span>
										<span className="text-gray-700 truncate font-medium group-hover:text-black">{event.title}</span>
									</div>
									<span className="text-xs font-semibold text-gray-900 flex-shrink-0">
										{formatTime(event.start)}-{formatTime(event.end)}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Agenda: Ngày mai */}
					<div>
						<h3 className="font-bold text-gray-900 mb-4 text-sm">Ngày mai</h3>
						<div className="space-y-3">
							{tomorrowEvents.length === 0 ? <p className="text-xs text-gray-400 italic">Không có lịch</p> : null}
							{tomorrowEvents.map((event) => (
								<div key={event.id} className="flex items-center justify-between text-sm group">
									<div className="flex items-center gap-2 overflow-hidden pr-2">
										<span className={`w-2 h-2 rounded-full flex-shrink-0 ${event.color.dot}`}></span>
										<span className="text-gray-700 truncate font-medium group-hover:text-black">{event.title}</span>
									</div>
									<span className="text-xs font-semibold text-gray-900 flex-shrink-0">
										{formatTime(event.start)}-{formatTime(event.end)}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</aside>

			{/* ============================================================ */}
			{/* RIGHT MAIN: CALENDAR VIEW */}
			{/* ============================================================ */}
			<main className="flex-1 flex flex-col bg-white overflow-hidden min-w-0 h-full">
				
				{/* Top Navbar */}
				<header className="h-20 px-8 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2 text-gray-400">
							<button onClick={handlePrevTime} className="p-1 rounded hover:bg-gray-100 transition"><ChevronLeft size={20} /></button>
							<button onClick={handleNextTime} className="p-1 rounded hover:bg-gray-100 transition"><ChevronRight size={20} /></button>
						</div>
						<h2 className="text-2xl font-bold text-gray-800">
							{viewMode === 'day' 
								? currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
								: currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
							}
						</h2>
					</div>

					{/* Navigation View Modes */}
					<div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 text-sm font-medium">
						<button onClick={() => setViewMode('week')} className={`px-4 py-1.5 rounded-md transition-colors ${viewMode === 'week' ? 'bg-white text-[#0B9F57] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Week</button>
						<button onClick={() => setViewMode('day')} className={`px-4 py-1.5 rounded-md transition-colors ${viewMode === 'day' ? 'bg-white text-[#0B9F57] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Day</button>
					</div>
				</header>

				{loading && !data && (
					<div className="absolute inset-0 flex items-center justify-center bg-white/50 z-50">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B9F57]"></div>
					</div>
				)}

				{/* VÙNG CUỘN GRID CHÍNH (Đã fix lỗi thanh cuộn) */}
				<div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col relative">
					
					{/* Calendar Header (Days) - Giữ dính trên cùng */}
					<div className="flex border-b border-gray-100 sticky top-0 bg-white z-30 shadow-sm">
						{/* Time Column Header Space */}
						<div className="w-20 flex-shrink-0 border-r border-gray-100 flex items-center justify-center bg-white">
							<Clock size={16} className="text-gray-300" />
						</div>
						
						{/* Day Columns */}
						<div className={`flex-1 grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'} bg-white`}>
							{displayDays.map((day, i) => {
								const isTodayLocal = isSameDay(day, today);
								return (
									<div key={i} className={`flex flex-col items-center justify-center py-3 border-r border-gray-100 last:border-r-0 ${isTodayLocal ? 'bg-[#F0FFF7]' : ''}`}>
										<span className={`text-[11px] font-bold tracking-wider mb-1 ${isTodayLocal ? 'text-[#0B9F57]' : 'text-gray-400'}`}>
											{DAYS_OF_WEEK[day.getDay()]}
										</span>
										<span className={`text-xl font-semibold ${isTodayLocal ? 'text-[#0B9F57]' : 'text-gray-800'}`}>
											{day.getDate()}
										</span>
									</div>
								);
							})}
						</div>
					</div>

					{/* Calendar Grid Body */}
					<div className="flex flex-1 relative">
						
						{/* Time Column (Y-axis) - 24 giờ */}
						<div className="w-20 flex-shrink-0 border-r border-gray-100 bg-white z-20">
							{HOURS_OF_DAY.map((hour) => (
								<div key={hour} className="h-[80px] relative border-b border-gray-50">
									<span className="absolute -top-3 w-full text-center text-xs font-medium text-gray-400 bg-white">
										{hour.toString().padStart(2, '0')}:00
									</span>
								</div>
							))}
						</div>

						{/* Grid Area */}
						<div className={`flex-1 grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'} relative`}>
							
							{/* Background Horizontal Grid Lines - 24 dòng */}
							<div className="absolute inset-0 pointer-events-none flex flex-col">
								{HOURS_OF_DAY.map((hour) => (
									<div key={hour} className="h-[80px] border-b border-gray-100 w-full shrink-0"></div>
								))}
							</div>

							{/* Render Each Day Column */}
							{displayDays.map((day, colIndex) => {
								const isTodayLocal = isSameDay(day, today);
								const dayEvents = mappedBookings.filter(b => isSameDay(b.start, day));

								return (
									<div key={colIndex} className={`relative border-r border-gray-100 last:border-r-0 ${isTodayLocal ? 'bg-[#F0FFF7]/30' : ''}`}>
										
										{/* Plot Events inside this day */}
										{dayEvents.map(event => {
											const startHour = event.start.getHours();
											const startMin = event.start.getMinutes();
											const endHour = event.end.getHours();
											const endMin = event.end.getMinutes();

											// Tính toán tọa độ (bây giờ bắt đầu từ 0h)
											const top = (startHour * 80) + (startMin * (80 / 60));
											const height = ((endHour - startHour) * 80) + ((endMin - startMin) * (80 / 60));

											return (
												<div 
													key={event.id}
													className={`absolute left-1.5 right-1.5 rounded-md border-l-[3px] p-2 overflow-hidden transition-all hover:z-10 hover:shadow-md cursor-pointer ${event.color.bg} ${event.color.border}`}
													style={{ top: `${top}px`, height: `${Math.max(height, 24)}px` }}
												>
													<div className={`text-[11px] font-bold truncate leading-tight ${event.color.text}`}>
														{event.title}
													</div>
													{height >= 40 && (
														<div className={`text-[10px] opacity-80 truncate mt-1 ${event.color.text}`}>
															{formatTime(event.start)} - {formatTime(event.end)} • {event.room}
														</div>
													)}
												</div>
											);
										})}
									</div>
								);
							})}

							{/* --- Current Time Indicator (Vạch đỏ) --- */}
							{isCurrentView && (
								<div 
									className="absolute w-full flex items-center pointer-events-none z-20"
									style={{ top: `${redLineTop}px` }}
								>
									<div className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -left-1.5 shadow-sm"></div>
									<div className="w-full h-[2px] bg-red-500 shadow-sm"></div>
								</div>
							)}

						</div>
					</div>
				</div>
			</main>

			<style jsx global>{`
				/* Tùy chỉnh thanh cuộn đẹp & mỏng hơn để không chiếm diện tích */
				.custom-scrollbar::-webkit-scrollbar {
					width: 8px;
					height: 8px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: #F8FAFC;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background-color: #CBD5E1;
					border-radius: 20px;
					border: 2px solid #F8FAFC;
				}
				.custom-scrollbar:hover::-webkit-scrollbar-thumb {
					background-color: #94A3B8;
				}
			`}</style>
		</div>
	);
}