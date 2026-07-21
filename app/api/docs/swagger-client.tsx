"use client";

import dynamic from "next/dynamic";

const ReactSwagger = dynamic(() => import("./swagger-ui"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-gray-500 font-sans">
      Loading API Documentation...
    </div>
  ),
});

interface SwaggerClientProps {
  spec: Record<string, any>;
}

export default function SwaggerClient({ spec }: SwaggerClientProps) {
  return <ReactSwagger spec={spec} />;
}
