import { request } from "../service";

export type MyAttendanceParams = {
  page?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
};

export type MonthlySummaryParams = {
  month: number;
  year: number;
};

export async function checkIn(options?: { [key: string]: any }) {
  return request<any>("/attendance/check-in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export async function checkOut(options?: { [key: string]: any }) {
  return request<any>("/attendance/check-out", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export async function getMyAttendance(params?: MyAttendanceParams, options?: { [key: string]: any }) {
    return request<any>("/attendance/my-attendance", {
        method: "GET",
        params, // -> ?page=1&pageSize=20&fromDate=...&toDate=...
        headers: {
            "Content-Type": "application/json",
        },
        ...(options || {}),
    });
}

export async function getMonthlySummary(params: MonthlySummaryParams, options?: { [key: string]: any }) {
  return request<any>("/attendance/my-attendance/monthly-summary", {
    method: "GET",
    params, // -> ?month=...&year=...
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}