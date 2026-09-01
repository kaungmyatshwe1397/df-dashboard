"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

type LoginState = "idle" | "error" | "success";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isAdmin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginState>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(isAdmin ? "/admin" : "/assistant");
    }
  }, [isAuthenticated, isAdmin, router]);

  const handleKeyPress = (e: KeyboardEvent) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Empty state validation
    if (!username.trim() || !password.trim()) {
      setState("error");
      setErrorMessage("Please enter both username and password");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const success = login(username, password);

    if (success) {
      setState("success");
      // Redirect based on role
      setTimeout(() => {
        router.push(isAdmin ? "/admin" : "/assistant");
      }, 500);
    } else {
      setState("error");
      setErrorMessage("Invalid username or password");
    }

    setIsLoading(false);
  };

  // Loading state
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
            {/* Error Alert */}
            {state === "error" && errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Caps Lock Warning */}
            {capsLockOn && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Caps Lock is on</AlertDescription>
              </Alert>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                maxLength={50}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                maxLength={50}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            {/* Demo Credentials */}
            <div className="text-body-sm text-text-secondary text-center">
              <p>Demo: admin/admin123 or assistant/assist123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
