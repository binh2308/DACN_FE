
import { request } from "../service";

export type DepartmentDto = {
	id: string;
	name: string;
};

export type GetDepartmentsResponse = {
	statusCode: number;
	message?: string;
	data: DepartmentDto[];
};

export async function getDepartments(options?: { [key: string]: any }) {
	return request<GetDepartmentsResponse, GetDepartmentsResponse>("/department", {
		method: "GET",
		...(options || {}),
	});
}

export type CreateDepartmentBody = {
	name: string;
};

export type CreateDepartmentResponse =
	| DepartmentDto
	| {
			statusCode?: number;
			message?: string;
			data?: DepartmentDto;
	  };

export async function createDepartment(
	body: CreateDepartmentBody,
	options?: { [key: string]: any },
) {
	return request<CreateDepartmentResponse, CreateDepartmentResponse>(
		"/department/create",
		{
			method: "POST",
			data: body,
			...(options || {}),
		},
	);
}

export type DeleteDepartmentResponse =
	| {
			statusCode?: number;
			message?: string;
			data?: unknown;
	  }
	| unknown;

export async function deleteDepartment(
	id: string,
	options?: { [key: string]: any },
) {
	return request<DeleteDepartmentResponse, DeleteDepartmentResponse>(
		`/department/${id}`,
		{
			method: "DELETE",
			...(options || {}),
		},
	);
}

