import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // IPs de la LAN desde las que se prueba en el móvil con `npm run dev` (ver .env.example).
  allowedDevOrigins: (process.env.DEV_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean),
};
export default nextConfig;
