import { request } from "../service";

// Lấy danh sách tất cả nhân viên
export async function getEmployees(options?: { [key: string]: any }) {
  return request<any>("/employee/all", {
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