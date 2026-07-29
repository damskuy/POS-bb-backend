"use client";

import React, { useState } from "react";
import {
  Smartphone,
  Key,
  CheckCircle2,
  RefreshCw,
  Send,
  ShieldAlert,
  Save,
  Globe,
  Radio,
} from "lucide-react";

export const WhatsAppSettingsTab: React.FC = () => {
  const [provider, setProvider] = useState("fonnte");
  const [apiKey, setApiKey] = useState("FONNTE_LIVE_KEY_89234892349283");
  const [senderNumber, setSenderNumber] = useState("+62 812-8899-7766");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleTestConnection = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      setTestResult("Pesan uji coba berhasil dikirim ke nomor " + (testPhone || senderNumber) + "!");
    }, 1200);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
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
              onClick={() => {
                setIsTesting(true);
                setTimeout(() => setIsTesting(false), 1000);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Device Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
              Nomor WhatsApp
            </span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {senderNumber}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
              Gateway Provider
            </span>
            <span className="text-sm font-bold text-emerald-600 mt-1 block flex items-center gap-1.5">
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
                <option value="fonnte">Fonnte WhatsApp Gateway (Rekomendasi)</option>
                <option value="woowa">WooWa Gateway API</option>
                <option value="custom">Custom Webhook / Baileys Self-Hosted</option>
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-emerald-600 text-white shadow-md shadow-[#25D366]/20 transition-all flex items-center gap-2 ml-auto"
            >
              <Save className="w-4 h-4" />
              Simpan Pengaturan
            </button>
          </div>
        </div>

        {/* Test Send Box */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              Uji Coba Pengiriman
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-1">
              Kirim pesan percobaaan langsung ke WhatsApp Anda untuk verifikasi koneksi.
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
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {isTesting ? "Mengirim..." : "Kirim Pesan Uji Coba"}
            </button>
          </form>

          {testResult && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
              {testResult}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 text-xs leading-relaxed space-y-1">
            <span className="font-bold block text-slate-800">Catatan Gateway:</span>
            <span>Pastikan kuota kirim pesan WhatsApp gateway Anda mencukupi untuk operasional harian.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
