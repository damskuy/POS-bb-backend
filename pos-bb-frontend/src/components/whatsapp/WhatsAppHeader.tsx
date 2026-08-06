"use client";

import React from "react";
import { MessageSquare, ShieldCheck } from "lucide-react";

export const WhatsAppHeader: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 pb-4 border-b border-[#ECEFF4] animate-fadeIn">
      {/* Breadcrumb - Desktop Only */}
      <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B] tracking-tight">
        <span>Dashboard</span>
        <span className="text-slate-300">/</span>
        <span className="text-[#0F172A] font-bold">WhatsApp Automation</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* WhatsApp Green Icon */}
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-[#10B981] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.67-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.008 0C5.378 0 .002 5.374.002 12.003c0 2.116.551 4.18 1.597 6.002L0 24l6.155-1.615a11.782 11.782 0 005.848 1.538h.005c6.628 0 12.005-5.375 12.005-12.005 0-3.208-1.248-6.22-3.51-8.483" />
            </svg>
          </div>
          <h1 className="text-[22px] md:text-[24px] font-bold tracking-tight text-[#0F172A] leading-tight font-sans">
            WhatsApp Automation
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#10B981] border border-emerald-200/80 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
            Active System
          </span>
        </div>

        <p className="hidden sm:block text-[12px] text-[#64748B] font-normal leading-normal max-w-xl">
          Kelola automasi WhatsApp, reminder service, template pesan, dan riwayat pengiriman.
        </p>
      </div>
    </div>
  );
};
