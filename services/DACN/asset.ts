import { request } from "../service";
import { DACN } from "./typings";
const AssetTypes = {
  public: "PUBLIC",
  private: "PRIVATE",
};
const AssetConditions = {
  new: "NEW",
  used: "USED",
  broken: "BROKEN",
  under_maitenance: "UNDER_MAINTENANCE",
  retired: "RETIRED",
};

export type GetAssetsParams = {
  page?: number;
  pageSize?: number;
  type?: (typeof AssetTypes)[keyof typeof AssetTypes];
  condition?: (typeof AssetConditions)[keyof typeof AssetConditions];
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