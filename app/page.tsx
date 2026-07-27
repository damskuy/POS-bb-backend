import React from "react";

export default function RootPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl p-8 shadow-2xl backdrop-blur-sm space-y-6">
        {/* Header Badge & Title */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                POS Bengkel Backend API
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Production-ready Workshop Point of Sale REST API Service
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online</span>
          </div>
        </div>

        {/* API Specification Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/60 border border-slate-700/40 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Framework
            </span>
            <span className="text-sm font-semibold text-white">Next.js App Router (API-First)</span>
          </div>
          <div className="p-4 bg-slate-900/60 border border-slate-700/40 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Database
            </span>
            <span className="text-sm font-semibold text-white">PostgreSQL &amp; Prisma ORM</span>
          </div>
        </div>

        {/* Action Links */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Quick Navigation &amp; Documentation
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/api/docs"
              className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl text-center transition-all shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Swagger Interactive Docs</span>
            </a>
            <a
              href="/api/health"
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl text-center transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Health Check Endpoint</span>
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-700/60 pt-4 flex items-center justify-between text-[11px] text-slate-500">
          <span>&copy; {new Date().getFullYear()} POS Bengkel Enterprise</span>
          <span>Environment: {process.env.NODE_ENV || "production"}</span>
        </div>
      </div>
    </div>
  );
}
