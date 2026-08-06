"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Info,
  ShieldCheck,
  Target,
  DollarSign,
  PiggyBank,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Send,
  X,
  Bot,
  User,
} from "lucide-react";
import { api } from "@/lib/api";

export interface AiHighlightMetric {
  current?: number | null;
  previous?: number | null;
  changePercent?: number | null;
}

export interface AiHighlightItem {
  type: "positive" | "warning" | "opportunity";
  title: string;
  description: string;
  metric?: AiHighlightMetric;
}

export interface AiRecommendation {
  title: string;
  description: string;
  actionLabel?: string | null;
  actionTarget?: string | null;
}

export interface PriorityActionWhy {
  summary: string;
  evidence: string[];
}

export interface PriorityActionItem {
  priority: number;
  title: string;
  description: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  estimatedRevenue?: number;
  estimatedSaving?: number;
  reason: string;
  actionLabel: string;
  actionTarget?: string | null;
  why?: PriorityActionWhy;
}

export interface ExplanationEvidence {
  label: string;
  value: string;
  interpretation: string;
}

export interface ExplanationData {
  title: string;
  summary: string;
  evidence: ExplanationEvidence[];
}

export interface AiDataQuality {
  status: "SUFFICIENT" | "LIMITED" | "INSUFFICIENT";
  note?: string | null;
}

export interface AiInsightResponseData {
  summary: string;
  highlights: AiHighlightItem[];
  recommendation: AiRecommendation;
  priorityActions?: PriorityActionItem[];
  explanation?: ExplanationData;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  dataQuality: AiDataQuality;
}

interface AiBusinessInsightCardProps {
  filters: {
    startDate: string | null;
    endDate: string | null;
  };
}

