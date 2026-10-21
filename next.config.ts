import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  /* config options here */
  // IPs de la LAN desde las que se prueba en el móvil con `npm run dev` (ipconfig → Wi-Fi).
  allowedDevOrigins: ["10.0.0.16", "172.26.16.1"],
};
export default nextConfig;
