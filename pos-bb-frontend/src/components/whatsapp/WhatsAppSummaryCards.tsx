"use client";

import React from "react";
import { CheckCircle2, Send, Clock, AlertTriangle, Radio } from "lucide-react";

export const WhatsAppSummaryCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. WhatsApp Status */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              WhatsApp Status
            </span>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                Connected
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] mr-1.5 animate-pulse" />
                Online
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-[#128C7E] border border-emerald-100 shrink-0">
            <Radio className="w-5 h-5 text-[#25D366]" />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Device online dan siap mengirim pesan.
        </p>
      </div>

      {/* 2. Today's Messages */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Messages
            </span>
            <div className="pt-1">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                156
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <Send className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 font-medium">
          Pesan berhasil dikirim hari ini.
        </p>
      </div>

      {/* 3. Pending Queue */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Queue
            </span>
            <div className="pt-1">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                8
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 font-medium">
          Menunggu diproses.
        </p>
      </div>

      {/* 4. Failed */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Failed
            </span>
            <div className="pt-1">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                2
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 font-medium">
          Perlu pengecekan.
        </p>
      </div>
    </div>
  );
};
