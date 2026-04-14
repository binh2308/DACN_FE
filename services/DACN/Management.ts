import { request } from "../service";

export type ScheduleItemType = "BOOKING" | "LEAVE_REQUEST";

export type ScheduleStatus =
	| "CONFIRMED"
	| "PENDING"
	| "CANCELLED"
	| "APPROVED"
	| "REJECTED"
	| string;

export type ScheduleItemDto = {
	id: string;
	type: ScheduleItemType;
	start_time: string;
	end_time: string;
	title: string;
	subtitle?: string;
	status?: ScheduleStatus;
};

export type GetMyScheduleResponse = {
	success: boolean;
	data: {
		items: ScheduleItemDto[];
		total: number;
	};
};

export async function getMySchedule(options?: { [key: string]: any }) {
	return request<GetMyScheduleResponse>("/management/schedule/me", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
		...(options || {}),
	});
}

