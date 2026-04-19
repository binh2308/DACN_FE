import { request } from "../service";
import type { DACN } from "./typings";

export type MyLeaveRequestsParams = {
  page?: number;
  pageSize?: number;
  employeeId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
};

export async function myRequests(
  params?: MyLeaveRequestsParams,
  options?: { [key: string]: any },
) {
  return request<any>("/leave-requests/my", {
    method: "GET",
    params, 
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export type DepartmentLeaveRequestsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
};

export type DepartmentLeaveRequestItem = {
  id: string;
  created_at: string;
  employee: {
    id: string;
    name: string;
  };
  date_from: string;
  date_to: string;
  reason: string;
  status: string;
};

export type DepartmentLeaveRequestsResponse = {
  statusCode: number;
  message?: string;
  data: {
    items: DepartmentLeaveRequestItem[];
    total: number;
    page: number;
    pageSize: number;
  };
};

export type LeaveRequestDetail = {
  id: string;
  created_at: string;
  updated_at: string;
  employee: {
    id: string;
    name: string;
  };
  approved_by: {
    id: string;
    name: string;
  } | null;
  date_from: string;
  date_to: string;
  reason: string;
  description: string;
  status: string;
};

export type LeaveRequestDetailResponse = {
  statusCode: number;
  message?: string;
  data: LeaveRequestDetail;
};

export type ProcessLeaveRequestPayload = {
  status: "APPROVED" | "REJECTED";
};

export type ProcessLeaveRequestResponse = {
  statusCode: number;
  message?: string;
  data?: unknown;
};

// Lấy danh sách đơn xin nghỉ phép của nhân viên cùng phòng ban với user hiện tại
export async function getDepartmentLeaveRequests(
  params?: DepartmentLeaveRequestsParams,
  options?: { [key: string]: any },
) {
  return request<DepartmentLeaveRequestsResponse, DepartmentLeaveRequestsResponse>(
    "/leave-requests/department",
    {
    method: "GET",
    params,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
    },
  );
}

//Tạo đơn xin nghỉ mới
export async function createLeaveRequest(
  data: DACN.CreateLeaveRequestDto,
  options?: { [key: string]: any },
) {
  return request<any>("/leave-requests/submit", {
    method: "POST",
    data,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

// Lấy chi tiết đơn xin nghỉ theo id
export async function getLeaveRequestById(
  id: string,
  options?: { [key: string]: any },
) {
  return request<LeaveRequestDetailResponse>(`/leave-requests/${id}` as const, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

// Duyệt / từ chối đơn xin nghỉ theo id
export async function processLeaveRequest(
  id: string,
  data: ProcessLeaveRequestPayload,
  options?: { [key: string]: any },
) {
  return request<ProcessLeaveRequestResponse>(
    `/leave-requests/${id}/process` as const,
    {
      method: "PATCH",
      data,
      headers: {
        "Content-Type": "application/json",
      },
      ...(options || {}),
    },
  );
}