"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Send,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  User,
  Zap,
  CheckCheck,
  Sparkles,
  ArrowRight,
  Trash2,
  Power,
  Check,
  ShieldCheck,
  MessageSquare,
  Save,
  FileText,
  Layers,
  X,
  Copy,
  Info,
  Award,
  Wrench,
  DollarSign,
  Calendar,
} from "lucide-react";

export interface TemplateItem {
  id: string;
  title: string;
  category:
    | "Pekerjaan Masuk"
    | "Selesai Servis"
    | "Pembayaran"
    | "Reminder"
    | "Follow Up"
    | "Promosi";
  status: "Draft" | "Published" | "Archived";
  triggerEvent: string;
  targetRecipients: string[];
  deliveryTiming: "direct" | "delay";
  delayMinutes: number;
  conditions: {
    onlyFromBooking: boolean;
    operationalHoursOnly: boolean;
    attachPdfInvoice: boolean;
  };
  content: string;
}

interface SampleCustomerData {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleName: string;
  vehiclePlate: string;
  woNumber: string;
  woDate: string;
  serviceName: string;
  mechanicName: string;
  invoiceNumber: string;
  totalAmount: string;
}

export const NotificationTemplatesTab: React.FC = () => {
  // Sample Customers Data for Realtime WhatsApp Preview
  const sampleCustomers: SampleCustomerData[] = [
    {
      id: "s1",
      customerName: "Budi Santoso",
      customerPhone: "+62 812-3456-7890",
      vehicleName: "Honda Vario 125",
      vehiclePlate: "B 1234 ABC",
      woNumber: "WO-250701-001",
      woDate: "1 Juli 2026",
      serviceName: "Servis Berkala & Ganti Oli",
      mechanicName: "Agus Prasetyo",
      invoiceNumber: "INV-2026-0891",
      totalAmount: "Rp 350.000",
    },
    {
      id: "s2",
      customerName: "Siti Aminah",
      customerPhone: "+62 813-9876-5432",
      vehicleName: "Toyota Avanza Veloz",
      vehiclePlate: "B 9876 XYZ",
      woNumber: "WO-250701-004",
      woDate: "2 Juli 2026",
      serviceName: "Tune Up & Engine Flush",
      mechanicName: "Bambang M.",
      invoiceNumber: "INV-2026-0895",
      totalAmount: "Rp 850.000",
    },
    {
      id: "s3",
      customerName: "Rudi Hermawan",
      customerPhone: "+62 857-1122-3344",
      vehicleName: "Yamaha NMAX 155",
      vehiclePlate: "D 4567 LMN",
      woNumber: "WO-250701-009",
      woDate: "3 Juli 2026",
      serviceName: "Ganti Kanvas Rem & CVT",
      mechanicName: "Dedi Kurniawan",
      invoiceNumber: "INV-2026-0899",
      totalAmount: "Rp 420.000",
    },
  ];

  // Initial Templates List State
  const [templates, setTemplates] = useState<TemplateItem[]>([
    {
      id: "tpl-1",
      title: "Work Order Baru Dibuat",
      category: "Pekerjaan Masuk",
      status: "Published",
      triggerEvent: "Work Order Dibuat",
      targetRecipients: ["customer", "teknisi"],
      deliveryTiming: "direct",
      delayMinutes: 0,
      conditions: {
        onlyFromBooking: false,
        operationalHoursOnly: true,
        attachPdfInvoice: false,
      },
      content:
        "Halo Bpk/Ibu {{customer_name}},\n\nWork Order baru dengan nomor #{{wo_number}} untuk kendaraan {{vehicle_plate}} telah dibuat pada {{wo_date}}.\n\nTeknisi kami ({{mechanic_name}}) akan segera memproses kendaraan Anda.\n\nTerima kasih,\n{{workshop_name}}",
    },
    {
      id: "tpl-2",
      title: "Pekerjaan Selesai (Unit Ready)",
      category: "Selesai Servis",
      status: "Published",
      triggerEvent: "Status Work Order → COMPLETED",
      targetRecipients: ["customer"],
      deliveryTiming: "direct",
      delayMinutes: 0,
      conditions: {
        onlyFromBooking: false,
        operationalHoursOnly: true,
        attachPdfInvoice: false,
      },
      content:
        "Halo Bpk/Ibu {{customer_name}},\n\nPengerjaan kendaraan {{vehicle_plate}} untuk {{service_name}} telah SELESAI. Kendaraan siap untuk diambil.\n\nTotal Estimasi Biaya: {{total_amount}}\n\nTerima kasih atas kepercayaan Anda di {{workshop_name}}!",
    },
    {
      id: "tpl-3",
      title: "Kirim Invoice & Bukti Pembayaran",
      category: "Pembayaran",
      status: "Published",
      triggerEvent: "Transaksi Pelunasan Invoice",
      targetRecipients: ["customer", "owner"],
      deliveryTiming: "direct",
      delayMinutes: 0,
      conditions: {
        onlyFromBooking: false,
        operationalHoursOnly: false,
        attachPdfInvoice: true,
      },
      content:
        "Halo Bpk/Ibu {{customer_name}},\n\nPembayaran invoice #{{invoice_number}} sebesar {{total_amount}} untuk kendaraan {{vehicle_plate}} telah berhasil kami terima. Berikut bukti pembayaran resmi dari {{workshop_name}}.",
    },
    {
      id: "tpl-4",
      title: "Reminder Servis Berkala",
      category: "Reminder",
      status: "Published",
      triggerEvent: "Otomatis Scheduler Reminder (30 Hari / 3.000 KM)",
      targetRecipients: ["customer"],
      deliveryTiming: "delay",
      delayMinutes: 0,
      conditions: {
        onlyFromBooking: false,
        operationalHoursOnly: true,
        attachPdfInvoice: false,
      },
      content:
        "Halo Bpk/Ibu {{customer_name}},\n\nJangan lupa servis berkala kendaraan {{vehicle_name}} ({{vehicle_plate}}). Jadwal servis berikutnya: {{next_service_date}}.\n\nKlik tombol di bawah untuk booking servis:",
    },
    {
      id: "tpl-5",
      title: "Follow Up Setelah Servis",
      category: "Follow Up",
      status: "Archived",
      triggerEvent: "3 Hari Setelah Servis Selesai",
      targetRecipients: ["customer"],
      deliveryTiming: "delay",
      delayMinutes: 4320,
      conditions: {
        onlyFromBooking: false,
        operationalHoursOnly: true,
        attachPdfInvoice: false,
      },
      content:
        "Halo Bpk/Ibu {{customer_name}},\n\nTerima kasih sudah melakukan servis di {{workshop_name}}. Bagaimana performa kendaraan {{vehicle_plate}} Anda setelah dilakukan {{service_name}}?",
    },
    {
      id: "tpl-6",
      title: "Promosi & Penawaran Paket",
      category: "Promosi",
      status: "Draft",
      triggerEvent: "Manual Campaign Dispatch",
      targetRecipients: ["customer"],
      deliveryTiming: "direct",
      delayMinutes: 0,
      conditions: {
        onlyFromBooking: false,
        operationalHoursOnly: true,
        attachPdfInvoice: false,
      },
      content:
        "Halo {{customer_name}},\n\nDapatkan diskon spesial 20% untuk paket Tune Up & Ganti Oli di {{workshop_name}} khusus minggu ini!",
    },
  ]);


  // Selected Item & Filter States
  const [selectedId, setSelectedId] = useState<string>("tpl-1");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showMenu, setShowMenu] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Sample Customer Preview Selection State
  const [selectedSample, setSelectedSample] = useState<SampleCustomerData>(
    sampleCustomers[0]
  );

  // Modal "+ Tambah Template" State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] =
    useState<TemplateItem["category"]>("Pekerjaan Masuk");
  const [newTrigger, setNewTrigger] = useState("Work Order Dibuat");

  // Active Template Item
  const activeTemplate =
    templates.find((t) => t.id === selectedId) || templates[0];

  // Helper for updating active template field
  const updateActiveField = (field: keyof TemplateItem, value: any) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === selectedId ? { ...t, [field]: value } : t))
    );
  };

  // Helper for nested conditions update
  const updateConditionField = (
    key: keyof TemplateItem["conditions"],
    value: boolean
  ) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id === selectedId) {
          return {
            ...t,
            conditions: {
              ...t.conditions,
              [key]: value,
            },
          };
        }
        return t;
      })
    );
  };

  // Target Recipient Toggle
  const toggleRecipient = (recipient: string) => {
    const current = activeTemplate.targetRecipients;
    const updated = current.includes(recipient)
      ? current.filter((r) => r !== recipient)
      : [...current, recipient];
    updateActiveField("targetRecipients", updated);
  };

  // Insert Variable to Content
  const insertVariable = (variableTag: string) => {
    updateActiveField("content", activeTemplate.content + " " + variableTag);
  };

  // Create New Template via Modal
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newId = `tpl-${Date.now()}`;
    const newItem: TemplateItem = {
      id: newId,
      title: newTitle,
      category: newCategory,
      status: "Draft",
      triggerEvent: newTrigger,
      targetRecipients: ["customer"],
      deliveryTiming: "direct",
      delayMinutes: 0,
      conditions: {
        onlyFromBooking: false,
        operationalHoursOnly: true,
        attachPdfInvoice: false,
      },
      content: `Halo {{customer_name}},\n\nIni adalah template pesan untuk ${newTitle}.\n\nTerima kasih,\n{{workshop_name}}`,
    };

    setTemplates((prev) => [newItem, ...prev]);
    setSelectedId(newId);
    setShowAddModal(false);
    setNewTitle("");
    setFilterCategory("all");
    setFilterStatus("all");
    setSearchQuery("");
    setSaveNotice(`✓ Template "${newItem.title}" berhasil dibuat!`);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // Delete Template
  const handleDeleteTemplate = (id: string) => {
    const updatedList = templates.filter((t) => t.id !== id);
    setTemplates(updatedList);
    setShowMenu(false);
    if (updatedList.length > 0) {
      setSelectedId(updatedList[0].id);
    }
  };

  // Save Template Notification
  const handleSaveTemplate = () => {
    setSaveNotice(
      `✓ Template "${activeTemplate.title}" berhasil disimpan!`
    );
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // Filtered Templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      filterCategory === "all" ||
      t.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesStat =
      filterStatus === "all" ||
      t.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesCat && matchesStat;
  });

  // Calculate used variables count & score
  const allVars = [
    "{{customer_name}}",
    "{{customer_phone}}",
    "{{vehicle_name}}",
    "{{vehicle_plate}}",
    "{{wo_number}}",
    "{{wo_date}}",
    "{{invoice_number}}",
    "{{total_amount}}",
    "{{service_name}}",
    "{{mechanic_name}}",
    "{{workshop_name}}",
    "{{booking_link}}",
  ];
  const usedVars = allVars.filter((v) => activeTemplate.content.includes(v));
  const qualityScore = Math.min(100, 40 + usedVars.length * 12);

  // Helper for category badge styles
  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case "Pekerjaan Masuk":
        return "bg-emerald-50 text-[#128C7E] border-emerald-200";
      case "Selesai Servis":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Pembayaran":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Reminder":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Follow Up":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Promosi":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Helper for category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Pekerjaan Masuk":
        return <Wrench className="w-4 h-4 text-emerald-600" />;
      case "Selesai Servis":
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case "Pembayaran":
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      case "Reminder":
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case "Follow Up":
        return <Clock className="w-4 h-4 text-indigo-600" />;
      case "Promosi":
        return <Sparkles className="w-4 h-4 text-rose-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* 3-COLUMN ENTERPRISE TEMPLATE BUILDER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* KOLOM KIRI (30%) - TEMPLATE LIBRARY (Search, Filter, Compact List) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
                Template Library
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                {templates.length} template pesan terdaftar
              </p>
            </div>

            {/* Modal Trigger Button */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-emerald-600 text-white shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {/* Search, Category & Status Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] bg-slate-50/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
              >
                <option value="all">Semua Kategori</option>
                <option value="Pekerjaan Masuk">Pekerjaan Masuk</option>
                <option value="Selesai Servis">Selesai Servis</option>
                <option value="Pembayaran">Pembayaran</option>
                <option value="Reminder">Reminder</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Promosi">Promosi</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
              >
                <option value="all">Semua Status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Compact Template Items List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredTemplates.map((item) => {
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
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${getCategoryBadgeStyle(
                        item.category
                      )}`}
                    >
                      {getCategoryIcon(item.category)}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-[#128C7E] truncate font-sans">
                          {item.title}
                        </span>
                        {item.status === "Published" && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                            Aktif
                          </span>
                        )}
                        {item.status === "Draft" && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                            Draft
                          </span>
                        )}
                        {item.status === "Archived" && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                            Archived
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 font-normal line-clamp-1">
                        {item.content}
                      </p>

                      <div className="flex items-center gap-2 pt-0.5">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold border ${getCategoryBadgeStyle(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTemplates.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400 font-normal">
                Tidak ada template yang sesuai filter.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KOLOM TENGAH (45%) - TEMPLATE BUILDER EDITOR */}
        {/* ========================================================================= */}
        {activeTemplate ? (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6">
            {/* Header Editor */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1 flex-1 min-w-0">
                <input
                  type="text"
                  value={activeTemplate.title}
                  onChange={(e) => updateActiveField("title", e.target.value)}
                  className="text-base font-bold text-slate-900 font-sans border-b border-transparent hover:border-slate-300 focus:border-[#25D366] focus:outline-none bg-transparent w-full truncate"
                />
                <div className="flex items-center gap-2 pt-0.5">
                  <select
                    value={activeTemplate.status}
                    onChange={(e) =>
                      updateActiveField(
                        "status",
                        e.target.value as TemplateItem["status"]
                      )
                    }
                    className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  >
                    <option value="Published">Status: Published (Aktif)</option>
                    <option value="Draft">Status: Draft</option>
                    <option value="Archived">Status: Archived (Nonaktif)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons: Save Button & 3-Dots Dropdown Menu */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveTemplate}
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
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 font-sans animate-fadeIn text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            const newId = `tpl-${Date.now()}`;
                            const duplicated: TemplateItem = {
                              ...activeTemplate,
                              id: newId,
                              title: `${activeTemplate.title} (Copy)`,
                            };
                            setTemplates((prev) => [duplicated, ...prev]);
                            setSelectedId(newId);
                            setShowMenu(false);
                          }}
                          className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Duplikat Template</span>
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(activeTemplate.id)}
                          className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus Template</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Save Notice Banner */}
            {saveNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>{saveNotice}</span>
              </div>
            )}

            {/* SECTION 1: TRIGGER EVENT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Trigger / Kapan Dikirim
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  Aturan pemicu otomatis
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#128C7E] flex items-center justify-center shrink-0 border border-emerald-200">
                    <Zap className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Trigger Utama
                    </span>
                    <select
                      value={activeTemplate.triggerEvent}
                      onChange={(e) =>
                        updateActiveField("triggerEvent", e.target.value)
                      }
                      className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer mt-0.5"
                    >
                      <option value="Work Order Dibuat">
                        Work Order Dibuat
                      </option>
                      <option value="Status Work Order → COMPLETED">
                        Status Work Order → COMPLETED
                      </option>
                      <option value="Transaksi Pelunasan Invoice">
                        Transaksi Pelunasan Invoice
                      </option>
                      <option value="Otomatis Scheduler Reminder (30 Hari / 3.000 KM)">
                        Otomatis Scheduler Reminder (30 Hari / 3.000 KM)
                      </option>
                      <option value="3 Hari Setelah Servis Selesai">
                        3 Hari Setelah Servis Selesai
                      </option>
                      <option value="Manual Campaign Dispatch">
                        Manual Campaign Dispatch
                      </option>
                    </select>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Otomatis
                </span>
              </div>
            </div>

            {/* SECTION 2: TARGET RECIPIENTS */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <User className="w-4 h-4 text-emerald-600" />
                Target Penerima Pesan
              </h4>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: "customer", label: "Customer (Pelanggan)" },
                  { id: "teknisi", label: "Teknisi Penanggung Jawab" },
                  { id: "owner", label: "Owner / Manager" },
                  { id: "kasir", label: "Kasir Bengkel" },
                ].map((chip) => {
                  const isSelected =
                    activeTemplate.targetRecipients.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggleRecipient(chip.id)}
                      className={`px-3 py-2 rounded-xl border text-xs transition-all ${
                        isSelected
                          ? "border-[#25D366] bg-emerald-50/50 text-[#128C7E] shadow-2xs font-bold"
                          : "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {chip.label}
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#25D366]" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: KONDISI TAMBAHAN (OPSIONAL) */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Kondisi Tambahan (Opsional)
              </h4>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={activeTemplate.conditions.onlyFromBooking}
                    onChange={(e) =>
                      updateConditionField("onlyFromBooking", e.target.checked)
                    }
                    className="rounded text-[#25D366] focus:ring-[#25D366]"
                  />
                  <span>Hanya jika pekerjaan berasal dari booking online</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={activeTemplate.conditions.operationalHoursOnly}
                    onChange={(e) =>
                      updateConditionField(
                        "operationalHoursOnly",
                        e.target.checked
                      )
                    }
                    className="rounded text-[#25D366] focus:ring-[#25D366]"
                  />
                  <span>Kirim hanya pada jam operasional bengkel (08:00 - 17:00)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={activeTemplate.conditions.attachPdfInvoice}
                    onChange={(e) =>
                      updateConditionField("attachPdfInvoice", e.target.checked)
                    }
                    className="rounded text-[#25D366] focus:ring-[#25D366]"
                  />
                  <span>Sertakan lampiran file PDF Invoice / Bukti Servis</span>
                </label>
              </div>
            </div>

            {/* SECTION 4: ISI PESAN WHATSAPP TEMPLATE & VARIABLE PICKER */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Isi Pesan WhatsApp
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeTemplate.content.length} karakter • {usedVars.length} variabel
                </span>
              </div>

              {/* Textarea for message template */}
              <div className="space-y-2">
                <textarea
                  rows={7}
                  value={activeTemplate.content}
                  onChange={(e) => updateActiveField("content", e.target.value)}
                  placeholder="Ketik isi pesan WhatsApp di sini..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 font-mono text-xs leading-relaxed text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition-all"
                />
              </div>

              {/* GROUPED VARIABLE PICKER DIRECTLY BELOW TEXTAREA */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
                    Sisipkan Variabel Dinamis
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Klik variabel untuk menyisipkan
                  </span>
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
                      Vehicle & Work Order:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{vehicle_name}}",
                        "{{vehicle_plate}}",
                        "{{wo_number}}",
                        "{{wo_date}}",
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

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">
                      Invoice, Service & Workshop:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{invoice_number}}",
                        "{{total_amount}}",
                        "{{service_name}}",
                        "{{mechanic_name}}",
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

            {/* SECTION 5: MESSAGE QUALITY & PERSONALIZATION SCORE */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Tips Personalisasi & Message Quality
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  {usedVars.length} dari {allVars.length} variabel digunakan
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                Gunakan variabel dinamis untuk membuat pesan lebih personal dan meningkatkan engagement serta kepuasan pelanggan.
              </p>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className="bg-[#25D366] h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(20, (usedVars.length / 8) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const first = templates[0];
                  if (first) setSelectedId(first.id);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveTemplate}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-emerald-600 text-white shadow-md shadow-[#25D366]/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Template</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs font-sans">
            Pilih atau buat template baru untuk mulai mengkonfigurasi.
          </div>
        )}

        {/* ========================================================================= */}
        {/* KOLOM KANAN (45%) - REALTIME WHATSAPP PREVIEW WITH SAMPLE DATA SELECTOR */}
        {/* ========================================================================= */}
        {activeTemplate && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            {/* Header Preview WhatsApp */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  Preview WhatsApp
                </h3>
                <p className="text-[11px] text-slate-500">
                  Lihat tampilan pesan yang akan diterima pelanggan.
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
                <div className="max-w-[92%] bg-white rounded-lg p-3 text-xs shadow-xs text-slate-800 font-sans leading-relaxed space-y-2 relative ml-auto border-l-4 border-[#25D366]">
                  <p className="whitespace-pre-wrap text-[12px]">
                    {activeTemplate.content
                      .replace(/\{\{customer_name\}\}/g, selectedSample.customerName)
                      .replace(/\{\{customer_phone\}\}/g, selectedSample.customerPhone)
                      .replace(/\{\{vehicle_name\}\}/g, selectedSample.vehicleName)
                      .replace(/\{\{vehicle_plate\}\}/g, selectedSample.vehiclePlate)
                      .replace(/\{\{wo_number\}\}/g, selectedSample.woNumber)
                      .replace(/\{\{wo_date\}\}/g, selectedSample.woDate)
                      .replace(/\{\{invoice_number\}\}/g, selectedSample.invoiceNumber)
                      .replace(/\{\{total_amount\}\}/g, selectedSample.totalAmount)
                      .replace(/\{\{service_name\}\}/g, selectedSample.serviceName)
                      .replace(/\{\{mechanic_name\}\}/g, selectedSample.mechanicName)
                      .replace(/\{\{workshop_name\}\}/g, "POS Bengkel Baik")
                      .replace(/\{\{booking_link\}\}/g, "https://bengkelbaik.id/booking")}
                  </p>

                  {/* Simulated CTA Button inside WhatsApp message */}
                  <div className="pt-1">
                    <div className="w-full py-2 px-3 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#128C7E] font-bold text-center text-xs cursor-pointer transition-colors flex items-center justify-center gap-1">
                      <span>Proses Transaksi Servis</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Timestamp & Read ticks */}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                    <span>09:00</span>
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

            {/* PREVIEW DENGAN DATA CONTOH SELECTOR */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Preview Dengan Data Contoh
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedSample.id}
                  onChange={(e) => {
                    const sample = sampleCustomers.find(
                      (s) => s.id === e.target.value
                    );
                    if (sample) setSelectedSample(sample);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                >
                  {sampleCustomers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.customerName} - {s.vehiclePlate} ({s.vehicleName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: TAMBAH TEMPLATE BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setShowAddModal(false)}
          />

          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5 z-10 animate-scaleUp font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#128C7E] flex items-center justify-center border border-emerald-200">
                  <FileText className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-sans">
                    Tambah Template Notifikasi Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Buat aturan pemicu dan template pesan otomatis baru.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Template
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Estimasi Biaya Perbaikan"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori Template
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as TemplateItem["category"])
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
                  >
                    <option value="Pekerjaan Masuk">Pekerjaan Masuk</option>
                    <option value="Selesai Servis">Selesai Servis</option>
                    <option value="Pembayaran">Pembayaran</option>
                    <option value="Reminder">Reminder</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Promosi">Promosi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Trigger Utama
                  </label>
                  <select
                    value={newTrigger}
                    onChange={(e) => setNewTrigger(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366]"
                  >
                    <option value="Work Order Dibuat">Work Order Dibuat</option>
                    <option value="Status Work Order → COMPLETED">
                      Status Work Order → COMPLETED
                    </option>
                    <option value="Transaksi Pelunasan Invoice">
                      Transaksi Pelunasan Invoice
                    </option>
                    <option value="Otomatis Scheduler Reminder">
                      Otomatis Scheduler Reminder
                    </option>
                    <option value="3 Hari Setelah Servis Selesai">
                      3 Hari Setelah Servis Selesai
                    </option>
                    <option value="Manual Campaign Dispatch">
                      Manual Campaign Dispatch
                    </option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold bg-[#25D366] hover:bg-emerald-600 text-white shadow-md shadow-[#25D366]/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
