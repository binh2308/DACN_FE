"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { div } from "framer-motion/client";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const token = localStorage.getItem("token");
  if (token === undefined || token === null) router.push("/homepage");
  else return <div>Welcome to Homepage</div>;
}
