import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { authLogin } from "@/services/DACN/auth"; // gọi backend thật

function pickHomeByRoles(roles: unknown) {
  //const arr = Array.isArray(roles) ? roles : [];
  if (roles === "ADMIN") return "/admin";
  if (roles === "MANAGER") return "/manager";
  return "/user"; // default
}

export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json();

    //const data = await authLogin({ email, password });
    const res = await fetch("http://16.176.153.209:3000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }); // Gọi backend thật để lấy accessToken và roles
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Login failed");
    }
    const data = await res.json();
    const accessToken = data.data.accessToken;

    // Set httpOnly cookie
    (
      await // Set httpOnly cookie
      cookies()
    ).set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    // Decode server-side để lấy roles (decode thôi; muốn chắc chắn thì verify ở backend hoặc jwtVerify)
    const payload = decodeJwt(accessToken) as any;
    const roles = payload?.roles ?? [];
    const redirectTo = pickHomeByRoles(roles);

    // Trả về roles/redirectTo cho client dùng điều hướng
    return NextResponse.json({ success: true, roles, redirectTo, accessToken });
  } catch (error: any) {
    console.error("API /api/login error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
