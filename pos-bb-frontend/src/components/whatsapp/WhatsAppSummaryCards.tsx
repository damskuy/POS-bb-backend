"use client";
"use client";

import React from "react";
import { CheckCircle2, Send, Clock, AlertTriangle, Radio } from "lucide-react";

export const WhatsAppSummaryCards: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
      {/* 1. WhatsApp Status */}
      <div className="bg-white rounded-[16px] border border-[#ECEFF4] p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-md transition-all duration-180 ease-out flex flex-col justify-between group">
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block truncate">
              Status WA
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#10B981] border border-emerald-100 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[20px] sm:text-[22px] xl:text-[26px] font-bold text-[#0F172A] tracking-tight font-sans truncate">
              Connected
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#10B981] border border-emerald-200/60 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] mr-1 animate-pulse" />
              Online
            </span>
          </div>
        </div>
        <p className="text-[11px] text-[#64748B] mt-3 pt-2.5 border-t border-[#ECEFF4] flex items-center gap-1 font-normal truncate">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
          <span className="truncate">Ready kirim.</span>
        </p>
      </div>

      {/* 2. Today's Messages */}
      <div className="bg-white rounded-[16px] border border-[#ECEFF4] p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-md transition-all duration-180 ease-out flex flex-col justify-between group">
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block truncate">
              Hari Ini
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-0.5">
            <span className="text-[22px] sm:text-[24px] xl:text-[26px] font-bold text-[#0F172A] tracking-tight font-mono font-tabular">
              156
            </span>
          </div>
        </div>
        <p className="text-[11px] text-[#64748B] mt-3 pt-2.5 border-t border-[#ECEFF4] font-normal truncate">
          Pesan terkirim.
        </p>
      </div>

      {/* 3. Pending Queue */}
      <div className="bg-white rounded-[16px] border border-[#ECEFF4] p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-md transition-all duration-180 ease-out flex flex-col justify-between group">
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block truncate">
              Pending
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-0.5">
            <span className="text-[22px] sm:text-[24px] xl:text-[26px] font-bold text-[#0F172A] tracking-tight font-mono font-tabular">
              8
            </span>
          </div>
        </div>
        <p className="text-[11px] text-[#64748B] mt-3 pt-2.5 border-t border-[#ECEFF4] font-normal truncate">
          Menunggu antrean.
        </p>
      </div>

      {/* 4. Failed */}
      <div className="bg-white rounded-[16px] border border-[#ECEFF4] p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-md transition-all duration-180 ease-out flex flex-col justify-between group">
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block truncate">
              Gagal
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-0.5">
            <span className="text-[22px] sm:text-[24px] xl:text-[26px] font-bold text-[#0F172A] tracking-tight font-mono font-tabular">
              2
            </span>
          </div>
        </div>
        <p className="text-[11px] text-[#64748B] mt-3 pt-2.5 border-t border-[#ECEFF4] font-normal truncate">
          Perlu di cek.
        </p>
      </div>
    </div>
  );
};
