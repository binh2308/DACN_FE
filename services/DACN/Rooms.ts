import { request } from "../service";

export type Room = {
	id: string;
	name: string;
	capacity: number;
	equipment: string[];
	imageUrl?: string | null;
	imageKey?: string | null;
	/**
	 * Room availability status returned by backend.
	 * Known values: AVAILABLE | OCCUPIED | MAINTANANCE
	 */
	status?: RoomStatus;
	location?: string | null;
};

export type RoomStatus =
	| "AVAILABLE"
	| "OCCUPIED"
	| "MAINTENANCE"
	| (string & {});

export type RoomsResponse = {
	success: boolean;
	data: Room[];
	total: number;
};

export type RoomDetailResponse = {
	success: boolean;
	data: Room;
};

export type UpdateRoomRequest = {
	name: string;
	capacity: number;
	equipment: string[];
	imageUrl?: string | null;
	imageKey?: string | null;
	location?: string | null;
	status?: RoomStatus;
};

export type UpdateRoomStatusRequest = {
	status: RoomStatus;
};

export type UpdateRoomResponse = {
	success: boolean;
	data: Room;
};

export type CreateRoomRequest = {
	name: string;
	capacity: number;
	equipment: string[];
	location?: string | null;
};

export type CreateRoomResponse = {
	success: boolean;
	data: Room;
};

export type DeleteRoomResponse = {
	success: boolean;
	data?: unknown;
};

export type UploadRoomImageResponse = {
	success: boolean;
	data?: unknown;
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

export async function createRoom(body: CreateRoomRequest, options?: { [key: string]: any }) {
	return request<CreateRoomResponse>("/rooms", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		data: body,
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

export async function updateRoomById(
	id: string,
	body: UpdateRoomRequest,
	options?: { [key: string]: any },
) {
	return request<UpdateRoomResponse>(`/rooms/${id}`.replace(/\/+/g, "/"), {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		data: body,
		...(options || {}),
	});
}

export async function updateRoomStatusById(
	id: string,
	status: RoomStatus,
	options?: { [key: string]: any },
) {
	return request<UpdateRoomResponse>(`/rooms/${id}`.replace(/\/+/g, "/"), {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		data: { status } as UpdateRoomStatusRequest,
		...(options || {}),
	});
}

export async function deleteRoomById(id: string, options?: { [key: string]: any }) {
	return request<DeleteRoomResponse>(`/rooms/${id}`.replace(/\/+/g, "/"), {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		...(options || {}),
	});
}

export async function uploadRoomImageById(
	id: string,
	file: File,
	options?: { [key: string]: any },
) {
	const form = new FormData();
	form.append("file", file);

	return request<UploadRoomImageResponse>(
		`/rooms/${id}/image/upload`.replace(/\/+/g, "/"),
		{
			method: "POST",
			data: form,
			headers: {
				"Content-Type": "multipart/form-data",
			},
			...(options || {}),
		},
	);
}

