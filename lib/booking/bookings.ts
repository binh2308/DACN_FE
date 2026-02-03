export type BookingSlot = {
	id: string;
	roomId: string;
	title: string;
	organizer: string;
	start: string; // ISO string
	end: string; // ISO string
};

export const bookingSlots: BookingSlot[] = [
	{
		id: "bk_1",
		roomId: "austin-devbay-chennai",
		title: "React Review",
		organizer: "Nijh",
		start: "2026-01-15T09:00:00",
		end: "2026-01-15T10:30:00",
	},
	{
		id: "bk_2",
		roomId: "austin-devbay-chennai",
		title: "React Review",
		organizer: "Nijh",
		start: "2026-01-15T13:00:00",
		end: "2026-01-15T14:30:00",
	},
	{
		id: "bk_3",
		roomId: "austin-devbay-chennai",
		title: "React Review",
		organizer: "Nijh",
		start: "2026-01-15T16:00:00",
		end: "2026-01-15T17:30:00",
	},
	{
		id: "bk_4",
		roomId: "tokyo-suite-bangalore",
		title: "Client Demo",
		organizer: "PM",
		start: "2026-01-16T10:00:00",
		end: "2026-01-16T11:00:00",
	},
	{
		id: "bk_5",
		roomId: "paris-atelier-hyderabad",
		title: "Workshop",
		organizer: "HR",
		start: "2026-01-17T14:00:00",
		end: "2026-01-17T16:00:00",
	},
];

export const getSlotsByRoomId = (roomId: string) =>
	bookingSlots
		.filter((b) => b.roomId === roomId)
		.sort((a, b) => a.start.localeCompare(b.start));
