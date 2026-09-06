"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { PasswordField } from "@/components/shared/passwordField";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isAdmin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Redirect when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      router.push(isAdmin ? "/admin" : "/assistant");
    }
  }, [isAuthenticated, isAdmin, router]);

  // Stable ref for caps lock handler to avoid re-registering listener
  const handleCapsLock = useCallback((e: KeyboardEvent) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleCapsLock);
    return () => document.removeEventListener("keydown", handleCapsLock);
  }, [handleCapsLock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const success = await login(email, password);

    if (!success) {
      setErrorMessage("Invalid email or password");
      setIsLoading(false);
      return;
    }

    // Success: isLoading stays true while onAuthStateChange fires and useEffect handles redirect
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-h2 font-heading text-center">
            DC-FMS Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {capsLockOn && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Caps Lock is on</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                maxLength={50}
              />
            </div>

            <PasswordField
              label="Password"
              htmlFor="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter password"
              disabled={isLoading}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-body-sm text-text-secondary text-center">
              <Link href="/signup" className="text-primary hover:underline">
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
