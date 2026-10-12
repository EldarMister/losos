"use client";
import { createContext, useContext } from "react";

export type Staff = { id: string; name: string; login: string; role: "OWNER" | "ADMIN" | "MANAGER"; active: boolean; permissions: Record<string, "allow" | "deny" | "inherit">; effectivePermissions: string[] };
export const AdminAccessContext = createContext<{ staff: Staff | null; can: (permission: string) => boolean }>({ staff: null, can: () => false });
export function useAdminAccess() { return useContext(AdminAccessContext); }
