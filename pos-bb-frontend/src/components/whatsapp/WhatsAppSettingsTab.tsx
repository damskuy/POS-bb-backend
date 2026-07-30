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
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Device Connection Status Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#128C7E] border border-emerald-200/60 flex items-center justify-center shrink-0">
              <Smartphone className="w-7 h-7 text-[#25D366]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 font-sans">
                  Device Connection Status
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] mr-1.5 animate-pulse" />
                  Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Perangkat terhubung sebagai sender utama POS Bengkel Baik
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsTesting(true);
                setTimeout(() => setIsTesting(false), 1000);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`}
              />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Device Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
              Nomor Pengirim (Sender)
            </span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {senderNumber}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
              Gateway Provider
            </span>
            <span className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              Fonnte WhatsApp API
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
              Uptime Session
            </span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              99.9% (14 Hari Online)
            </span>
          </div>
        </div>
      </div>

      {/* Gateway Configuration & Test Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" />
              Pengaturan API Gateway & Autentikasi
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-1">
              Konfigurasikan API key dari penyedia gateway WhatsApp yang Anda gunakan.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Provider Gateway
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
              >
                <option value="fonnte">
                  Fonnte WhatsApp Gateway (Rekomendasi)
                </option>
                <option value="woowa">WooWa Gateway API</option>
                <option value="custom">Custom Webhook / Self-Hosted</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                API Key / Device Token
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nomor Pengirim (Sender Number)
              </label>
              <input
                type="text"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {isSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Pengaturan tersimpan!
              </span>
            )}
            {!isSaved && <div />}

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-emerald-600 text-white shadow-md shadow-[#25D366]/20 transition-all flex items-center gap-2 ml-auto cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              Simpan Pengaturan
            </button>
          </div>
        </div>

        {/* Real Test Send Box */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              Uji Coba Pengiriman
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-1">
              Kirim pesan percobaan langsung ke WhatsApp Anda untuk verifikasi koneksi Fonnte.
            </p>
          </div>

          <form onSubmit={handleTestConnection} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nomor Tujuan (HP)
              </label>
              <input
                type="text"
                placeholder="081234567890"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
              />
            </div>

            <button
              type="submit"
              disabled={isTesting}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Send className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
              {isTesting ? "Mengirim..." : "Kirim Pesan Uji Coba"}
            </button>
          </form>

          {/* Feedback Banners */}
          {testResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
              <span>{testResult}</span>
            </div>
          )}

          {testError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{testError}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 text-xs leading-relaxed space-y-1">
            <span className="font-bold block text-slate-800">Catatan Gateway:</span>
            <span>
              Pesan test yang dikirim akan dicatat secara otomatis pada tab{" "}
              <strong className="text-slate-900">Notification History</strong>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
