import { request } from "../service";
import type { DACN } from "./typings";

export type ManagementTicketStatus =
	| "OPEN"
	| "IN_PROGRESS"
	| "RESOLVED"
	| "DEFERRED";

export type TicketSortBy = "created_at" | "updated_at";
export type TicketSortOrder = "ASC" | "DESC";

export type TicketActorDto = {
	id: string;
	// Some endpoints return a flattened `name`, others return structured name fields.
	name?: string;
	firstName?: string;
	middleName?: string | null;
	lastName?: string;
	email?: string;
	avatarUrl?: string | null;
	roles?: string;
};

export type TicketCategoryDto = {
	id: string;
	name: string;
};

export type TicketCategoryDepartmentDto = {
	id: string;
	name: string;
};

export type ManagementTicketCategoryDto = {
	id: string;
	name: string;
	description?: string | null;
	is_active?: boolean;
	departments: TicketCategoryDepartmentDto[];
};

export type TicketProcessDto = {
	id: string;
	actor?: TicketActorDto | null;
	assignee?: TicketActorDto | null;
	type: string;
	from_status?: ManagementTicketStatus | null;
	to_status?: ManagementTicketStatus | null;
	// Newer backend shape: a single status field on the process entry.
	status?: ManagementTicketStatus | null;
	note?: string | null;
	created_at: string;
};

export type ManagementTicketDto = {
	id: string;
	employee?: TicketActorDto | null;
	assignee?: TicketActorDto | null;
	category?: TicketCategoryDto | null;
	title: string;
	description?: string | null;
	status: ManagementTicketStatus;
	created_at: string;
	updated_at?: string | null;
	processes?: TicketProcessDto[];
};

export type AssignManagementTicketBody = {
	assignee_id: string;
	note?: string;
};

export type UpdateManagementTicketStatusBody = {
	status: ManagementTicketStatus;
	note?: string;
};

export type AssignManagementTicketResponse = {
	statusCode?: number;
	message?: string;
	data?: unknown;
};

export type GetManagementTicketProcessesResponse = {
	statusCode: number;
	message?: string;
	data: {
		processes: TicketProcessDto[];
		total_activities: number;
	};
};

export type GetManagementTicketsQuery = {
	status?: ManagementTicketStatus;
	category_id?: string;
	employee_id?: string;
	assignee_id?: string;
	keyword?: string;
	from_date?: string;
	to_date?: string;
	page?: number;
	limit?: number;
	sort_by?: TicketSortBy;
	sort_order?: TicketSortOrder;
};

export type GetManagementTicketsResponse = {
	items: ManagementTicketDto[];
	total: number;
	page: number;
	limit: number;
	total_pages: number;
};

export async function getManagementTickets(
	params: GetManagementTicketsQuery,
	options?: { [key: string]: any },
) {
	return request<GetManagementTicketsResponse, GetManagementTicketsResponse>(
		"/management/tickets",
		{
		method: "GET",
		params,
		...(options || {}),
		},
	);
}

export async function getManagementTicketById(
	id: string,
	options?: { [key: string]: any },
) {
	return request<ManagementTicketDto>(`/management/tickets/${id}`, {
		method: "GET",
		...(options || {}),
	});
}

export async function assignManagementTicket(
	id: string,
	body: AssignManagementTicketBody,
	options?: { [key: string]: any },
) {
	return request<AssignManagementTicketResponse>(
		`/management/tickets/${id}/assign`,
		{
			method: "PATCH",
			data: body,
			...(options || {}),
		},
	);
}

export async function updateManagementTicketStatus(
	id: string,
	body: UpdateManagementTicketStatusBody,
	options?: { [key: string]: any },
) {
	const attempts: Array<{ url: string; method: "PATCH" | "PUT" }> = [
		{ url: `/management/tickets/${id}/status`, method: "PATCH" },
		{ url: `/management/tickets/${id}`, method: "PATCH" },
		{ url: `/management/tickets/${id}/status`, method: "PUT" },
		{ url: `/management/tickets/${id}`, method: "PUT" },
	];

	let lastError: any;
	for (const a of attempts) {
		try {
			return await request<AssignManagementTicketResponse>(a.url, {
				method: a.method,
				data: body,
				...(options || {}),
			});
		} catch (e: any) {
			lastError = e;
			const status = e?.response?.status;
			// Only retry for "route/method not found"-style failures.
			// If backend returns a business 404 (e.g. employee not found), do NOT fallback.
			if (status === 404 || status === 405) {
				const msg = e?.response?.data?.message;
				const msgText = Array.isArray(msg) ? msg.join(" ") : String(msg ?? "");
				const looksLikeMissingRoute =
					/\bCannot\b/i.test(msgText) ||
					/^Not Found$/i.test(msgText) ||
					/\broute\b/i.test(msgText);
				if (looksLikeMissingRoute) continue;
			}
			throw e;
		}
	}

	throw lastError;
}

export async function getManagementTicketProcesses(
	id: string,
	options?: { [key: string]: any },
) {
	return request<GetManagementTicketProcessesResponse>(
		`/management/tickets/${id}/processes`,
		{
			method: "GET",
			...(options || {}),
		},
	);
}

export type GetManagementTicketCategoriesAllResponse = {
	statusCode: number;
	message?: string;
	data: ManagementTicketCategoryDto[];
};

export async function getManagementTicketCategoriesAll(
	options?: { [key: string]: any },
) {
	return request<GetManagementTicketCategoriesAllResponse>(
		"/management/tickets/categories/all",
		{
			method: "GET",
			...(options || {}),
		},
	);
}

// ---------------------------------------------------------------------------
// Legacy exports (previously in services/DACN/ticket.ts)
// Keep these to avoid breaking existing call sites.
// ---------------------------------------------------------------------------

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
	return request<DACN.TicketResponseDto[]>(
		"/management/tickets/assigned/me",
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

