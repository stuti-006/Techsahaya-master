import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
import type { EligibilityProfile, NotificationItem, Scheme, User } from "../types";

type AppContextValue = {
  schemes: Scheme[];
  profile: EligibilityProfile;
  setProfile: (profile: EligibilityProfile) => void;
  language: string;
  setLanguage: (language: string) => void;
  offline: boolean;
  refreshSchemes: () => Promise<void>;
  personas: Record<string, { label: string; profile: EligibilityProfile }>;
  loadPersona: (key: string) => void;
  token: string | null;
  user: User | null;
  notifications: NotificationItem[];
  login: (payload: { email: string; password: string; remember_session: boolean }) => Promise<string | null>;
  signup: (payload: Record<string, unknown>) => Promise<{ requires_otp: boolean; email: string; dev_otp?: string; message?: string } | string>;
  sendOtp: (email: string, purpose?: string) => Promise<{ status: string; email: string; dev_otp?: string; message?: string } | string>;
  verifyOtp: (payload: { email: string; otp_code: string; purpose?: string; remember_session?: boolean }) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [profile, setProfile] = useState<EligibilityProfile>({ available_documents: [] });
  const [language, setLanguageState] = useState(sessionStorage.getItem("tech-sahaya-language") || "en");
  const [offline, setOffline] = useState(!navigator.onLine);
  const [personas, setPersonas] = useState<Record<string, { label: string; profile: EligibilityProfile }>>({});
  const [token, setToken] = useState<string | null>(sessionStorage.getItem("tech-sahaya-token") || localStorage.getItem("tech-sahaya-token"));
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    refreshSchemes();
    api.get("/api/personas").then((res) => setPersonas(res.data)).catch(() => undefined);
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem("tech-sahaya-language", language);
  }, [language]);

  useEffect(() => {
    if (token) {
      refreshSession().catch(() => logout());
    }
  }, [token]);

  const setLanguage = (next: string) => setLanguageState(next);

  const refreshSchemes = async () => {
    try {
      const response = await api.get("/api/schemes");
      setSchemes(response.data);
      localStorage.setItem("tech-sahaya-schemes", JSON.stringify(response.data));
    } catch {
      const cached = localStorage.getItem("tech-sahaya-schemes");
      if (cached) setSchemes(JSON.parse(cached));
    }
  };

  const refreshNotifications = async () => {
    if (!token) return;
    try {
      const response = await api.get("/api/notifications");
      setNotifications(response.data);
    } catch {
      setNotifications([]);
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const response = await api.get("/api/profile");
      setProfile({
        age: response.data.age,
        gender: response.data.gender,
        state: response.data.state,
        occupation: response.data.occupation,
        income: response.data.income,
        landholding: response.data.landholding,
        disability: response.data.disability,
        family_members: response.data.family_members,
        available_documents: response.data.available_documents || [],
        onboarding_completed: response.data.onboarding_completed
      });
      setLanguage(response.data.preferred_language || language);
    } catch {
      undefined;
    }
  };

  const refreshSession = async () => {
    const response = await api.get("/api/auth/me");
    setUser(response.data);
    await Promise.all([refreshNotifications(), refreshProfile()]);
  };

  const persistToken = (nextToken: string, remember = false) => {
    setToken(nextToken);
    sessionStorage.setItem("tech-sahaya-token", nextToken);
    if (remember) {
      localStorage.setItem("tech-sahaya-token", nextToken);
    } else {
      localStorage.removeItem("tech-sahaya-token");
    }
  };

  const login = async (payload: { email: string; password: string; remember_session: boolean }) => {
    try {
      const response = await api.post("/api/auth/login", payload);
      persistToken(response.data.token, payload.remember_session);
      setUser(response.data.user);
      setLanguage(response.data.user.preferred_language);
      return null;
    } catch (error: any) {
      return error?.response?.data?.detail || "Login failed";
    }
  };

  const signup = async (payload: Record<string, unknown>) => {
    try {
      const response = await api.post("/api/auth/signup", payload);
      return response.data;
    } catch (error: any) {
      return error?.response?.data?.detail || "Signup failed";
    }
  };

  const sendOtp = async (email: string, purpose = "signup_2fa") => {
    try {
      const response = await api.post("/api/auth/send-otp", { email, purpose });
      return response.data;
    } catch (error: any) {
      return error?.response?.data?.detail || "Failed to send verification code";
    }
  };

  const verifyOtp = async (payload: { email: string; otp_code: string; purpose?: string; remember_session?: boolean }) => {
    try {
      const response = await api.post("/api/auth/verify-otp", payload);
      persistToken(response.data.token, payload.remember_session ?? false);
      setUser(response.data.user);
      setLanguage(response.data.user.preferred_language || language);
      await Promise.all([refreshNotifications(), refreshProfile()]);
      return null;
    } catch (error: any) {
      return error?.response?.data?.detail || "Verification failed";
    }
  };

  const logout = async () => {
    try {
      if (token) await api.post("/api/auth/logout");
    } catch {
      undefined;
    }
    sessionStorage.removeItem("tech-sahaya-token");
    localStorage.removeItem("tech-sahaya-token");
    setToken(null);
    setUser(null);
    setNotifications([]);
    setProfile({ available_documents: [] });
  };

  const loadPersona = (key: string) => {
    const persona = personas[key];
    if (persona) setProfile(persona.profile);
  };

  return (
    <AppContext.Provider
      value={{
        schemes,
        profile,
        setProfile,
        language,
        setLanguage,
        offline,
        refreshSchemes,
        personas,
        loadPersona,
        token,
        user,
        notifications,
        login,
        signup,
        sendOtp,
        verifyOtp,
        logout,
        refreshSession,
        refreshProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("App context is unavailable");
  return context;
}
