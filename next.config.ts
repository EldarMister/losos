import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: { root: process.cwd() },
  async headers() {
    return [{
      source: "/admin/sw.js",
      headers: [
        { key: "Service-Worker-Allowed", value: "/admin" },
        { key: "Cache-Control", value: "no-cache" },
      ],
    }];
  },
};

export default nextConfig;
