import React, { createContext, useContext, useEffect, useState } from "react";

import { getCurrentUser } from "@/src/api/authService";
import { Platform } from "react-native";
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
const normalizeRoles = (roles: string[]) =>
    roles.map((r) => (r.startsWith("ROLE_") ? r : `ROLE_${r}`));

export const AuthProvider = ({ children }: any) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

const loadUser = async () => {
    
  try {
    let savedToken: string | null = null;

    if (Platform.OS === "web") {
      savedToken = localStorage.getItem("token");
    } else {
      savedToken = await SecureStore.getItemAsync("token");
    }

    console.log("Saved token:", savedToken);

    if (!savedToken) {
      setLoading(false);
      return;
    }

    setToken(savedToken);

    const currentUser = await getCurrentUser();
    console.log("CURRENT USER FROM API:", currentUser);

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
  if (Platform.OS === "web") {
    localStorage.setItem("token", newToken);
  } else {
    await SecureStore.setItemAsync("token", newToken);
  }

  setToken(newToken);

  const currentUser = await getCurrentUser();
  setUser(currentUser);
};

const logout = async () => {
  console.log("LOGOUT CALLED");
  try {
    await SecureStore.deleteItemAsync("token"); // ou deleteValueWithKeyAsync selon version
  } catch (e) {
    console.error("Erreur logout SecureStore:", e);
  }
  setUser(null);
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