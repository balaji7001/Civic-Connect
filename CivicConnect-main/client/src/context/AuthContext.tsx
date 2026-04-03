import { createContext, useEffect, useState, type PropsWithChildren } from "react";

import api, { type AuthResponse, type User } from "../services/api";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  ward: string;
  address: string;
}chkkcdsgm 
Lminkm
Mkijhx

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const persistSession = (session: AuthResponse) => {
  localStorage.setItem("civic-connect-token", session.token);
  localStorage.setItem("civic-connect-user", JSON.stringify(session.user));
};

const clearSession = () => {
  localStorage.removeItem("civic-connect-token");
  localStorage.removeItem("civic-connect-user");
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("civic-connect-user");
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("civic-connect-token"));
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(localStorage.getItem("civic-connect-token")));

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<{ data: User }>("/auth/me");
        setUser(response.data.data);
      } catch {
        clearSession();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await api.post<{ data: AuthResponse }>("/auth/login", { email, password });
    const session = response.data.data;
    persistSession(session);
    setToken(session.token);
    setUser(session.user);
  };

  const register = async (payload: RegisterPayload) => {
    const response = await api.post<{ data: AuthResponse }>("/auth/register", payload);
    const session = response.data.data;
    persistSession(session);
    setToken(session.token);
    setUser(session.user);
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
