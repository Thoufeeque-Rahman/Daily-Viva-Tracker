import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Subject {
  subject: string;
  class: number;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  subjectsTaught: Subject[];
  tId: string;
  role?: "teacher" | "super_admin";
  qualification?: string;
  joinedAt?: string;
  active?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/teachers/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to check authentication:", error);
      }
    };

    checkAuth();
  }, [baseUrl]);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/teachers/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const data = await response.json();
      setUser(data.teacher);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${baseUrl}/api/teachers/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
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