import { create } from "zustand";

type AdminAuthState = {
  token: string;
  hydrate: () => void;
  signIn: (token: string) => void;
  signOut: () => void;
};

/** Device-local admin session. The token is never persisted outside this browser. */
export const useAdminAuth = create<AdminAuthState>((set) => ({
  token: "",
  hydrate: () => {
    if (typeof window === "undefined") return;
    set({ token: window.sessionStorage.getItem("losos-admin-token") || "" });
  },
  signIn: (token) => {
    if (typeof window !== "undefined") window.sessionStorage.setItem("losos-admin-token", token);
    set({ token });
  },
  signOut: () => {
    if (typeof window !== "undefined") window.sessionStorage.removeItem("losos-admin-token");
    set({ token: "" });
  },
}));
