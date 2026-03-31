/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export type AuthUser = {
  name: string;
  email: string;
  loginAt: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  signup: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getDisplayNameFromEmail = (email: string) => {
  const localPart = email.split("@")[0] || "User";
  const words = localPart
    .replace(/[._-]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) {
    return "User";
  }

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const toAuthUser = (firebaseUser: User): AuthUser => ({
    name: firebaseUser.displayName || getDisplayNameFromEmail(firebaseUser.email || ""),
    email: firebaseUser.email || "",
    loginAt: Date.now(),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.email) {
        setUser(toAuthUser(firebaseUser));
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      throw new Error("Email and password are required.");
    }

    const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    if (credential.user.email) {
      setUser(toAuthUser(credential.user));
    }
  }, []);

  const signup = useCallback(async ({ name, email, password }: { name: string; email: string; password: string }) => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName) {
      throw new Error("Name is required.");
    }
    if (!normalizedEmail || !password.trim()) {
      throw new Error("Email and password are required.");
    }

    const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    await updateProfile(credential.user, { displayName: normalizedName });

    if (credential.user.email) {
      setUser({
        name: normalizedName,
        email: credential.user.email,
        loginAt: Date.now(),
      });
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAuthLoading,
      login,
      signup,
      logout,
    }),
    [isAuthLoading, login, logout, signup, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
