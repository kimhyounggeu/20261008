"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { clientAuth } from "@/lib/firebase-client";

interface AuthState {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true, logout: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(clientAuth(), (u) => {
        setUser(u);
        setLoading(false);
      }),
    [],
  );

  return <AuthContext.Provider value={{ user, loading, logout: () => signOut(clientAuth()) }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
