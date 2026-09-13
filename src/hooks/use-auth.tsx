import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSession, signInApi, signOutApi, signUpApi, type ApiUser } from "@/lib/site-api";

type AppSession = { user: ApiUser };

interface AuthCtx {
  user: ApiUser | null;
  session: AppSession | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getSession()
      .then(({ user: nextUser }) => { if (active) setUser(nextUser); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { user: nextUser } = await signInApi(email, password);
      setUser(nextUser);
      return { error: null };
    } catch (error: any) {
      return { error: error?.message ?? "No se pudo iniciar sesión" };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { user: nextUser } = await signUpApi(email, password);
      setUser(nextUser);
      return { error: null };
    } catch (error: any) {
      return { error: error?.message ?? "No se pudo crear la cuenta" };
    }
  };

  const signOut = async () => {
    try { await signOutApi(); }
    finally { setUser(null); }
  };

  const session = user ? { user } : null;
  const isAdmin = user?.role === "admin";

  return <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
