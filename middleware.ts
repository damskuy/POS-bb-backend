// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const token = request.headers
    .get("authorization")
    ?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        {
          status: 401,
        }
      );
    }

    const requestHeaders = new Headers(request.headers);

    requestHeaders.set("x-user-id", payload.id.toString());
    requestHeaders.set("x-user-email", payload.email);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid token",
      },
      {
        status: 401,
      }
    );
  }
}

export const config = {
  matcher: [
    "/api/users/:path*",
    "/api/customers/:path*",
    "/api/vehicles/:path*",
    "/api/mechanics/:path*",
    "/api/services/:path*",
    "/api/service_packages/:path*",
    "/api/service-packages/:path*",
    "/api/service_package_items/:path*",
    "/api/service-package-items/:path*",
    "/api/spare_parts/:path*",
    "/api/spare-parts/:path*",
    "/api/work-orders/:path*",
    "/api/work_order_services/:path*",
    "/api/work-order-services/:path*",
    "/api/work_order_parts/:path*",
    "/api/work-order-parts/:path*",
    "/api/payments/:path*",
    "/api/invoices/:path*",
    "/api/reports/:path*",
    "/api/audit-logs/:path*",
  ],
};