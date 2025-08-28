import { request } from "../service";
import type { DACN } from "./typings";

export async function authLogin(
  body: DACN.LoginRequestDto,
  options?: { [key: string]: any }
) {
  return request<DACN.TokenResponseDto>("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}
