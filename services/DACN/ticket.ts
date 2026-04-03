import { request } from "../service";
import type { DACN } from "./typings";

export type TicketParams = {
  page?: number;
  limit?: number;
  status?: "OPEN" | "IN_PROGRESS" | "CLOSED";
  category_id?: string;
  employee_id?: string;
  assignee_id?: string;
  keyword?: string;
  from_date?: string;
  to_date?: string;
  sort_by?: "created_at" | "updated_at";
  sort_order?: "ASC" | "DESC";
};

export type TicketCategoryResponseDto = {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  departments?: any;
};

export async function getMyTickets(
  params?: TicketParams,
  options?: { [key: string]: any },
) {
  return request<DACN.TicketResponseDto[]>("/management/tickets/me", {
    method: "GET",
    params,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export async function getMyAssignedTickets(
  params?: TicketParams,
  options?: { [key: string]: any },
) {
  return request<DACN.TicketResponseDto[]>("/management/tickets/assigned/me", {
    method: "GET",
    params,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export async function getTicketById(
  id: string,
  options?: { [key: string]: any },
) {
  return request<DACN.TicketResponseDto>(`/management/tickets/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export async function addCommentToTicket(
  id: string,
  data: { note: string },
  options?: { [key: string]: any },
) {
  return request<DACN.TicketResponseDto>(
    `/management/tickets/${id}/processes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data,
      ...(options || {}),
    },
  );
}

export async function updateTicketStatus(
  id: string,
  data: { status: "OPEN" | "IN_PROGRESS" | "CLOSED"; note?: string },
  options?: { [key: string]: any },
) {
  return request<DACN.TicketResponseDto>(`/management/tickets/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    data,
    ...(options || {}),
  });
}

export async function createSupportTicket(
  data: {
    title: string;
    description: string;
    category_id: string;
  },
  options?: { [key: string]: any },
) {
  return request<DACN.TicketResponseDto>("/management/tickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data,
    ...(options || {}),
  });
}

export async function getTicketCategories(options?: { [key: string]: any }) {
  return request<TicketCategoryResponseDto[]>(
    "/management/tickets/categories/all",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      ...(options || {}),
    },
  );
}
