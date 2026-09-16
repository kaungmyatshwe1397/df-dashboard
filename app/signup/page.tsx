// Signup page — glassmorphism card with registration form.
// Wired to Supabase signUp with username metadata for profile trigger.

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GlassAuthCard } from "@/components/auth/GlassAuthCard";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signUpNewUser } from "@/lib/supabase/auth";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    const { error: authError } = await signUpNewUser({
      email,
      password,
      fullName,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  }

  if (success) {
    return (
      <GlassAuthCard>
        <div className="flex flex-col items-center gap-4 py-4">
          <AuthLogo />
          <h1
            className="text-xl font-semibold"
            style={{ color: "#ecfdf5" }}
          >
            Check your email
          </h1>
          <p
            className="text-center text-sm"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            We sent a confirmation link to{" "}
            <span className="font-medium" style={{ color: "#C9BEFF" }}>
              {email}
            </span>
            . Please verify your account.
          </p>
          <Link href="/login" className="auth-link mt-2 font-medium">
            Back to login
          </Link>
        </div>
      </GlassAuthCard>
    );
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
            Create account
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            Fill in your details to get started
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
              htmlFor="fullName"
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="John Doe"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="auth-glass-input"
            />
          </div>

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
              placeholder="Create a password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-glass-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-glass-input"
            />
          </div>
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
          {isLoading ? <Spinner className="size-4" /> : "Create Account"}
        </Button>

        <p
          className="text-center text-sm"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          Already have an account?{" "}
          <Link href="/login" className="auth-link font-medium">
            Log In
          </Link>
        </p>
      </form>
    </GlassAuthCard>
  );
}
