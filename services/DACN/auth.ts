import { request } from "../service";
import type { DACN } from "./typings";

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
