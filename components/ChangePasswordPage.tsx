"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { changePassword } from "@/services/DACN/auth";
import { getEmployeeProfile } from "@/services/DACN/employee";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_ENDPOINT || "").replace(/\/+$/, "");
}

async function verifyOldPassword(email: string, password: string) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new Error("Missing NEXT_PUBLIC_API_ENDPOINT");

  const res = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (res.ok) return;

  // Keep the message stable/user-friendly; backend messages vary.
  throw new Error("Old password is incorrect.");
}

type ChangePasswordPageProps = {
  embedded?: boolean;
};

export default function ChangePasswordPage({ embedded = false }: ChangePasswordPageProps) {
  const router = useRouter();

  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [logoutOtherDevices, setLogoutOtherDevices] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEmail() {
      setLoadingProfile(true);
      try {
        const res = await getEmployeeProfile();
        if (cancelled) return;
        if (res?.statusCode === 200 && res.data?.email) {
          setProfileEmail(res.data.email);
        } else {
          setProfileEmail(null);
          setError("Unable to load profile. Please log in again.");
        }
      } catch {
        if (!cancelled) {
          setProfileEmail(null);
          setError("Unable to load profile. Please log in again.");
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    loadEmail();

    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const oldPw = oldPassword;
    const newPw = newPassword;
    const confirmPw = confirmNewPassword;

    if (!oldPw.trim() || !newPw.trim() || !confirmPw.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPw !== confirmPw) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (!profileEmail) {
      setError("Unable to determine your account email. Please log in again.");
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: verify old password is correct.
      await verifyOldPassword(profileEmail, oldPw);

      // Step 2: call change-password endpoint.
      await changePassword({ newPassword: newPw });

      // Success: log out and force re-login.
      try {
        await fetch("/api/logout", { method: "POST" });
      } catch {
        // ignore
      }

      try {
        localStorage.removeItem("token");
      } catch {
        // ignore
      }

      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccess("Password changed successfully. Redirecting to login...");
      router.replace("/login");
    } catch (err) {
      const message =
        (err as any)?.response?.data?.message ||
        (err as any)?.message ||
        "Change password failed.";
      setError(Array.isArray(message) ? message.join(", ") : String(message));
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Enter your current password to confirm, then set a new password.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Unable to change password</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Old Password</Label>
            <Input
              id="oldPassword"
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={submitting || loadingProfile}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={submitting || loadingProfile}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              disabled={submitting || loadingProfile}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={submitting || loadingProfile}>
              {submitting ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  if (embedded) return content;

  return (
    <div className="p-6">
      <div className="max-w-xl">{content}</div>
    </div>
  );
}
