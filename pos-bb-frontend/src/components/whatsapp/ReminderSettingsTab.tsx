"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Gauge,
  Calendar,
  Send,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Play,
  User,
  Zap,
  CheckCheck,
  Sparkles,
  ArrowRight,
  Trash2,
  Power,
  Check,
  ShieldCheck,
  Radio,
  MessageSquare,
  Save,
} from "lucide-react";

interface AutomationItem {
  id: string;
  name: string;
  category: "Servis" | "Perawatan" | "Ban" | "Kelistrikan" | "Rem";
  triggerText: string;
  daysInterval: number;
  kmInterval: number;
  useDays: boolean;
  useKm: boolean;
  isActive: boolean;
  targetCustomers: string[];
  sendTime: string;
  timezone: string;
  sendDays: string;
  skipHolidays: boolean;
  retryOnFailure: boolean;
  messageTemplate: string;
}

interface CustomerSample {
  id: string;
  name: string;
  phone: string;
  vehicleName: string;
  vehiclePlate: string;
  currentKm: number;
  lastServiceDate: string;
}

export const ReminderSettingsTab: React.FC = () => {
  // Sample Customers for Live Simulation
  const customersSample: CustomerSample[] = [
    {
      id: "c1",
      name: "Budi Santoso",
      phone: "+62 812-3456-7890",
      vehicleName: "Honda Vario 125",
      vehiclePlate: "B 1234 ABC",
      currentKm: 2985,
      lastServiceDate: "12 Juni 2026",
    },
    {
      id: "c2",
      name: "Siti Aminah",
      phone: "+62 813-9876-5432",
      vehicleName: "Toyota Avanza Veloz",
      vehiclePlate: "B 9876 XYZ",
      currentKm: 9950,
      lastServiceDate: "15 April 2026",
    },
    {
      id: "c3",
      name: "Rudi Hermawan",
      phone: "+62 857-1122-3344",
      vehicleName: "Yamaha NMAX 155",
      vehiclePlate: "D 4567 LMN",
      currentKm: 5400,
      lastServiceDate: "01 Mei 2026",
    },
  ];

  // Automations List State
  const [automations, setAutomations] = useState<AutomationItem[]>([
    {
      id: "aut-1",
      name: "Pengingat Ganti Oli",
      category: "Servis",
      triggerText: "7 hari sebelum jatuh tempo",
      daysInterval: 30,
      kmInterval: 3000,
      useDays: true,
      useKm: true,
      isActive: true,
      targetCustomers: ["semua", "motor", "mobil"],
      sendTime: "09:00",
      timezone: "Asia/Jakarta",
      sendDays: "Senin - Sabtu",
      skipHolidays: true,
      retryOnFailure: true,
      messageTemplate:
        "Halo {{customer_name}} 👋\n\nKendaraan Anda {{vehicle_name}} ({{vehicle_plate}}) akan memasuki jadwal ganti oli berkala dalam 7 hari lagi.\n\n📅 Estimasi tanggal: {{next_service_date}}\n\nSegera lakukan penggantian oli untuk menjaga performa kendaraan Anda tetap optimal.\n\nKlik tombol di bawah untuk booking servis:",
    },
    {
      id: "aut-2",
      name: "Tune Up Berkala",
      category: "Perawatan",
      triggerText: "90 hari / 10.000 KM",
      daysInterval: 90,
      kmInterval: 10000,
      useDays: true,
      useKm: true,
      isActive: true,
      targetCustomers: ["semua", "mobil"],
      sendTime: "09:30",
      timezone: "Asia/Jakarta",
      sendDays: "Senin - Sabtu",
      skipHolidays: true,
      retryOnFailure: true,
      messageTemplate:
        "Halo {{customer_name}} 👋\n\nWaktunya perawatan Tune Up berkala untuk {{vehicle_name}} ({{vehicle_plate}}). Jaga efisiensi bahan bakar dan performa mesin bengkel Anda.\n\nEstimasi tanggal: {{next_service_date}}",
    },
    {
      id: "aut-3",
      name: "Rotasi Ban & Balancing",
      category: "Ban",
      triggerText: "30 hari",
      daysInterval: 30,
      kmInterval: 5000,
      useDays: true,
      useKm: false,
      isActive: false,
      targetCustomers: ["mobil"],
      sendTime: "10:00",
      timezone: "Asia/Jakarta",
      sendDays: "Senin - Jumat",
      skipHolidays: true,
      retryOnFailure: false,
      messageTemplate:
        "Halo {{customer_name}}, keselamatan berkendara dimulai dari kondisi ban! Cek rotasi ban kendaraan {{vehicle_plate}} Anda hari ini.",
    },
    {
      id: "aut-4",
      name: "Cek Aki & Kelistrikan",
      category: "Kelistrikan",
      triggerText: "60 hari",
      daysInterval: 60,
      kmInterval: 8000,
      useDays: true,
      useKm: false,
      isActive: false,
      targetCustomers: ["semua"],
      sendTime: "08:30",
      timezone: "Asia/Jakarta",
      sendDays: "Setiap Hari",
      skipHolidays: false,
      retryOnFailure: true,
      messageTemplate:
        "Halo {{customer_name}}, cegah mobil mogok tiba-tiba! Lakukan pengecekan tegangan aki {{vehicle_name}} Anda di POS Bengkel Baik.",
    },
    {
      id: "aut-5",
      name: "Pemeriksaan Rem & Suspensi",
      category: "Rem",
      triggerText: "120 hari",
      daysInterval: 120,
      kmInterval: 15000,
      useDays: true,
      useKm: true,
      isActive: false,
      targetCustomers: ["semua", "vip"],
      sendTime: "09:00",
      timezone: "Asia/Jakarta",
      sendDays: "Senin - Sabtu",
      skipHolidays: true,
      retryOnFailure: true,
      messageTemplate:
        "Halo {{customer_name}}, sistem pengereman adalah prioritas utama keselamatan. Jadwalkan pemeriksaan kanvas rem {{vehicle_plate}} sekarang.",
    },
  ]);

  // Selected Automation, Search, Save Notice & Menu State
  const [selectedId, setSelectedId] = useState<string>("aut-1");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Live Simulation State
  const [simCustomer, setSimCustomer] = useState<CustomerSample>(customersSample[0]);
  const [simKm, setSimKm] = useState<number>(2985);
  const [simDate, setSimDate] = useState<string>("2026-07-12");

  // Active Automation Item
  const activeAutomation =
    automations.find((a) => a.id === selectedId) || automations[0];

  // Helper for dynamic trigger summary text
  const getTriggerText = (item: AutomationItem) => {
    if (item.useDays && item.useKm) {
      return `${item.daysInterval} hari / ${item.kmInterval.toLocaleString()} KM`;
    }
    if (item.useDays) {
      return `${item.daysInterval} hari sebelum jatuh tempo`;
    }
    if (item.useKm) {
      return `${item.kmInterval.toLocaleString()} KM sebelum jatuh tempo`;
    }
    return `${item.daysInterval} hari sebelum jatuh tempo`;
  };

  // Handler for toggle automation active
  const toggleAutomationActive = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAutomations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      )
    );
  };

  // Handler for deleting active automation
  const handleDeleteAutomation = (id: string) => {
    const updatedList = automations.filter((item) => item.id !== id);
    setAutomations(updatedList);
    setShowMenu(false);
    if (updatedList.length > 0) {
      setSelectedId(updatedList[0].id);
    }
  };

  // Handler for editing active automation field
  const updateActiveField = (field: keyof AutomationItem, value: any) => {
    setAutomations((prev) =>
      prev.map((item) => {
        if (item.id === selectedId) {
          const updatedItem = { ...item, [field]: value };
          // Update dynamic triggerText as well
          updatedItem.triggerText = getTriggerText(updatedItem);
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Handler for explicitly saving automation
  const handleSaveAutomation = () => {
    if (!activeAutomation) return;
    setSaveNotice(`✓ Automation "${activeAutomation.name}" berhasil disimpan ke Automation Library!`);
    setTimeout(() => {
      setSaveNotice(null);
    }, 3000);
  };

  // Target Customer Toggle
  const toggleTargetCustomer = (tag: string) => {
    const current = activeAutomation.targetCustomers;
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    updateActiveField("targetCustomers", updated);
  };

  // Insert Variable to Template
  const insertVariable = (variableTag: string) => {
    updateActiveField(
      "messageTemplate",
      activeAutomation.messageTemplate + " " + variableTag
    );
  };

  // Filtered automations
  const filteredAutomations = automations.filter((a) => {
    const matchesSearch = a.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCat =
      filterCategory === "all" || a.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* MAIN 3-COLUMN ENTERPRISE AUTOMATION BUILDER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* KOLOM KIRI (30%) - AUTOMATION LIBRARY (Linear Style Compact List) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Automation Library
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                {automations.length} alur automasi terdaftar
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newId = `aut-${Date.now()}`;
                const newItem: AutomationItem = {
                  id: newId,
                  name: "Automation Baru",
                  category: "Servis",
                  triggerText: "14 hari sebelum servis",
                  daysInterval: 14,
                  kmInterval: 2500,
                  useDays: true,
                  useKm: false,
                  isActive: true,
                  targetCustomers: ["semua"],
                  sendTime: "09:00",
                  timezone: "Asia/Jakarta",
                  sendDays: "Senin - Sabtu",
                  skipHolidays: true,
                  retryOnFailure: true,
                  messageTemplate: "Halo {{customer_name}}, ini adalah pesan reminder otomatis.",
                };
                setAutomations((prev) => [newItem, ...prev]);
                setSelectedId(newId);
                setFilterCategory("all");
                setSearchQuery("");
                setSaveNotice(`✓ Automation Baru berhasil ditambahkan ke Library!`);
                setTimeout(() => setSaveNotice(null), 3000);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-emerald-600 text-white shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari automation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
              {["all", "Servis", "Perawatan", "Ban", "Rem"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                    filterCategory === cat
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat === "all" ? "Semua" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Automation List Items */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredAutomations.map((item) => {
              const isSelected = item.id === selectedId;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                    isSelected
                      ? "bg-emerald-50/50 border-[#25D366] shadow-xs ring-1 ring-[#25D366]/30"
                      : "bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-[#128C7E] truncate font-sans">
                          {item.name}
                        </span>
                        {item.isActive ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                            Active
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                            Inactive
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 font-normal truncate">
                        {getTriggerText(item)}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => toggleAutomationActive(item.id, e)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          item.isActive ? "bg-[#25D366]" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            item.isActive ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAutomations.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                Tidak ada automation yang ditemukan.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KOLOM TENGAH (45%) - AUTOMATION BUILDER EDITOR */}
        {/* ========================================================================= */}
        {activeAutomation ? (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6">
            {/* Header Editor */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1 flex-1 min-w-0">
                <input
                  type="text"
                  value={activeAutomation.name}
                  onChange={(e) => updateActiveField("name", e.target.value)}
                  className="text-base font-bold text-slate-900 font-sans border-b border-transparent hover:border-slate-300 focus:border-[#25D366] focus:outline-none bg-transparent w-full truncate"
                />
                <div className="pt-0.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      activeAutomation.isActive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300/80"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {activeAutomation.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Save Button & 3-Dots Dropdown Menu */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveAutomation}
                  className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <>
                      {/* Backdrop dismiss */}
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 font-sans animate-fadeIn text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            updateActiveField("isActive", !activeAutomation.isActive);
                            setShowMenu(false);
                          }}
                          className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
                        >
                          <Power className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {activeAutomation.isActive ? "Nonaktifkan Automation" : "Aktifkan Automation"}
                          </span>
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        <button
                          type="button"
                          onClick={() => handleDeleteAutomation(activeAutomation.id)}
                          className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus Automation</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Save Toast Notice */}
            {saveNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>{saveNotice}</span>
              </div>
            )}

            {/* SECTION 1: TRIGGER REMINDER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Trigger Reminder
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  Pilih metode jatuh tempo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Trigger Hari */}
                <div
                  onClick={() => updateActiveField("useDays", !activeAutomation.useDays)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    activeAutomation.useDays
                      ? "border-[#25D366] bg-emerald-50/30 shadow-2xs"
                      : "border-slate-200/80 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Berdasarkan Hari
                    </span>
                    <input
                      type="checkbox"
                      checked={activeAutomation.useDays}
                      onChange={(e) => updateActiveField("useDays", e.target.checked)}
                      className="rounded text-[#25D366] focus:ring-[#25D366]"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-slate-500">Kirim</span>
                    <input
                      type="number"
                      value={activeAutomation.daysInterval}
                      onChange={(e) =>
                        updateActiveField("daysInterval", Number(e.target.value))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-16 px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                    />
                    <span className="text-xs text-slate-600 font-medium">
                      hari sebelum jatuh tempo
                    </span>
                  </div>
                </div>

                {/* Trigger Kilometer */}
                <div
                  onClick={() => updateActiveField("useKm", !activeAutomation.useKm)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    activeAutomation.useKm
                      ? "border-[#25D366] bg-emerald-50/30 shadow-2xs"
                      : "border-slate-200/80 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-blue-600" />
                      Berdasarkan Kilometer
                    </span>
                    <input
                      type="checkbox"
                      checked={activeAutomation.useKm}
                      onChange={(e) => updateActiveField("useKm", e.target.checked)}
                      className="rounded text-[#25D366] focus:ring-[#25D366]"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-slate-500">Kirim</span>
                    <input
                      type="number"
                      step="500"
                      value={activeAutomation.kmInterval}
                      onChange={(e) =>
                        updateActiveField("kmInterval", Number(e.target.value))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                    />
                    <span className="text-xs text-slate-600 font-medium">
                      KM sebelum jatuh tempo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: TARGET CUSTOMER */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <User className="w-4 h-4 text-emerald-600" />
                Target Customer (Penerima)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: "semua", label: "Semua Pelanggan", desc: "Seluruh kendaraan aktif" },
                  { id: "motor", label: "Hanya Motor", desc: "Pelanggan motor saja" },
                  { id: "mobil", label: "Hanya Mobil", desc: "Pelanggan mobil saja" },
                  { id: "vip", label: "Pelanggan VIP", desc: "Member prioritas VIP" },
                  { id: "aktif", label: "Customer Aktif", desc: "Servis 3 bulan terakhir" },
                ].map((chip) => {
                  const isSelected = activeAutomation.targetCustomers.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggleTargetCustomer(chip.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-[#25D366] bg-emerald-50/50 text-[#128C7E] shadow-2xs font-bold"
                          : "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <div className="text-xs flex items-center justify-between">
                        <span>{chip.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#25D366]" />}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">
                        {chip.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: CUSTOM MESSAGE TEMPLATE EDITOR & VARIABLE PICKER DIRECTLY BELOW IT */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Isi Pesan WhatsApp (Custom Template)
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  Kustomisasi teks pesan
                </span>
              </div>

              {/* Textarea for message template */}
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={activeAutomation.messageTemplate}
                  onChange={(e) => updateActiveField("messageTemplate", e.target.value)}
                  placeholder="Ketik isi pesan WhatsApp di sini..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 font-mono text-xs leading-relaxed text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition-all"
                />
              </div>

              {/* VARIABLE PICKER DIRECTLY BELOW TEXTAREA */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
                    Sisipkan Variabel Dinamis
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Klik tombol untuk menyisipkan ke teks</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">
                      Customer:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["{{customer_name}}", "{{customer_phone}}"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => insertVariable(v)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 text-xs font-mono font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">
                      Kendaraan:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["{{vehicle_name}}", "{{vehicle_plate}}", "{{current_km}}"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => insertVariable(v)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 text-xs font-mono font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">
                      Servis & Bengkel:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{service_name}}",
                        "{{next_service_date}}",
                        "{{workshop_name}}",
                        "{{booking_link}}",
                      ].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => insertVariable(v)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 text-xs font-mono font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: SCHEDULE & DISPATCH */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Clock className="w-4 h-4 text-emerald-600" />
                Waktu Pengiriman (Schedule)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Jam Kirim
                  </label>
                  <input
                    type="time"
                    value={activeAutomation.sendTime}
                    onChange={(e) => updateActiveField("sendTime", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Timezone
                  </label>
                  <select
                    value={activeAutomation.timezone}
                    onChange={(e) => updateActiveField("timezone", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  >
                    <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                    <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                    <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Hari Aktif
                  </label>
                  <select
                    value={activeAutomation.sendDays}
                    onChange={(e) => updateActiveField("sendDays", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  >
                    <option value="Senin - Sabtu">Senin - Sabtu</option>
                    <option value="Setiap Hari">Setiap Hari</option>
                    <option value="Senin - Jumat">Senin - Jumat (Weekday)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeAutomation.skipHolidays}
                    onChange={(e) => updateActiveField("skipHolidays", e.target.checked)}
                    className="rounded text-[#25D366] focus:ring-[#25D366]"
                  />
                  <span>Lewati Hari Libur Nasional</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeAutomation.retryOnFailure}
                    onChange={(e) =>
                      updateActiveField("retryOnFailure", e.target.checked)
                    }
                    className="rounded text-[#25D366] focus:ring-[#25D366]"
                  />
                  <span>Retry Otomatis Jika Gagal</span>
                </label>
              </div>
            </div>

            {/* SECTION 5: ADVANCED RULES (Collapsible Accordion) */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  Advanced Rules (Batas & Anti-Spam)
                </span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showAdvanced && (
                <div className="p-4 mt-2 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Min. Transaksi Terakhir
                      </label>
                      <input
                        type="text"
                        defaultValue="Rp 50.000"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Max. Reminder per Customer
                      </label>
                      <input
                        type="number"
                        defaultValue={2}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Cooldown Interval (Hari)
                      </label>
                      <input
                        type="number"
                        defaultValue={14}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Jam Operasional Kirim
                      </label>
                      <input
                        type="text"
                        defaultValue="08:00 - 17:00"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs font-sans">
            Pilih atau buat automation baru untuk mulai mengkonfigurasi.
          </div>
        )}

        {/* ========================================================================= */}
        {/* KOLOM KANAN (45%) - REALTIME WHATSAPP PREVIEW */}
        {/* ========================================================================= */}
        {activeAutomation && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            {/* Header Preview WhatsApp */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  Preview Pesan WhatsApp
                </h3>
                <p className="text-[11px] text-slate-500">
                  Preview realtime tampilan pesan WhatsApp ke pelanggan.
                </p>
              </div>
            </div>

            {/* REALISTIC WHATSAPP CHAT MOCKUP */}
            <div className="rounded-2xl border border-slate-300 shadow-md overflow-hidden bg-[#E5DDD5]">
              {/* WA Header Bar */}
              <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white text-[#075E54] font-extrabold text-xs flex items-center justify-center border border-white/20">
                    BB
                  </div>
                  <div>
                    <h5 className="text-xs font-bold leading-tight font-sans">
                      POS Bengkel Baik
                    </h5>
                    <span className="text-[10px] text-emerald-200 font-normal">
                      online
                    </span>
                  </div>
                </div>
                <MoreVertical className="w-4 h-4 text-white/80 cursor-pointer" />
              </div>

              {/* WA Chat Wallpaper Body */}
              <div className="p-3.5 space-y-3 min-h-[300px] bg-[radial-[#00000008]_1px,transparent_1px] [background-size:12px_12px]">
                {/* Timestamp divider */}
                <div className="text-center">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/80 text-[10px] font-semibold text-slate-600 shadow-2xs">
                    HARI INI
                  </span>
                </div>

                {/* Message Bubble (WhatsApp White/Light-Green style) */}
                <div className="max-w-[90%] bg-white rounded-lg p-3 text-xs shadow-xs text-slate-800 font-sans leading-relaxed space-y-2 relative ml-auto border-l-4 border-[#25D366]">
                  <p className="whitespace-pre-wrap text-[12px]">
                    {activeAutomation.messageTemplate
                      .replace(/\{\{customer_name\}\}/g, simCustomer.name)
                      .replace(/\{\{vehicle_name\}\}/g, simCustomer.vehicleName)
                      .replace(/\{\{vehicle_plate\}\}/g, simCustomer.vehiclePlate)
                      .replace(/\{\{next_service_date\}\}/g, simDate)
                      .replace(/\{\{current_km\}\}/g, simKm.toLocaleString())}
                  </p>

                  {/* Simulated CTA Button inside WhatsApp message */}
                  <div className="pt-1">
                    <div className="w-full py-2 px-3 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#128C7E] font-bold text-center text-xs cursor-pointer transition-colors flex items-center justify-center gap-1">
                      <span>Booking Servis Sekarang</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Timestamp & Read ticks */}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                    <span>{activeAutomation.sendTime}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                  </div>
                </div>
              </div>

              {/* WA Footer Typing Area */}
              <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2 border-t border-slate-200">
                <input
                  type="text"
                  disabled
                  placeholder="Ketik pesan..."
                  className="flex-1 px-3 py-1.5 rounded-full bg-white text-xs border border-slate-200 text-slate-400 cursor-not-allowed"
                />
                <div className="w-7 h-7 rounded-full bg-[#128C7E] text-white flex items-center justify-center shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
