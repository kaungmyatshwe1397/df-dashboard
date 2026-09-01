"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { UserRole } from "@/lib/global";
import { AuthUser, authenticateUser } from "@/lib/mock-data";

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

  const login = (username: string, password: string): boolean => {
    const authUser = authenticateUser(username, password);
    if (authUser) {
      setUser(authUser);
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
