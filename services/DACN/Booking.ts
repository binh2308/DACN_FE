import { request } from "../service";

export type BookingByRoom = {
	id: string;
	startTime: string;
	endTime: string;
	name: string;
	roomName: string;
};

export type BookingsByRoomResponse = {
	statusCode: number;
	message: string;
	data: BookingByRoom[];
};

export type RecurringPattern = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export type CreateBookingRequest = {
	room_id: string;
	start_time: string;
	end_time: string;
	purpose: string;
	recurring_pattern: RecurringPattern;
	recurring_end_date: string;
};

export type CreateBookingResponse = {
	success?: boolean;
	message?: string;
	data?: unknown;
};

export async function getBookingsByRoomId(
	roomId: string,
	options?: { [key: string]: any },
) {
	return request<BookingsByRoomResponse>(`/bookings/by-room/${roomId}`.replace(
		/\/+/g,
		"/",
	), {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
		...(options || {}),
	});
}

export async function createBooking(
	body: CreateBookingRequest,
	options?: { [key: string]: any },
) {
	return request<CreateBookingResponse>("/bookings", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		data: body,
		...(options || {}),
	});
}
