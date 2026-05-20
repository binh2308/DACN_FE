import { request } from "../service";
import { DACN } from "./typings";

export type AssetType = "PUBLIC" | "PRIVATE";

export function typeMeta(type: AssetType) {
  switch (type) {
    case "PRIVATE":
      return { label: "Cá nhân", badge: "bg-indigo-100 text-indigo-700" };
    case "PUBLIC":
      return { label: "Công cộng", badge: "bg-blue-100 text-blue-700" };
    default:
      return { label: type, badge: "bg-gray-100 text-gray-700" };
  }
}

export function conditionMeta(condition: AssetStatus) {
  switch (condition) {
    case "NEW":
      return { label: "Mới", badge: "bg-green-100 text-green-700" };
    case "USED":
      return { label: "Đã sử dụng", badge: "bg-yellow-100 text-yellow-700" };
    case "UNDER_MAINTENANCE":
      return {
        label: "Bảo trì",
        badge: "bg-orange-100 text-orange-700",
      };
    case "BROKEN":
      return { label: "Hỏng", badge: "bg-red-100 text-red-700" };
    default:
      return { label: condition, badge: "bg-gray-100 text-gray-700" };
  }
}

export const getDepartmentLabel = (departmentName: string) => {
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

export type AssetStatus =
  | "NEW"
  | "USED"
  | "BROKEN"
  | "UNDER_MAINTENANCE"
  | "RETIRED";
export type AssetCategory = "Laptop / Máy tính" | "Màn hình" | "Thiết bị VP";

export type Asset = {
  id?: string;
  name: string;
  assetTag: string;
  serialNumber: string;
  type: AssetType;
  condition: AssetStatus;
  location?: string;
  owner?: any;
  purchase_date: string;
  warranty_expiration_date?: string;
  maintenance_schedule: string;
};

export type GetAssetsParams = {
  page?: number;
  pageSize?: number;
  type?: AssetType;
  condition?: AssetStatus;
  ownerEmployeeId?: string;
  location?: string;
  keyword?: string;
};

export async function getAssets(
  params?: GetAssetsParams,
  options?: { [key: string]: any },
) {
  return request<any>("/assets", {
    method: "GET",
    params,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export async function createAsset(
  data: DACN.CreateAssetDto,
  options?: { [key: string]: any },
) {
  return request<any>("/assets", {
    method: "POST",
    data,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function updateAsset(
  id: string,
  data: DACN.UpdateAssetDto,
  options?: { [key: string]: any },
) {
  return request<any>(`/assets/${id}`, {
    method: "PATCH",
    data,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function deleteAsset(id: string, options?: { [key: string]: any }) {
  return request<any>(`/assets/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function assignAsset(
  id: string,
  data: DACN.AssignAssetDto,
  options?: { [key: string]: any },
) {
  return request<any>(`/assets/${id}/assign`, {
    method: "POST",
    data,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}

export function unassignAsset(
  id: string,
  data: { returnDate: string },
  options?: { [key: string]: any },
) {
  return request<any>(`/assets/${id}/return`, {
    method: "POST",
    data,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}
