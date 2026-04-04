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

export type BookingsByEmployeeResponse = {
	statusCode: number;
	message: string;
	data: BookingByRoom[];
};

export type GetBookingsResponse = {
	success: boolean;
	data: BookingByRoom[];
	total: number;
};

export type RecurringPattern = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export type CreateBookingRequest = {
	room_id: string;
	start_time: string;
	end_time: string;
	purpose: string;
	attendee_ids?: string[];
	recurring_pattern: RecurringPattern;
	recurring_end_date: string;
};

export type CreateBookingResponse = {
	success?: boolean;
	message?: string;
	data?: unknown;
};

export type BookingRoomDto = {
	id: string;
	name: string;
	capacity?: number;
	equipment?: string[];
};

export type BookingEmployeeDto = {
	id: string;
	name?: string;
	email?: string;
};

export type BookingAttendeeDto = {
	id: string;
	name?: string;
	email?: string;
};

export type BookingDetailDto = {
	id: string;
	room?: BookingRoomDto;
	employee?: BookingEmployeeDto;
	attendees?: BookingAttendeeDto[];
	start_time?: string;
	end_time?: string;
	purpose?: string;
	status?: string;
	created_at?: string;
	updated_at?: string;
};

export type AddBookingAttendeesRequest = {
	attendee_ids: string[];
};

export async function addBookingAttendees(
	bookingId: string,
	body: AddBookingAttendeesRequest,
	options?: { [key: string]: any },
) {
	return request<BookingDetailDto>(
		`/bookings/${bookingId}/attendees`.replace(/\/+/g, "/"),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			data: body,
			...(options || {}),
		},
	);
}

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

export async function getBookingsOfEmployee(options?: { [key: string]: any }) {
	return request<BookingsByEmployeeResponse>("/bookings/employee", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
		...(options || {}),
	});
}

// Admin use-case: get all bookings
export async function getBookings(options?: { [key: string]: any }) {
	return request<GetBookingsResponse>("/bookings", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
		...(options || {}),
	});
}

export type DeleteBookingResponse = {
	success?: boolean;
	message?: string;
	data?: unknown;
};

export async function deleteBooking(
	bookingId: string,
	options?: { [key: string]: any },
) {
	return request<DeleteBookingResponse>(
		`/bookings/${bookingId}`.replace(/\/+/, "/"),
		{
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			...(options || {}),
		},
	);
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
