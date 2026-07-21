import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/spare-parts/:path*",
        destination: "/api/spare_parts/:path*",
      },
      {
        source: "/api/service-packages/:path*",
        destination: "/api/service_packages/:path*",
      },
      {
        source: "/api/service-package-items/:path*",
        destination: "/api/service_package_items/:path*",
      },
      {
        source: "/api/work-order-services/:path*",
        destination: "/api/work_order_services/:path*",
      },
      {
        source: "/api/work-order-parts/:path*",
        destination: "/api/work_order_parts/:path*",
      },
    ];
  },
};

export default nextConfig;
