import { request } from "../service";

export type Room = {
	id: string;
	name: string;
	capacity: number;
	equipment: string[];
	imageUrl?: string | null;
	imageKey?: string | null;
	location?: string | null;
};

export type RoomsResponse = {
	success: boolean;
	data: Room[];
	total: number;
};

export type RoomDetailResponse = {
	success: boolean;
	data: Room;
};

export async function getRooms(options?: { [key: string]: any }) {
	return request<RoomsResponse>("/rooms", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
		...(options || {}),
	});
}

export async function getRoomById(id: string, options?: { [key: string]: any }) {
	return request<RoomDetailResponse>(`/rooms/${id}`.replace(/\/+/g, "/"), {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
		...(options || {}),
	});
}

