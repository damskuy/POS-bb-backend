import React from "react";

export const LoadingPage: React.FC = () => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading page content...</p>
      </div>
    </div>
  );
};
