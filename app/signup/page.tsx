// Assistant Signup Page — public registration for new assistant accounts.
// Creates a new user with ASSISTANT role and redirects to login on success.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { UserRole } from "@/lib/global";
import { useData } from "@/context/DataContext";
import { PasswordField } from "@/components/shared/passwordField";

export default function SignupPage() {
  const router = useRouter();
  const { addUser } = useData();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const newErrors: {
      username?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!username.trim()) {
      newErrors.username = "Username is required.";
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      newErrors.username = "Username can only contain letters, numbers, and underscores.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    await new Promise((resolve) => setTimeout(resolve, 300));

    const success_ = addUser({
      username: username.trim(),
      password,
      role: UserRole.ASSISTANT,
    });

    setSaving(false);

    if (success_) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setSubmitError("Username is already taken. Please choose another.");
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert className="border-success bg-success-surface text-success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Account created successfully! Redirecting to login...
              </AlertDescription>
            </Alert>
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
            Create Assistant Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. dental_assistant"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }}
                aria-invalid={!!errors.username}
                disabled={saving}
                maxLength={30}
              />
              {errors.username && (
                <p className="text-caption text-destructive">{errors.username}</p>
              )}
            </div>

            <PasswordField
              label="Password"
              htmlFor="password"
              value={password}
              onChange={(val) => {
                setPassword(val);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Min. 6 characters"
              required
              disabled={saving}
              error={errors.password}
            />

            <PasswordField
              label="Confirm Password"
              htmlFor="confirmPassword"
              value={confirmPassword}
              onChange={(val) => {
                setConfirmPassword(val);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Re-enter password"
              required
              disabled={saving}
              error={errors.confirmPassword}
            />

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Creating account..." : "Sign Up"}
            </Button>

            <div className="text-body-sm text-text-secondary text-center">
              <Link href="/login" className="text-primary hover:underline">
                Already have an account? Log in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
