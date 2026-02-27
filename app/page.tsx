//import type React from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
//import { CustomLoader } from "@/components/CustomLoader";

export default function RootLayout() {
  const token = cookies().get("access_token")?.value;
  if (!token) {
    return redirect("/login");
  }
  const payload = decodeJwt(token) as any;
  const roles = payload?.roles;
  // const router = useRouter();
  // const token =
  //   typeof window !== "undefined" ? localStorage.getItem("token") : null;
  //   if (!token) {
  //     router.push("/login");
  //     return;
  //   }
  //   const payload = token?.split(".")[1];
  //   const parsed = JSON.parse(decodeBase64Url(payload as string));
  //   const role = parsed?.roles;
  //   if (role === "USER") {
  //     router.push("/user");
  //     return;
  //   } else if (role === "ADMIN") {
  //     router.push("/admin");
  //     return;
  //   } else {
  //     router.push("/manager");
  //     return;
  //   }
  if (roles === "USER") {
    redirect("/user");
  } else if (roles === "ADMIN") {
    redirect("/admin");
  } else if (roles === "MANAGER") {
    redirect("/manager");
  } else return redirect("/login");
}
