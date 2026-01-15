export type RoomCity = "Bangalore" | "Chennai" | "Hyderabad";

export type RoomFacilityKey = "wifi" | "monitor" | "whiteboard";

export type Room = {
	id: string;
	name: string;
	description: string;
	imageUrl: string;
	location: {
		building: string;
		city: RoomCity;
	};
	seat: {
		min: number;
		max: number;
	};
	availability: {
		monitor: boolean;
		whiteboard: boolean;
		availableNow: boolean;
	};
	facilities: Record<RoomFacilityKey, boolean>;
};

const img = (id: string) =>
	`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

export const rooms: Room[] = [
	{
		id: "austin-devbay-chennai",
		name: "Austin",
		description:
			"Phòng họp sáng, rộng rãi, phù hợp review sprint và meeting nhóm vừa.",
		imageUrl: img("photo-1521737604893-d14cc237f11d"),
		location: { building: "Dev Bay", city: "Chennai" },
		seat: { min: 20, max: 24 },
		availability: { monitor: true, whiteboard: true, availableNow: true },
		facilities: { wifi: true, monitor: true, whiteboard: true },
	},
	{
		id: "boston-hub-chennai",
		name: "Boston",
		description: "Tối ưu cho họp quick sync, có màn hình và wifi ổn định.",
		imageUrl: img("photo-1522071820081-009f0129c71c"),
		location: { building: "Hub", city: "Chennai" },
		seat: { min: 10, max: 14 },
		availability: { monitor: true, whiteboard: false, availableNow: false },
		facilities: { wifi: true, monitor: true, whiteboard: false },
	},
	{
		id: "tokyo-suite-bangalore",
		name: "Tokyo",
		description: "Phòng họp executive, phù hợp họp khách hàng và demo.",
		imageUrl: img("photo-1556761175-4b46a572b786"),
		location: { building: "Suite", city: "Bangalore" },
		seat: { min: 6, max: 10 },
		availability: { monitor: true, whiteboard: true, availableNow: true },
		facilities: { wifi: true, monitor: true, whiteboard: true },
	},
	{
		id: "oslo-lab-bangalore",
		name: "Oslo",
		description: "Phòng họp nhỏ, phù hợp brainstorming.",
		imageUrl: img("photo-1557804506-669a67965ba0"),
		location: { building: "Lab", city: "Bangalore" },
		seat: { min: 4, max: 6 },
		availability: { monitor: false, whiteboard: true, availableNow: true },
		facilities: { wifi: true, monitor: false, whiteboard: true },
	},
	{
		id: "paris-atelier-hyderabad",
		name: "Paris",
		description: "Không gian mở, nhiều ánh sáng, phù hợp workshop.",
		imageUrl: img("photo-1524758631624-e2822e304c36"),
		location: { building: "Atelier", city: "Hyderabad" },
		seat: { min: 12, max: 18 },
		availability: { monitor: true, whiteboard: true, availableNow: false },
		facilities: { wifi: true, monitor: true, whiteboard: true },
	},
	{
		id: "seoul-tower-hyderabad",
		name: "Seoul",
		description: "Phòng họp tiêu chuẩn, tiện cho daily và planning.",
		imageUrl: img("photo-1525186402429-b4ff38bedbec"),
		location: { building: "Tower", city: "Hyderabad" },
		seat: { min: 8, max: 12 },
		availability: { monitor: true, whiteboard: false, availableNow: true },
		facilities: { wifi: true, monitor: true, whiteboard: false },
	},
	{
		id: "madrid-north-chennai",
		name: "Madrid",
		description: "Phòng họp nhóm, có bảng viết cho note.",
		imageUrl: img("photo-1504384308090-c894fdcc538d"),
		location: { building: "North", city: "Chennai" },
		seat: { min: 14, max: 20 },
		availability: { monitor: false, whiteboard: true, availableNow: false },
		facilities: { wifi: true, monitor: false, whiteboard: true },
	},
	{
		id: "london-bridge-bangalore",
		name: "London",
		description: "Tối ưu cho họp hybrid, có màn hình lớn.",
		imageUrl: img("photo-1520607162513-77705c0f0d4a"),
		location: { building: "Bridge", city: "Bangalore" },
		seat: { min: 16, max: 22 },
		availability: { monitor: true, whiteboard: true, availableNow: false },
		facilities: { wifi: true, monitor: true, whiteboard: true },
	},
	{
		id: "rome-park-hyderabad",
		name: "Rome",
		description: "Phòng nhỏ yên tĩnh, hợp review và 1-1.",
		imageUrl: img("photo-1521737604893-d14cc237f11d"),
		location: { building: "Park", city: "Hyderabad" },
		seat: { min: 2, max: 4 },
		availability: { monitor: false, whiteboard: false, availableNow: true },
		facilities: { wifi: true, monitor: false, whiteboard: false },
	},
];

const cityOrder: RoomCity[] = ["Bangalore", "Chennai", "Hyderabad"];
export const roomCities: RoomCity[] = cityOrder.filter((c) =>
	rooms.some((r) => r.location.city === c),
);

export const getRoomById = (id: string) => rooms.find((r) => r.id === id);
