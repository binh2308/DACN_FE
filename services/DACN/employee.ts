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

export type DegreeDto = {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy?: string | null;
  graduationYear?: number | null;
  description?: string | null;
};

export type EmployeeDetailDto = EmployeeDto & {
  degrees?: DegreeDto[];
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
export async function getEmployeeDetail(id: string, options?: { [key: string]: any }) {
  return request<GetEmployeeDetailResponse>(`/employee/${id}`, {
    method: "GET",
    ...(options || {}),
  });
}

// Admin/HR use-case: lấy tất cả nhân viên (backend có thể trả paged hoặc array)
export async function getAllEmployees(options?: { [key: string]: any }) {
  return request<GetEmployeesResponse>("/employee/all", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
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