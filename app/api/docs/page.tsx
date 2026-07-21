import { getApiDocs } from "@/lib/swagger";
import SwaggerClient from "./swagger-client";

export const metadata = {
  title: "API Documentation - POS Bengkel",
  description: "Swagger / OpenAPI Documentation for POS Bengkel Backend API",
};

export default async function ApiDocsPage() {
  const spec = await getApiDocs();
  return <SwaggerClient spec={spec} />;
}


