import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch } from "@/lib/api-utils";

interface Subject {
  subject: string;
  class: number;
}

interface College {
  _id: string;
  name: string;
  address?: string;
}

interface User {
  id: number;
  _id: number;
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
  collegeId?: string;
  college?: College;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginLoading: boolean;
  isLogoutLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await apiFetch('/api/teachers/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          console.log('Auth check failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error("Failed to check authentication:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoginLoading(true);
      const response = await apiFetch('/api/teachers/login', {
        method: "POST",
        body: JSON.stringify({ email: username, password }),
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
    } finally {
      setIsLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLogoutLoading(true);
      await apiFetch('/api/teachers/logout', {
        method: "POST",
      });
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isLoading,
        isLoginLoading,
        isLogoutLoading,
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