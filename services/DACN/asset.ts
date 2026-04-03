import { request } from "../service";
import { DACN } from "./typings";

export type AssetType = "PUBLIC" | "PRIVATE";
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
  type: AssetType;
  category?: AssetCategory;
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

export function assignAsset(id: string, data: DACN.AssignAssetDto, options?: { [key: string]: any }) {
  return request<any>(`/assets/${id}/assign`, {
    method: "POST",
    data,
    headers: {
      "Content-Type": "application/json",
    },
    ...(options || {}),
  });
}