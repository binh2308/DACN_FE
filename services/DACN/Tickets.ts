import { request } from "../service";

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
	return request<GetManagementTicketsResponse>("/management/tickets", {
		method: "GET",
		params,
		...(options || {}),
	});
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

