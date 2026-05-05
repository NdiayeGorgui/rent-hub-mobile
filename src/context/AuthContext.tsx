import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "@/src/api/authService";
import * as SecureStore from "expo-secure-store";

interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedToken = await SecureStore.getItemAsync("token");

      if (!savedToken) {
        setLoading(false);
        return;
      }

      setToken(savedToken);

      const currentUser = await getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.log("Auth load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string) => {
    await SecureStore.setItemAsync("token", newToken);

    setToken(newToken);

    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("token");
    } catch (e) {
      console.error("Erreur logout:", e);
    }

    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};