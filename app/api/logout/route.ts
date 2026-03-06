// app/api/logout/route.ts
import { cookies } from "next/headers"

export async function POST() {
  (await cookies()).delete("access_token");
  return Response.json({ ok: true });
}