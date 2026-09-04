"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { UserRole } from "@/lib/global";
import { AuthUser } from "@/lib/mock-data";
import { useData } from "@/context/DataContext";

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAssistant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const { users } = useData();

  const login = (username: string, password: string): boolean => {
    const found = users.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.password_hash === password
    );
    if (found) {
      setUser({
        id: found.id,
        username: found.username,
        role: found.role,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isAssistant = user?.role === UserRole.ASSISTANT;

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
