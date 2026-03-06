"use client";

import { useState } from "react";
import Link from "next/link";
//import { useRequest } from "ahooks";

import { Checkbox, Button, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import { LoginInput } from "@/components/LoginInput";

export default function Login() {
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [warning, setWarning] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);
  const route = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!email.trim() || !password.trim()) {
      setWarning("Invalid email or password!");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setWarning("Invalid email or password!");
        setLoading(false);
        return;
      }

      const json = await res.json();
      localStorage.setItem("token", json.accessToken);
      setLoading(false);
      route.push(json.redirectTo ?? "/");
    } catch (err) {
      setWarning("Invalid email or password!");
      setLoading(false);
    }
  };
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <div className="hidden lg:flex lg:w-2/5 relative bg-[rgba(12,175,96,0.1)] flex-shrink-0">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/9e676a3ffa77d53169dfd8011369a666481b800c?width=1440"
          alt="Team collaboration"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-end justify-center p-4">
          <div className="bg-[rgba(33,37,43,0.5)] rounded-lg px-3 py-4 max-w-sm backdrop-blur-sm">
            <p className="text-[#E9EAEC] text-center text-xs font-semibold leading-[140%] tracking-[0.16px]">
              "Welcome to Human Resource management system."
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-3/5 flex items-center justify-center px-4 py-4 bg-white lg:bg-[rgba(255,255,255,0.1)] overflow-y-auto">
        <div className="w-full max-w-[380px]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-black text-2xl font-semibold">Login</h1>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 w-full"
              >
                <div className="flex flex-col gap-1.5">
                  <LoginInput
                    label="Email Address"
                    value={email}
                    setValue={setEmail}
                    type="email"
                    placeholder="Input your registered email"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <LoginInput
                    label="Password"
                    value={password}
                    setValue={setPassword}
                    type="password"
                    placeholder="Password"
                  />
                </div>
                {warning !== null && (
                  <Text size="xs" c="red">
                    {warning}
                  </Text>
                )}

                <div className="flex items-center justify-between gap-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer group">
                    <Checkbox
                      label="Remember me"
                      color="green"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-[#657081] font-medium leading-[150%] tracking-[0.07px] hover:text-primary transition-colors"
                  >
                    Forgot Password
                  </Link>
                </div>
                <Button
                  variant="filled"
                  color="green"
                  onClick={handleSubmit}
                  loading={loading}
                >
                  Login
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-4 lg:hidden">
            <div className="bg-[rgba(33,37,43,0.5)] rounded-lg px-4 py-4 backdrop-blur-sm">
              <p className="text-[#E9EAEC] text-center text-xs font-semibold leading-[140%] tracking-[0.16px]">
                "Welcome to Human Resource management system."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
