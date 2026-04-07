import { request } from "../service";
import type { DACN } from "./typings";

export type ReportParams = {
  employee_id?: string;
  status?: "DRAFT" | "SUBMITTED" | "REVIEWED";
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
  sort_by?: "week_starting" | "created_at" | "updated_at" | "status";
  sort_order?: "ASC" | "DESC";
};

export function getListReports(
  params?: ReportParams,
  options?: { [key: string]: any },
) {
  return request<DACN.ReportResponseDto[]>("/management/reports", {
    method: "GET",
    params,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function getMyReport(params?: ReportParams, options?: { [key: string]: any }) {
  return request<DACN.ReportResponseDto[]>("/management/reports/me", {
    method: "GET",
    params,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function createReport(
  data: DACN.CreateReportRequestDto,
  options?: { [key: string]: any },
) {
  return request<DACN.ReportResponseDto>(`/management/reports`, {
    method: "POST",
    data,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}
