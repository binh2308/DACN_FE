import { request } from "../service";
import type { DACN } from "./typings";

export type UploadAvatarResponse = {
  statusCode?: number;
  message?: string;
  data?:
    | {
      url?: string;
      avatarUrl?: string;
      path?: string;
      location?: string;
      [key: string]: unknown;
    }
    | string;
};

export async function authLogin(
  body: DACN.LoginRequestDto,
  options?: { [key: string]: any }
) {
  return request<any>("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

export async function getUserProfile(options?: { [key: string]: any }) {
  return request<any>("/employee/profile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },

    ...(options || {}),
  });
}

export type ChangePasswordRequest = {
  newPassword: string;
};

export type ChangePasswordResponse = {
  statusCode?: number;
  message?: string;
  data?: unknown;
};

export async function changePassword(
  body: ChangePasswordRequest,
  options?: { [key: string]: any },
) {
  return request<ChangePasswordResponse, ChangePasswordResponse>(
    "/auth/change-password",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    },
  );
}

// Upload avatar via backend (multipart/form-data)
export async function uploadAvatar(file: File, options?: { [key: string]: any }) {
  const form = new FormData();
  form.append("file", file);

  return request<UploadAvatarResponse>("/auth/avatar/upload", {
    method: "POST",
    data: form,
    headers: {
      // Let axios set proper boundary; this also overrides default JSON header.
      "Content-Type": "multipart/form-data",
    },
    ...(options || {}),
  });
}
