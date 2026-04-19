import { request } from "../service";

export type AttendanceRecordDto = {
	id: string;
	TimeIn: string;
	TimeOut: string | null;
};

export type AttendanceActionResponse = {
	success: boolean;
	message?: string;
	data: AttendanceRecordDto;
};

export type MonthlyAttendanceSummaryDto = {
	year: number;
	month: number;
	requiredWorkingDays: number;
	workedDays: number;
	enoughDays: number;
	lateDays: number;
	absentDays: number;
	totalWorkedHours: number;
};

export type MonthlyAttendanceSummaryResponse = {
	statusCode: number;
	message?: string;
	data: MonthlyAttendanceSummaryDto;
};

export type DepartmentTodayCheckinEmployeeDto = {
	employeeId: string;
	email: string;
	firstName: string;
	middleName?: string | null;
	lastName: string;
	worked: boolean;
};

export type DepartmentTodayCheckinStatusDto = {
	date: string; // YYYY-MM-DD
	departmentId: string;
	departmentName: string;
	totalEmployees: number;
	checkedInCount: number;
	notCheckedInCount: number;
	employees: DepartmentTodayCheckinEmployeeDto[];
};

export type DepartmentTodayCheckinStatusResponse = {
	statusCode: number;
	message?: string;
	data: DepartmentTodayCheckinStatusDto;
};

// Check-in for current user (according to token/cookie)
export async function checkIn(options?: { [key: string]: any }) {
	return request<AttendanceActionResponse, AttendanceActionResponse>("/attendance/check-in", {
		method: "POST",
		...(options || {}),
	});
}

// Check-out for current user (according to token/cookie)
export async function checkOut(options?: { [key: string]: any }) {
	return request<AttendanceActionResponse, AttendanceActionResponse>("/attendance/check-out", {
		method: "POST",
		...(options || {}),
	});
}

// Get monthly attendance summary for current user
export async function getMyAttendanceMonthlySummary(
	params: { year: number; month: number },
	options?: { [key: string]: any },
) {
	return request<MonthlyAttendanceSummaryResponse, MonthlyAttendanceSummaryResponse>(
		"/attendance/my-attendance/monthly-summary",
		{
			method: "GET",
			params,
			...(options || {}),
		},
	);
}

// Get today's check-in status for current user's department
export async function getDepartmentTodayCheckinStatus(
	params?: { date?: string },
	options?: { [key: string]: any },
) {
	return request<DepartmentTodayCheckinStatusResponse, DepartmentTodayCheckinStatusResponse>(
		"/attendance/department/today-checkin-status",
		{
			method: "GET",
			params,
			...(options || {}),
		},
	);
}
