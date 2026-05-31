"use client";

import {
  createContext,
  useEffect,
  useReducer,
  ReactNode,
} from "react";
import { getCookie, setCookie, deleteCookie } from "@/lib/cookies";

const SEVEN_DAYS = 7 * 24 * 60 * 60;

// --- Tipos ---

export type UserRole = "ADMIN" | "ATTENDANT" | "CLIENT";

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  clientId?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: "LOGIN" | "HYDRATE"; user: AuthUser; token: string }
  | { type: "LOGOUT" | "HYDRATE_EMPTY" };

// Dados recebidos da resposta de login do backend
export interface LoginResponseData {
  token: string;
  user: { name: string; email: string; clientId?: string };
}

export interface AuthContextType extends AuthState {
  login: (data: LoginResponseData) => void;
  logout: () => void;
}

// --- Utilitários ---

interface TokenPayload {
  userId: string;
  role: UserRole;
  clientId?: string;
}

function decodeToken(token: string): TokenPayload | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// --- Reducer ---

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
    case "HYDRATE":
      return { user: action.user, token: action.token, isLoading: false };
    case "LOGOUT":
    case "HYDRATE_EMPTY":
      return { user: null, token: null, isLoading: false };
  }
}

// --- Context ---

export const AuthContext = createContext<AuthContextType | null>(null);

// --- Provider ---

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    token: null,
    isLoading: true,
  });

  // Hidrata o estado a partir dos cookies ao montar
  useEffect(() => {
    const token = getCookie("token");
    const userJson = getCookie("auth_user");

    if (!token || !userJson) {
      dispatch({ type: "HYDRATE_EMPTY" });
      return;
    }

    const payload = decodeToken(token);
    if (!payload) {
      dispatch({ type: "HYDRATE_EMPTY" });
      return;
    }

    try {
      const { name, email } = JSON.parse(userJson) as { name: string; email: string };
      dispatch({
        type: "HYDRATE",
        token,
        user: {
          userId: payload.userId,
          role: payload.role,
          clientId: payload.clientId,
          name,
          email,
        },
      });
    } catch {
      dispatch({ type: "HYDRATE_EMPTY" });
    }
  }, []);

  function login({ token, user }: LoginResponseData) {
    const payload = decodeToken(token);
    if (!payload) return;

    const authUser: AuthUser = {
      userId: payload.userId,
      role: payload.role,
      clientId: payload.clientId ?? user.clientId,
      name: user.name,
      email: user.email,
    };

    setCookie("token", token, SEVEN_DAYS);
    setCookie(
      "auth_user",
      JSON.stringify({ name: user.name, email: user.email }),
      SEVEN_DAYS
    );

    dispatch({ type: "LOGIN", user: authUser, token });
  }

  function logout() {
    deleteCookie("token");
    deleteCookie("auth_user");
    dispatch({ type: "LOGOUT" });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
