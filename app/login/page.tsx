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
import { Eye, EyeOff } from "lucide-react";
import {
  signInWithCredentials,
  getUserProfile,
} from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-1">
          <AuthLogo />
          <h1
            className="text-xl font-semibold"
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

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
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

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Password
            </label>
            <div className="auth-glass-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-glass-input"
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
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
          variant="outline"
          disabled={isLoading}
          className="w-full h-10"
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
