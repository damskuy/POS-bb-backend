import { NextResponse } from "next/server";

export function success(data: unknown, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function error(message: string, status = 500) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

export function validationError(errors: unknown) {
  return NextResponse.json(
    {
      success: false,
      message: "Validation failed",
      errors,
    },
    {
      status: 400,
    }
  );
}

export function notFound(resource = "Data") {
  return NextResponse.json(
    {
      success: false,
      message: `${resource} not found`,
    },
    {
      status: 404,
    }
  );
}