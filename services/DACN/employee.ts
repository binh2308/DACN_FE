import { request } from "../service";

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
  department?: DepartmentDto | null;
  avatarUrl?: string | null;
};

export type GetEmployeesResponse = {
  statusCode: number;
  message?: string;
  data: {
    items: EmployeeDto[];
    total: number;
    page: number;
    pageSize: number;
  };
};

// Lấy danh sách tất cả nhân viên
export async function getEmployees(options?: { [key: string]: any }) {
  return request<GetEmployeesResponse>("/employee/all", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

// Lấy chi tiết 1 nhân viên
export async function getEmployeeDetail(id: string, options?: { [key: string]: any }) {
  return request<any>(`/employee/${id}`, {
    method: "GET",
    ...(options || {}),
  });
}

// Tạo nhân viên mới
export async function createEmployee(body: any, options?: { [key: string]: any }) {
  return request<any>("/employee/create", {
    method: "POST",
    data: body,
    ...(options || {}),
  });
}

// Cập nhật thông tin nhân viên
export async function updateEmployee(id: string, body: any, options?: { [key: string]: any }) {
  return request<any>(`/employee/${id}`, {
    method: "PUT",
    data: body,
    ...(options || {}),
  });
}

// Xóa nhân viên
export async function deleteEmployee(id: string, options?: { [key: string]: any }) {
  return request<any>(`/employee/${id}`, {
    method: "DELETE",
    ...(options || {}),
  });
}