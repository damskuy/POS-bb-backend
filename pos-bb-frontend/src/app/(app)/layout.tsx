import React, { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function InternalAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
