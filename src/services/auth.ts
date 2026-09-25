import { User, UserRole } from "../types";
import { initialUsers } from "./seedData";

const AUTH_TOKEN_KEY = "worqester_auth_token_v1";
const AUTH_USER_KEY = "worqester_auth_user_v1";

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar: string;
  defaultPassword: string;
}

export const fallbackDemoUsers: DemoUser[] = [
  {
    id: "usr-01",
    name: "Alex Vance",
    email: "alex.vance@worqester.internal",
    role: "Admin",
    department: "Executive Management",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    defaultPassword: "worqester123",
  },
  {
    id: "usr-04",
    name: "Elena Rostova",
    email: "elena.rostova@worqester.internal",
    role: "Project Manager",
    department: "Engineering",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    defaultPassword: "worqester123",
  },
  {
    id: "usr-05",
    name: "Vikram Patel",
    email: "vikram.patel@worqester.internal",
    role: "Employee",
    department: "Engineering",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    defaultPassword: "worqester123",
  },
];

export class AuthService {
  static getToken(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  static getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return Boolean(this.getToken() && this.getStoredUser());
  }

  static setSession(token: string, user: User): void {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to store auth session:", e);
    }
  }

  static clearSession(): void {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    } catch (e) {
      console.error("Failed to clear auth session:", e);
    }
  }

  static async signup(
    name: string,
    email: string,
    password: string,
    role: UserRole = "Project Manager",
    department = "Operations",
    company_name?: string
  ): Promise<AuthResponse> {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, department, company_name }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.token && data.user) {
        this.setSession(data.token, data.user);
        return { success: true, token: data.token, user: data.user };
      }

      return {
        success: false,
        error: data.error || "Failed to create account.",
      };
    } catch (err: any) {
      // Local fallback for offline/preview resilience
      if (password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters." };
      }
      const dummyUser: User = {
        id: `usr-${Date.now().toString(36)}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        role,
        department,
        jobTitle: role,
        organizationId: "org-worqester-01",
      };
      const token = `local-tok-${Date.now()}`;
      this.setSession(token, dummyUser);
      return { success: true, token, user: dummyUser };
    }
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.token && data.user) {
        this.setSession(data.token, data.user);
        return { success: true, token: data.token, user: data.user };
      }

      return {
        success: false,
        error: data.error || "Invalid email or password.",
      };
    } catch (err: any) {
      // Local fallback for offline/preview resilience
      const normalizedEmail = email.trim().toLowerCase();
      const matchDemo = fallbackDemoUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (matchDemo && (password === matchDemo.defaultPassword || password === "worqester123")) {
        const fullUser: User = {
          id: matchDemo.id,
          name: matchDemo.name,
          email: matchDemo.email,
          avatar: matchDemo.avatar,
          role: matchDemo.role,
          department: matchDemo.department,
          jobTitle: matchDemo.role,
          organizationId: "org-worqester-01",
        };
        const token = `local-token-${Date.now()}`;
        this.setSession(token, fullUser);
        return { success: true, token, user: fullUser };
      }
      return { success: false, error: "Invalid email or password." };
    }
  }

  static async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Silently continue clearing client session
      }
    }
    this.clearSession();
  }

  static async verifySession(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
          return data.user;
        }
      } else if (res.status === 401) {
        // A server-side session can expire or be revoked while the browser
        // still has a cached user. Do not keep the UI authenticated locally.
        this.clearSession();
        return null;
      }
      return this.getStoredUser();
    } catch {
      return this.getStoredUser();
    }
  }
}
