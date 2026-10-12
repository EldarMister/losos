import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "NAKTA — Панель управления",
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "NAKTA", statusBarStyle: "default" },
  icons: { icon: "/admin/app-icon.png", apple: "/admin/app-icon.png" },
  alternates: { canonical: "/admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
