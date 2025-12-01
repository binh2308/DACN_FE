"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { useRequest } from "ahooks";
import { getUserProfile } from "@/services/DACN/auth";
import { useEffect, useState } from "react";
import { CustomLoader } from "@/components/CustomLoader";

export default function RootLayout() {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const { loading, runAsync } = useRequest(getUserProfile, {
    manual: true,
  });

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    runAsync()
      .then((data) => {
        if (data.data.roles === "ADMIN") {
          router.push("/admin");
          return;
        } else {
          router.push("/user");
          return;
        }
      })
      .catch((error) => console.log(error));
  }, [token, runAsync, router]);

  if (!token) return null;
  if (loading) return <CustomLoader />;

  return <CustomLoader />;
}
