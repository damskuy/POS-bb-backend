"use client";

import React from "react";
import { Calendar, MessageSquare, History, ArrowRight } from "lucide-react";
import { WhatsAppTabType } from "./WhatsAppTabs";

interface OverviewTabProps {
  onNavigateTab: (tab: WhatsAppTabType) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigateTab }) => {
  const cards = [
    {
      id: "whatsapp-settings" as WhatsAppTabType,
      title: "WhatsApp Settings",
      description:
        "Kelola koneksi device WhatsApp, API Key, dan status koneksi.",
      buttonText: "Open Settings",
      iconType: "whatsapp",
      accentBg: "bg-emerald-50 text-[#128C7E] border-emerald-200/60",
      btnStyle: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
    },
    {
      id: "reminder-settings" as WhatsAppTabType,
      title: "Reminder Settings",
      description:
        "Atur reminder service otomatis berdasarkan interval kilometer maupun waktu.",
      buttonText: "Manage Reminder",
      iconType: "calendar",
      accentBg: "bg-blue-50 text-blue-600 border-blue-200/60",
      btnStyle: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
    },
    {
      id: "notification-templates" as WhatsAppTabType,
      title: "Notification Templates",
      description:
        "Kelola template pesan untuk estimasi, invoice, reminder, dan pekerjaan selesai.",
      buttonText: "Edit Templates",
      iconType: "message",
      accentBg: "bg-amber-50 text-amber-600 border-amber-200/60",
      btnStyle: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
    },
    {
      id: "notification-history" as WhatsAppTabType,
      title: "Notification History",
      description:
        "Lihat seluruh histori pengiriman WhatsApp beserta status berhasil maupun gagal.",
      buttonText: "View History",
      iconType: "history",
      accentBg: "bg-indigo-50 text-indigo-600 border-indigo-200/60",
      btnStyle: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20",
    },
  ];

  const renderIcon = (type: string) => {
    switch (type) {
      case "whatsapp":
        return (
          <svg className="w-6 h-6 fill-[#25D366]" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.67-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.008 0C5.378 0 .002 5.374.002 12.003c0 2.116.551 4.18 1.597 6.002L0 24l6.155-1.615a11.782 11.782 0 005.848 1.538h.005c6.628 0 12.005-5.375 12.005-12.005 0-3.208-1.248-6.22-3.51-8.483" />
          </svg>
        );
      case "calendar":
        return <Calendar className="w-6 h-6" />;
      case "message":
        return <MessageSquare className="w-6 h-6" />;
      case "history":
        return <History className="w-6 h-6" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner Intro */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-300 backdrop-blur-md border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            Communication Hub
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Pusat Automasi & Komunikasi WhatsApp POS Bengkel
          </h2>
          <p className="text-sm text-slate-300 font-normal leading-relaxed">
            Tingkatkan kepuasan pelanggan dengan pengiriman invoice, reminder service berkala, serta pembaruan status pengerjaan secara otomatis melalui WhatsApp.
          </p>
        </div>
      </div>

      {/* 4 Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => onNavigateTab(card.id)}
            className="group bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs transition-transform duration-300 group-hover:scale-110 ${card.accentBg}`}
              >
                {renderIcon(card.iconType)}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#128C7E] transition-colors font-sans">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  {card.description}
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateTab(card.id);
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${card.btnStyle}`}
              >
                <span>{card.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
