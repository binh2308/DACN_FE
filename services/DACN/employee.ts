import { request } from "../service";

export type DepartmentType =
  | "All"
  | "HR"
  | "Engineering"
  | "Sales"
  | "Marketing"
  | "Finance"
  | "Operations"
  | "IT"
  | "Customer Support";

export type DepartmentDto = {
  id: string;
  name: string;
};

export type EmployeeDto = {
  id: string;
  lastName: string;
  firstName: string;
  middleName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  email: string;
  roles: string;
  phone?: string | null;
  basicSalary?: number | null;
  grossSalary?: number | null;
  signDate?: string | null;
  quitDate?: string | null;
  idCard?: string | null;
  address?: string | null;
  marriedStatus?: boolean | null;
  numberOfChildren?: number | null;
  childrenDescription?: string | null;
  degrees?: string;
  avatarUrl?: string | null;
};

export type GetEmployeesParams = {
  page?: number;
  pageSize?: number;
  role?: string;
  department?: DepartmentType;
  search?: string;
};

export type DegreeDto = {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy?: string | null;
  graduationYear?: number | null;
  description?: string | null;
};

// Payload used for create/update requests. Backend examples don't include `id`.
export type DegreePayload = {
  school: string;
  degree: string;
  fieldOfStudy?: string | null;
  graduationYear?: number | null;
  description?: string | null;
};

export type EmployeeDetailDto = EmployeeDto & {
  degrees?: DegreeDto[];
};

export type CreateEmployeePayload = {
  id?: string;
  password?: string;
  lastName: string;
  firstName: string;
  middleName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  email: string;
  roles: string;
  phone?: string | null;
  basicSalary?: number | null;
  grossSalary?: number | null;
  signDate?: string | null;
  quitDate?: string | null;
  idCard?: string | null;
  address?: string | null;
  // Backend update/create examples use departmentName rather than a nested department object
  departmentName?: string | null;
  marriedStatus?: boolean | null;
  numberOfChildren?: number | null;
  childrenDescription?: string | null;
  degrees?: DegreePayload[];
  avatarUrl?: string | null;
};

export type CreateEmployeeResponse = {
  statusCode: number;
  message?: string;
  data: EmployeeDetailDto;
};

export type GetEmployeesResponse = {
  statusCode: number;
  message?: string;
  // Some endpoints return paged shape { items, total, page, pageSize }
  // while others (e.g. /employee/department) return EmployeeDto[] directly.
  data:
    | {
        items: EmployeeDto[];
        total?: number;
        page?: number;
        pageSize?: number;
      }
    | EmployeeDto[];
};

export type GetEmployeeDetailResponse = {
  statusCode: number;
  message?: string;
  data: EmployeeDetailDto;
};

export type GetEmployeeProfileResponse = {
  statusCode: number;
  message?: string;
  data: EmployeeDetailDto;
};

export type UpdateEmployeeByAdminPayload = Partial<
  Omit<CreateEmployeePayload, "id" | "password">
>;

export type UpdateEmployeeByAdminResponse = {
  statusCode: number;
  message?: string;
  data: EmployeeDetailDto;
};

export type UpdateEmployeePayload = {
  lastName: string;
  firstName: string;
  middleName?: string | null;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  idCard?: string | null;
  address?: string | null;
  marriedStatus?: boolean | null;
  numberOfChildren?: number | null;
  childrenDescription?: string | null;
  degrees?: DegreePayload[];
};

export type UpdateEmployeeResponse = {
  statusCode?: number;
  message?: string;
  data?: EmployeeDetailDto;
};

export function getFullName(employee: any) {
  return `${employee.firstName} ${employee.middleName ? employee.middleName + " " : ""}${employee.lastName}`;
}

// Lấy danh sách nhân viên cùng phòng ban với user hiện tại
export async function getEmployees(options?: { [key: string]: any }) {
  return request<GetEmployeesResponse>("/employee/department", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

// Lấy chi tiết 1 nhân viên
export async function getEmployeeDetail(
  id: string,
  options?: { [key: string]: any },
) {
  return request<GetEmployeeDetailResponse>(`/employee/${id}`, {
    method: "GET",
    ...(options || {}),
  });
}

// Admin/HR use-case: lấy tất cả nhân viên (backend có thể trả paged hoặc array)
export async function getAllEmployees(
  params?: GetEmployeesParams,
  options?: { [key: string]: any },
) {
  return request<GetEmployeesResponse>("/employee/all", {
    method: "GET",
    params,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

// Lấy profile nhân viên hiện tại (theo token)
export async function getEmployeeProfile(options?: { [key: string]: any }) {
  return request<GetEmployeeProfileResponse, GetEmployeeProfileResponse>(
    "/employee/profile",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      ...(options || {}),
    },
  );
}

// Tạo nhân viên mới
export async function createEmployee(
  body: CreateEmployeePayload,
  options?: { [key: string]: any },
) {
  return request<CreateEmployeeResponse>("/employee/by-admin", {
    method: "POST",
    data: body,
    ...(options || {}),
  });
}

// Manager/Admin use-case: cập nhật nhân viên theo quyền admin
export async function updateEmployeeByAdmin(
  id: string,
  body: UpdateEmployeeByAdminPayload,
  options?: { [key: string]: any },
) {
  return request<UpdateEmployeeByAdminResponse>(`/employee/by-admin/${id}`, {
    method: "PATCH",
    data: body,
    ...(options || {}),
  });
}

// Employee self-service: cập nhật thông tin cá nhân (theo token)
export async function updateEmployee(
	body: UpdateEmployeePayload,
	options?: { [key: string]: any },
) {
	return request<UpdateEmployeeResponse>("/employee/update", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		data: body,
		...(options || {}),
	});
}

// Xóa nhân viên
export async function deleteEmployee(
  id: string,
  options?: { [key: string]: any },
) {
  return request<any>(`/employee/${id}`, {
    method: "DELETE",
    ...(options || {}),
  });
}