export const AiBusinessInsightCard: React.FC<AiBusinessInsightCardProps> = ({
  filters,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AiInsightResponseData | null>(null);
  const [showMainExplanation, setShowMainExplanation] = useState<boolean>(false);
  const [openActionWhy, setOpenActionWhy] = useState<Record<number, boolean>>({});

  // AI Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isChatRendered, setIsChatRendered] = useState<boolean>(false);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);
  const [chatQuestion, setChatQuestion] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      citations?: string[];
      confidence?: string;
      usedFallback?: boolean;
    }>
  >([]);

  useEffect(() => {
    let animFrame: number;
    let timeout: NodeJS.Timeout;

    if (isChatOpen) {
      setIsChatRendered(true);
      animFrame = requestAnimationFrame(() => {
        animFrame = requestAnimationFrame(() => {
          setIsChatVisible(true);
        });
      });
    } else {
      setIsChatVisible(false);
      timeout = setTimeout(() => {
        setIsChatRendered(false);
      }, 300);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (timeout) clearTimeout(timeout);
    };
  }, [isChatOpen]);

  const suggestedPrompts = [
    "Mengapa pendapatan turun?",
    "Mengapa pelanggan inaktif?",
    "Servis apa yang sebaiknya dipromosikan?",
    "Bagaimana cara menaikkan omzet?",
    "Inventaris mana yang perlu perhatian?",
  ];

  const toggleActionWhy = (priority: number) => {
    setOpenActionWhy((prev) => ({ ...prev, [priority]: !prev[priority] }));
  };

  const handleSendChat = async (overrideQuestion?: string) => {
    const q = (overrideQuestion || chatQuestion).trim();
    if (!q || chatLoading) return;

    const newMessages = [...chatMessages, { role: "user" as const, content: q }];
    setChatMessages(newMessages);
    setChatQuestion("");
    setChatLoading(true);

    try {
      const historyPayload = newMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post<any>("/api/reports/ai-chat", {
        question: q,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        history: historyPayload,
      });

      const resData = res?.data || res;
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: resData.answer || "Tidak ada respon dari AI.",
          citations: resData.citations || [],
          confidence: resData.confidence || "MEDIUM",
          usedFallback: resData.usedFallback || false,
        },
      ]);
    } catch (err: any) {
      console.error("[AiBusinessInsightCard] Chat failed:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err.message || "Gagal mendapatkan jawaban dari AI.",
          confidence: "LOW",
          usedFallback: true,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchInsight = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get<any>("/api/reports/ai-insight", {
        params,
      });

      const insightData = res?.data || res;
      setData(insightData);
    } catch (err: any) {
      console.error("[AiBusinessInsightCard] Failed to fetch insight:", err);
      setError(err.message || "Gagal memuat analisis bisnis AI");
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  // Render Skeleton Loading State
  if (loading) {
    return (
      <div className="border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-white to-slate-50/40 rounded-2xl p-6 shadow-xs space-y-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-6 w-6 bg-indigo-200/80 rounded-lg"></div>
            <div className="h-5 w-44 bg-slate-200 rounded-md"></div>
          </div>
          <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
        </div>
        <div className="h-10 w-full bg-slate-200/70 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-200/60 rounded-xl"></div>
          <div className="h-24 bg-slate-200/60 rounded-xl"></div>
          <div className="h-24 bg-slate-200/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="border border-rose-200/80 bg-rose-50/40 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-rose-900">Gagal Memuat Analisis AI</h4>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchInsight}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Coba Lagi</span>
        </button>
      </div>
    );
  }

  // Render Empty State if data is missing or empty
  if (!data || (!data.summary && (!data.highlights || data.highlights.length === 0))) {
    return (
      <div className="border border-slate-200/80 bg-slate-50/50 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
        <div className="p-3 bg-slate-100 text-slate-500 rounded-full">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Belum Ada Analisis AI</h4>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Data transaksi atau laporan bisnis belum cukup untuk menghasilkan analisis bisnis AI pada rentang tanggal ini.
          </p>
        </div>
        <button
          onClick={fetchInsight}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Muat Ulang Data</span>
        </button>
      </div>
    );
  }

  const isInsufficient = data.dataQuality?.status === "INSUFFICIENT" || data.dataQuality?.status === "LIMITED";

  // Helper for Highlight Badge styles
  const getHighlightBadge = (type: AiHighlightItem["type"]) => {
    switch (type) {
      case "positive":
        return {
          cardBg: "bg-emerald-50/60 border-emerald-200/70",
          iconBg: "bg-emerald-100 text-emerald-700",
          titleColor: "text-emerald-950",
          descColor: "text-emerald-800",
          icon: TrendingUp,
        };
      case "warning":
        return {
          cardBg: "bg-amber-50/60 border-amber-200/70",
          iconBg: "bg-amber-100 text-amber-700",
          titleColor: "text-amber-950",
          descColor: "text-amber-800",
          icon: AlertTriangle,
        };
      case "opportunity":
      default:
        return {
          cardBg: "bg-indigo-50/60 border-indigo-200/70",
          iconBg: "bg-indigo-100 text-indigo-700",
          titleColor: "text-indigo-950",
          descColor: "text-indigo-800",
          icon: Lightbulb,
        };
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "HIGH":
        return { label: "Confidence: High", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "MEDIUM":
        return { label: "Confidence: Medium", color: "bg-amber-100 text-amber-800 border-amber-200" };
      case "LOW":
      default:
        return { label: "Confidence: Low", color: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const confBadge = getConfidenceBadge(data.confidence);

  return (
    <div className="border border-indigo-100/90 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/50 rounded-2xl p-6 shadow-xs space-y-6 transition-all">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-100/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-lg shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">AI Business Insight</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-100/80 text-indigo-700 rounded-md">
                Executive
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsChatOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Tanya AI</span>
          </button>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${confBadge.color}`}>
            {confBadge.label}
          </span>
          <button
            onClick={fetchInsight}
            title="Muat Ulang Analisis AI"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="bg-white/80 border border-slate-200/60 rounded-xl p-4 shadow-2xs">
        <p className="text-sm text-slate-800 font-medium leading-relaxed">
          {data.summary}
        </p>
      </div>

      {/* Insufficient Data Banner if applicable */}
      {isInsufficient && (
        <div className="flex items-start space-x-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            {data.dataQuality?.note || "Data transaksi pada rentang tanggal ini masih terbatas. Tambahkan Work Order dan pembayaran baru untuk memperoleh rekomendasi bisnis yang lebih akurat."}
          </span>
        </div>
      )}

      {/* Highlights Grid (Max 3 items) */}
      {data.highlights && data.highlights.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sorotan Utama Bisnis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.highlights.map((item, index) => {
              const style = getHighlightBadge(item.type);
              const IconComp = style.icon;

              return (
                <div
                  key={index}
                  className={`border rounded-xl p-4 flex items-start space-x-3 transition-all ${style.cardBg}`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${style.iconBg}`}>
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className={`text-xs font-bold leading-tight ${style.titleColor}`}>
                      {item.title}
                    </h5>
                    <p className={`text-xs mt-1 leading-snug ${style.descColor}`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendation Box (Single Priority Action) */}
      {data.recommendation && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center space-x-2 text-indigo-300">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Rekomendasi Utama</span>
            </div>
            <h4 className="text-base font-semibold text-white tracking-tight">
              {data.recommendation.title}
            </h4>
            <p className="text-xs text-slate-300 leading-normal">
              {data.recommendation.description}
            </p>
          </div>

          {data.recommendation.actionTarget && (
            <Link
              href={data.recommendation.actionTarget}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <span>{data.recommendation.actionLabel || "Jalankan Aksi"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Main Explanation Collapsible Section */}
      {data.explanation && (
        <div className="space-y-2 pt-1">
          <button
            onClick={() => setShowMainExplanation(!showMainExplanation)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{data.explanation.title || "Mengapa AI memberikan rekomendasi ini?"}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showMainExplanation ? "rotate-180" : ""}`} />
          </button>

          {showMainExplanation && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3 text-xs text-slate-800">
              <p className="font-medium leading-relaxed">{data.explanation.summary}</p>
              {data.explanation.evidence && data.explanation.evidence.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                  {data.explanation.evidence.map((ev, idx) => (
                    <div key={idx} className="bg-white border border-indigo-100/80 p-2.5 rounded-lg space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-slate-700 text-[11px]">{ev.label}</span>
                        <span className="font-bold text-indigo-600 text-[11px] bg-indigo-50 px-1.5 py-0.5 rounded">{ev.value}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 leading-snug">{ev.interpretation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Today's Priority Actions Section */}
      {data.priorityActions && data.priorityActions.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-200/60">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Tindakan Prioritas Hari Ini
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.priorityActions.map((action) => {
              const impactBadge =
                action.impact === "HIGH"
                  ? "bg-rose-100 text-rose-800 border-rose-200"
                  : action.impact === "MEDIUM"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200";

              const circledNum = ["①", "②", "③"][action.priority - 1] || `${action.priority}`;

              return (
                <div
                  key={action.priority}
                  className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-extrabold text-indigo-600">{circledNum}</span>
                        <h5 className="text-sm font-semibold text-slate-900 leading-snug">
                          {action.title}
                        </h5>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${impactBadge}`}>
                        {action.impact}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {action.description}
                    </p>

                    {((action.estimatedRevenue !== undefined && action.estimatedRevenue !== null) ||
                    (action.estimatedSaving !== undefined && action.estimatedSaving !== null)) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {action.estimatedRevenue !== undefined && action.estimatedRevenue !== null && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            <DollarSign className="h-3 w-3 text-emerald-600" />
                            <span>Potensi Omzet: Rp {action.estimatedRevenue.toLocaleString("id-ID")}</span>
                          </span>
                        )}
                        {action.estimatedSaving !== undefined && action.estimatedSaving !== null && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            <PiggyBank className="h-3 w-3 text-blue-600" />
                            <span>Estimasi Hemat: Rp {action.estimatedSaving.toLocaleString("id-ID")}</span>
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      Alasan: {action.reason}
                    </p>

                    {action.why && (
                      <div className="pt-1">
                        <button
                          onClick={() => toggleActionWhy(action.priority)}
                          className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                        >
                          <span>{openActionWhy[action.priority] ? "▲ Sembunyikan Mengapa" : "▼ Explain Why"}</span>
                        </button>
                        {openActionWhy[action.priority] && (
                          <div className="mt-2 p-2.5 bg-indigo-50/40 border border-indigo-100 rounded-lg text-[11px] text-slate-700 space-y-1.5">
                            <p className="font-semibold text-slate-900 leading-snug">{action.why.summary}</p>
                            {action.why.evidence && action.why.evidence.length > 0 && (
                              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                                {action.why.evidence.map((ev, eIdx) => (
                                  <li key={eIdx}>{ev}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {action.actionTarget && (
                    <Link
                      href={action.actionTarget}
                      className="inline-flex items-center justify-between px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors w-full cursor-pointer mt-2"
                    >
                      <span>{action.actionLabel || "Lihat Halaman"}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Business Assistant Chat Drawer — Full-screen Side Panel */}
      {isChatRendered && typeof window !== "undefined" && createPortal(
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out ${
              isChatVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsChatOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className={`fixed top-0 right-0 z-[61] h-screen w-full max-w-[420px] flex flex-col bg-white shadow-2xl border-l border-slate-200/80 transition-transform duration-300 ease-in-out ${
              isChatVisible ? "translate-x-0" : "translate-x-full"
            }`}
          >

            {/* ── Header ── */}
            <div className="flex-none px-5 py-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-none w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white leading-tight">AI Business Assistant</h3>
                    <p className="text-[11px] text-indigo-300 mt-0.5">Tanyakan apapun tentang laporan ini</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* ── Chat Body ── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 space-y-4 text-[13px]">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-5 text-center px-2">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shadow-inner">
                    <Sparkles className="h-7 w-7 text-indigo-500" />
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Ada yang ingin Anda tanyakan?</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mt-1 max-w-[280px] mx-auto">
                      Asisten AI dapat menjelaskan tren omzet, pelanggan inaktif, dan prioritas stok barang berdasarkan data laporan saat ini.
                    </p>
                  </div>

                  {/* Suggested Prompts */}
                  <div className="w-full text-left space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">
                      Pertanyaan Populer
                    </p>
                    <div className="flex flex-col gap-2">
                      {suggestedPrompts.map((promptText, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSendChat(promptText)}
                          className="group text-left text-xs font-medium text-slate-700 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 px-3.5 py-2.5 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center justify-between gap-2"
                        >
                          <span>{promptText}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-500 flex-none transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Bot className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}

                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 space-y-2 shadow-xs ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-sm"
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap text-[12.5px]">{msg.content}</p>
                        {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-100">
                            {msg.citations.map((c, cIdx) => (
                              <span
                                key={cIdx}
                                className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md"
                              >
                                📌 {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-xl bg-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <User className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex gap-2.5 justify-start">
                      <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                        <Bot className="h-3.5 w-3.5 text-white animate-pulse" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-xs">
                        <div className="flex gap-1.5 items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Input Footer ── */}
            <div className="flex-none px-4 py-3 bg-white border-t border-slate-200 space-y-2">
              {isInsufficient && data?.summary?.includes("Belum ada") ? (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-xl">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>Belum ada cukup data laporan untuk analisis AI.</span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    placeholder="Tanya tentang laporan ini..."
                    disabled={chatLoading}
                    className="flex-1 text-[13px] border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-2.5 text-slate-800 outline-none transition-all disabled:opacity-50 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!chatQuestion.trim() || chatLoading}
                    className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
              <p className="text-[10px] text-slate-400 text-center">
                AI menjawab secara real-time berdasarkan data agregat laporan.
              </p>
            </div>
          </div>
        </>
      , document.body)}
    </div>
  );
};
