import { request } from "../service";
import type { DepartmentType } from "./employee";

export const getDepartmentName = (departmentName: string) => {
  const departmentMap: any = {
    Accounting: "Kế toán",
    Administrator: "Quản trị",
    "Customer Support": "Chăm sóc khách hàng",
    Engineering: "Kỹ thuật",
    Finance: "Tài chính",
    Marketing: "Marketing",
    "Nhân sự (HR)": "Nhân sự",
    Operations: "Vận hành",
    Sales: "Kinh doanh",
  };

  return departmentMap[departmentName] || departmentName;
};

export function getDepartments(options?: { [key: string]: any }) {
  return request<any>("/department", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export type CreateDepartmentBody = {
  name: DepartmentType | string;
};

// POST /department/create
// Request body: { "name": "Sales" }
export function createDepartment(
  body: CreateDepartmentBody,
  options?: { [key: string]: any },
) {
  return request<any>("/department/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

// DELETE /department/{id}
export function deleteDepartment(id: string, options?: { [key: string]: any }) {
  return request<any>(`/department/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}
