"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

interface SwaggerUIProps {
  spec: Record<string, any>;
}

export default function ReactSwagger({ spec }: SwaggerUIProps) {
  return (
    <div className="swagger-container bg-white min-h-screen p-4">
      <SwaggerUI spec={spec} />
    </div>
  );
}
