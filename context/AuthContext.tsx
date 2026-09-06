// AuthContext — Supabase Auth integration.
// Replaces mock login with Supabase Auth (email/password).
// Listens to auth state changes for session persistence.

"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/lib/global";
interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAssistant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabaseRef.current
            .from("profiles")
            .select("username, role")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setUser({
              id: session.user.id,
              username: profile.username,
              role: profile.role as UserRole,
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check existing session on mount
    supabaseRef.current.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabaseRef.current
          .from("profiles")
          .select("username, role")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setUser({
                id: session!.user.id,
                username: profile.username,
                role: profile.role as UserRole,
              });
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabaseRef.current.auth.signInWithPassword({
      email,
      password,
    });

    return !error;
  };

  const logout = async () => {
    await supabaseRef.current.auth.signOut();
    setUser(null);
  };

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isAssistant = user?.role === UserRole.ASSISTANT;

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated, isAdmin, isAssistant }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
