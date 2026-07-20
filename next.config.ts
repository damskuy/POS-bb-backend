import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
