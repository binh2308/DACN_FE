import { request } from "../service";
import type { DACN } from "./typings";
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
