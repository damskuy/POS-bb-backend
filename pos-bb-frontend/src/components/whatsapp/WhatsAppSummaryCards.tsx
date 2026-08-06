"use client";

import React from "react";
import { CheckCircle2, Send, Clock, AlertTriangle, Radio } from "lucide-react";

export const WhatsAppSummaryCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* 1. WhatsApp Status */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 xl:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              WhatsApp Status
            </span>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                Connected
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60 shrink-0">
                <span className="w-1 h-1 rounded-full bg-[#25D366] mr-1 animate-pulse" />
                Online
              </span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-[#128C7E] border border-emerald-100 shrink-0">
            <Radio className="w-4 h-4 text-[#25D366]" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">Device online & siap kirim.</span>
        </p>
      </div>

      {/* 2. Today's Messages */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 xl:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Today's Messages
            </span>
            <div className="pt-1">
              <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-mono">
                156
              </span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <Send className="w-4 h-4" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100 font-medium truncate">
          Pesan berhasil dikirim hari ini.
        </p>
      </div>

      {/* 3. Pending Queue */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 xl:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Pending Queue
            </span>
            <div className="pt-1">
              <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-mono">
                8
              </span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100 font-medium truncate">
          Menunggu diproses antrean.
        </p>
      </div>

      {/* 4. Failed */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 xl:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Failed Messages
            </span>
            <div className="pt-1">
              <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-mono">
                2
              </span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100 font-medium truncate">
          Memerlukan pengecekan segera.
        </p>
      </div>
    </div>
  );
};
