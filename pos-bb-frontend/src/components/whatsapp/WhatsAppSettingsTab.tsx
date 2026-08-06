"use client";

import React, { useState } from "react";
import {
  Smartphone,
  Key,
  CheckCircle2,
  RefreshCw,
  Send,
  Save,
  Radio,
  AlertCircle,
} from "lucide-react";
import { NotificationHistoryService } from "@/services/notificationHistory.service";

export const WhatsAppSettingsTab: React.FC = () => {
  const [provider, setProvider] = useState("fonnte");
  const [apiKey, setApiKey] = useState("FONNTE_LIVE_KEY_89234892349283");
  const [senderNumber, setSenderNumber] = useState("+62 812-8899-7766");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Normalize Indonesian phone numbers (e.g. 0812... -> 62812..., +62812... -> 62812...)
  const normalizePhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9+]/g, "").trim();
    if (cleaned.startsWith("+")) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.substring(1);
    }
    return cleaned;
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestError(null);
    setTestResult(null);

    const rawTarget = testPhone.trim() || senderNumber.trim();
    if (!rawTarget) {
      setTestError("Nomor WhatsApp tujuan wajib diisi");
      return;
    }

    const normalized = normalizePhoneNumber(rawTarget);
    if (!normalized.startsWith("62") || normalized.length < 10) {
      setTestError(
        "Format nomor WhatsApp tidak valid. Gunakan format seperti 081234567890 atau 6281234567890."
      );
      return;
    }

    setIsTesting(true);

    try {
      const res = await NotificationHistoryService.sendTestNotification(
        normalized,
        "Pesan uji coba WhatsApp dari POS Bengkel Baik. Koneksi gateway Fonnte berhasil terhubung!"
      );

      if (res.success) {
        setTestResult(
          `Pesan test berhasil dikirim ke nomor ${normalized}!`
        );
      } else {
        setTestError(
          res.error ||
            "Pesan test gagal dikirim. Periksa koneksi WhatsApp dan konfigurasi layanan."
        );
      }
    } catch (err: any) {
      console.error("Failed to send test notification:", err);
      setTestError(
        err.message ||
          "Pesan test gagal dikirim. Periksa koneksi WhatsApp dan konfigurasi layanan."
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-5 md:space-y-6 animate-fadeIn font-sans">
      {/* 1. Device Connection Status Card */}
      <div className="bg-white rounded-[16px] border border-[#ECEFF4] p-5 md:p-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#ECEFF4]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#10B981] border border-emerald-200/60 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-[#25D366]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-bold text-[#0F172A] font-sans">
                  Device Connection Status
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#10B981] border border-emerald-200/80 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] mr-1.5 animate-pulse" />
                  Connected
                </span>
              </div>
              <p className="text-[12px] text-[#64748B] font-normal mt-0.5">
                Perangkat terhubung sebagai sender utama POS Bengkel Baik
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsTesting(true);
              setTimeout(() => setIsTesting(false), 1000);
            }}
            className="w-full sm:w-auto h-[44px] md:h-[36px] px-4 rounded-[10px] text-[13px] font-medium text-[#0F172A] bg-[#F1F5F9] hover:bg-slate-200/70 border border-[#ECEFF4] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#64748B] ${isTesting ? "animate-spin" : ""}`}
            />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Device Metrics - Stacked vertically on mobile, 3 columns on tablet/desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 pt-5">
          <div className="p-3.5 md:p-4 rounded-xl bg-[#F8FAFC] border border-[#ECEFF4]">
            <span className="text-[11px] text-[#64748B] font-semibold block uppercase tracking-wider">
              Nomor Pengirim (Sender)
            </span>
            <span className="text-[13px] sm:text-[14px] font-bold text-[#0F172A] mt-1 block font-mono">
              {senderNumber}
            </span>
          </div>
          <div className="p-3.5 md:p-4 rounded-xl bg-[#F8FAFC] border border-[#ECEFF4]">
            <span className="text-[11px] text-[#64748B] font-semibold block uppercase tracking-wider">
              Gateway Provider
            </span>
            <span className="text-[13px] sm:text-[14px] font-bold text-[#10B981] mt-1 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              Fonnte WhatsApp API
            </span>
          </div>
          <div className="p-3.5 md:p-4 rounded-xl bg-[#F8FAFC] border border-[#ECEFF4]">
            <span className="text-[11px] text-[#64748B] font-semibold block uppercase tracking-wider">
              Uptime Session
            </span>
            <span className="text-[13px] sm:text-[14px] font-bold text-[#0F172A] mt-1 block">
              99.9% (14 Hari Online)
            </span>
          </div>
        </div>
      </div>

      {/* Gateway Configuration & Test Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {/* API Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-[16px] border border-[#ECEFF4] p-5 md:p-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-5">
          <div>
            <h3 className="text-[15px] font-bold text-[#0F172A] font-sans flex items-center gap-2">
              <Key className="w-4 h-4 text-[#10B981]" />
              Pengaturan API Gateway & Autentikasi
            </h3>
            <p className="text-[12px] text-[#64748B] font-normal mt-1">
              Konfigurasikan API key dari penyedia gateway WhatsApp yang Anda gunakan.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                Pilih Provider Gateway
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full h-[44px] md:h-[42px] px-3.5 rounded-[10px] border border-[#ECEFF4] text-[13px] font-medium text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]"
              >
                <option value="fonnte">
                  Fonnte WhatsApp Gateway (Rekomendasi)
                </option>
                <option value="woowa">WooWa Gateway API</option>
                <option value="custom">Custom Webhook / Self-Hosted</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                API Key / Device Token
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full h-[44px] md:h-[42px] px-3.5 rounded-[10px] border border-[#ECEFF4] text-[13px] font-mono text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                Nomor Pengirim (Sender Number)
              </label>
              <input
                type="text"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                className="w-full h-[44px] md:h-[42px] px-3.5 rounded-[10px] border border-[#ECEFF4] text-[13px] font-mono text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#ECEFF4] flex flex-col sm:flex-row items-center justify-between gap-3">
            {isSaved && (
              <span className="text-[12px] font-semibold text-[#10B981] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Pengaturan tersimpan!
              </span>
            )}
            {!isSaved && <div />}

            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto h-[44px] md:h-[40px] px-5 rounded-[10px] text-[13px] font-medium bg-[#10B981] hover:bg-emerald-600 text-white shadow-xs transition-all duration-180 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </div>

        {/* Real Test Send Box */}
        <div className="bg-white rounded-[16px] border border-[#ECEFF4] p-5 md:p-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)] flex flex-col justify-between space-y-5">
          <div>
            <h3 className="text-[15px] font-bold text-[#0F172A] font-sans flex items-center gap-2">
              <Send className="w-4 h-4 text-[#10B981]" />
              Uji Coba Pengiriman
            </h3>
            <p className="text-[12px] text-[#64748B] font-normal mt-1">
              Kirim pesan percobaan langsung ke WhatsApp Anda untuk verifikasi koneksi Fonnte.
            </p>
          </div>

          <form onSubmit={handleTestConnection} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                Nomor Tujuan (HP)
              </label>
              <input
                type="text"
                placeholder="081234567890"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full h-[44px] md:h-[42px] px-3.5 rounded-[10px] border border-[#ECEFF4] text-[13px] font-mono text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]"
              />
            </div>

            <button
              type="submit"
              disabled={isTesting}
              className="w-full h-[44px] md:h-[40px] rounded-[10px] text-[13px] font-medium bg-[#0F172A] hover:bg-slate-800 text-white transition-all duration-180 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
              <span>{isTesting ? "Mengirim..." : "Kirim Pesan Uji Coba"}</span>
            </button>
          </form>

          {/* Feedback Banners */}
          {testResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
              <span>{testResult}</span>
            </div>
          )}

          {testError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[12px] font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{testError}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#ECEFF4] text-[#64748B] text-[12px] leading-relaxed space-y-1">
            <span className="font-bold block text-[#0F172A]">Catatan Gateway:</span>
            <span>
              Pesan test yang dikirim akan dicatat secara otomatis pada tab{" "}
              <strong className="text-[#0F172A]">Notification History</strong>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
