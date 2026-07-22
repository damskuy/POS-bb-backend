"use client";

import SwaggerUI from "swagger-ui-react";

interface SwaggerUIProps {
  spec: Record<string, any>;
}

export default function ReactSwagger({ spec }: SwaggerUIProps) {
  return (
    <div className="swagger-container bg-white min-h-screen p-4">
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-react@5/swagger-ui.css"
      />
      <SwaggerUI spec={spec} />
    </div>
  );
}

