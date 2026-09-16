// Login page — glassmorphism card with email/password form.
// Wired to Supabase signInWithPassword. Redirects by role after auth.

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassAuthCard } from "@/components/auth/GlassAuthCard";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  signInWithCredentials,
  getUserProfile,
} from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: authError } = await signInWithCredentials({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    const profile = await getUserProfile();
    router.push(profile?.role === "ADMIN" ? "/admin" : "/assistant");
  }

  return (
    <GlassAuthCard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <AuthLogo />
          <h1
            className="mt-2 text-xl font-semibold"
            style={{ color: "#ecfdf5" }}
          >
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div
            className="rounded-[10px] px-4 py-3 text-sm"
            style={{
              background: "rgba(251,113,133,0.15)",
              border: "1px solid rgba(251,113,133,0.3)",
              color: "#FB7185",
            }}
          >
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-glass-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-glass-input"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/8 accent-[#7C6AF0]"
            />
            <span
              className="text-sm"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Remember me
            </span>
          </label>
          {/* TODO: Wire to password recovery flow when implemented */}
          <Link href="/forgot-password" className="auth-link">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full rounded-[10px] text-sm font-semibold"
          style={{
            background: "rgba(124,106,240,0.85)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          {isLoading ? <Spinner className="size-4" /> : "Log In"}
        </Button>

        <p
          className="text-center text-sm"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="auth-link font-medium">
            Register
          </Link>
        </p>
      </form>
    </GlassAuthCard>
  );
}
