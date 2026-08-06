"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Lightbulb,
  Target,
  DollarSign,
  PiggyBank,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Info,
  HelpCircle,
  ChevronDown,
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  ExternalLink,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type AnomalyCategory = "REVENUE" | "WORK_ORDER" | "CUSTOMER" | "INVENTORY" | "SERVICE" | "MECHANIC";

interface DetectedAnomalyItem {
  severity: AnomalySeverity;
  category: AnomalyCategory;
  title: string;
  description: string;
  evidence: string[];
  recommendation: string;
  actionTarget: string;
}

interface AiAnomalyDataResponse {
  generatedAt: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  anomalies: DetectedAnomalyItem[];
}

interface AiHighlightItem {
  type: "positive" | "warning" | "opportunity";
  title: string;
  description: string;
}

interface AiRecommendation {
  title: string;
  description: string;
  actionLabel?: string | null;
  actionTarget?: string | null;
}

interface PriorityActionWhy {
  summary: string;
  evidence: string[];
}

interface PriorityActionItem {
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

interface ExplanationEvidence {
  label: string;
  value: string;
  interpretation: string;
}

interface ExplanationData {
  title: string;
  summary: string;
  evidence: ExplanationEvidence[];
}

interface AiInsightResponseData {
  summary: string;
  highlights: AiHighlightItem[];
  recommendation: AiRecommendation;
  priorityActions?: PriorityActionItem[];
  explanation?: ExplanationData;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  dataQuality: { status: "SUFFICIENT" | "LIMITED" | "INSUFFICIENT"; note?: string | null };
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type ActiveTab = "alerts" | "insight" | "actions";

interface AiHubPanelProps {
  filters: { startDate: string | null; endDate: string | null };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSeverityStyle(severity: AnomalySeverity) {
  switch (severity) {
    case "CRITICAL": return { bg: "bg-red-50 text-red-700 border-red-200", dot: "🔴", card: "border-red-200 hover:border-red-300 bg-red-50/30" };
    case "HIGH":     return { bg: "bg-amber-50 text-amber-800 border-amber-200", dot: "🟠", card: "border-amber-200 hover:border-amber-300 bg-amber-50/30" };
    case "MEDIUM":   return { bg: "bg-yellow-50 text-yellow-800 border-yellow-200", dot: "🟡", card: "border-yellow-200 hover:border-yellow-300 bg-yellow-50/30" };
    default:         return { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "🔵", card: "border-blue-200 hover:border-blue-300 bg-blue-50/30" };
  }
}

function getHighlightStyle(type: AiHighlightItem["type"]) {
  switch (type) {
    case "positive":    return { card: "bg-emerald-50/60 border-emerald-200/70", icon: "bg-emerald-100 text-emerald-700", title: "text-emerald-950", desc: "text-emerald-800", Icon: TrendingUp };
    case "warning":     return { card: "bg-amber-50/60 border-amber-200/70",    icon: "bg-amber-100 text-amber-700",    title: "text-amber-950",  desc: "text-amber-800",  Icon: AlertTriangle };
    default:            return { card: "bg-indigo-50/60 border-indigo-200/70",  icon: "bg-indigo-100 text-indigo-700",  title: "text-indigo-950", desc: "text-indigo-800", Icon: Lightbulb };
  }
}

function getConfidenceBadge(confidence: string) {
  switch (confidence) {
    case "HIGH":   return { label: "Confidence: High",   color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    case "MEDIUM": return { label: "Confidence: Medium", color: "bg-amber-100 text-amber-800 border-amber-200" };
    default:       return { label: "Confidence: Low",    color: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const AiHubPanel: React.FC<AiHubPanelProps> = ({ filters }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("alerts");

  // Anomaly state
  const [anomalyLoading, setAnomalyLoading] = useState(true);
  const [anomalyData, setAnomalyData] = useState<AiAnomalyDataResponse | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<DetectedAnomalyItem | null>(null);
  const [isAnomalyDrawerOpen, setIsAnomalyDrawerOpen] = useState(false);
  const [isAnomalyDrawerRendered, setIsAnomalyDrawerRendered] = useState(false);
  const [isAnomalyDrawerVisible, setIsAnomalyDrawerVisible] = useState(false);

  // Insight state
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insightData, setInsightData] = useState<AiInsightResponseData | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [openActionWhy, setOpenActionWhy] = useState<Record<number, boolean>>({});

  // Chat Drawer state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatRendered, setIsChatRendered] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    role: "user" | "assistant";
    content: string;
    citations?: string[];
    confidence?: string;
    usedFallback?: boolean;
  }>>([]);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Mengapa pendapatan turun?",
    "Mengapa pelanggan inaktif?",
    "Servis apa yang sebaiknya dipromosikan?",
    "Bagaimana cara menaikkan omzet?",
    "Inventaris mana yang perlu perhatian?",
  ];

  // ── Anomaly Drawer Animation ──────────────────────────────────────────────
  useEffect(() => {
    let af: number; let t: NodeJS.Timeout;
    if (isAnomalyDrawerOpen) {
      setIsAnomalyDrawerRendered(true);
      af = requestAnimationFrame(() => { af = requestAnimationFrame(() => { setIsAnomalyDrawerVisible(true); }); });
    } else {
      setIsAnomalyDrawerVisible(false);
      t = setTimeout(() => setIsAnomalyDrawerRendered(false), 300);
    }
    return () => { if (af) cancelAnimationFrame(af); if (t) clearTimeout(t); };
  }, [isAnomalyDrawerOpen]);

  // ── Chat Drawer Animation ─────────────────────────────────────────────────
  useEffect(() => {
    let af: number; let t: NodeJS.Timeout;
    if (isChatOpen) {
      setIsChatRendered(true);
      af = requestAnimationFrame(() => { af = requestAnimationFrame(() => { setIsChatVisible(true); }); });
    } else {
      setIsChatVisible(false);
      t = setTimeout(() => setIsChatRendered(false), 300);
    }
    return () => { if (af) cancelAnimationFrame(af); if (t) clearTimeout(t); };
  }, [isChatOpen]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // ── Data Fetchers ─────────────────────────────────────────────────────────
  const fetchAnomalies = useCallback(async () => {
    try {
      setAnomalyLoading(true);
      const params: Record<string, string> = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const res = await api.get<any>("/api/reports/ai-anomalies", { params });
      setAnomalyData(res?.data || res);
    } catch (err: any) {
      console.error("[AiHubPanel] Anomaly fetch failed:", err);
    } finally {
      setAnomalyLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  const fetchInsight = useCallback(async () => {
    try {
      setInsightLoading(true);
      setInsightError(null);
      const params: Record<string, string> = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const res = await api.get<any>("/api/reports/ai-insight", { params });
      setInsightData(res?.data || res);
    } catch (err: any) {
      console.error("[AiHubPanel] Insight fetch failed:", err);
      setInsightError(err.message || "Gagal memuat analisis bisnis AI");
    } finally {
      setInsightLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => { fetchAnomalies(); }, [fetchAnomalies]);
  useEffect(() => { fetchInsight(); }, [fetchInsight]);

  // Auto-switch to alerts tab if critical anomaly detected
  useEffect(() => {
    if (anomalyData && anomalyData.critical > 0) {
      setActiveTab("alerts");
    }
  }, [anomalyData]);

  // ── Chat Handler ──────────────────────────────────────────────────────────
  const handleSendChat = async (overrideQuestion?: string) => {
    const q = (overrideQuestion || chatQuestion).trim();
    if (!q || chatLoading) return;

    const newMessages = [...chatMessages, { role: "user" as const, content: q }];
    setChatMessages(newMessages);
    setChatQuestion("");
    setChatLoading(true);

    try {
      const historyPayload = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await api.post<any>("/api/reports/ai-chat", {
        question: q,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        history: historyPayload,
      });
      const resData = res?.data || res;
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: resData.answer || "Tidak ada respon dari AI.",
        citations: resData.citations || [],
        confidence: resData.confidence || "MEDIUM",
        usedFallback: resData.usedFallback || false,
      }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: err.message || "Gagal mendapatkan jawaban dari AI.",
        confidence: "LOW",
        usedFallback: true,
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Derived badge values ──────────────────────────────────────────────────
  const criticalCount = anomalyData?.critical ?? 0;
  const hasAnomalies = (anomalyData?.total ?? 0) > 0;
  const confBadge = insightData ? getConfidenceBadge(insightData.confidence) : null;
  const isInsufficient = insightData?.dataQuality?.status === "INSUFFICIENT" || insightData?.dataQuality?.status === "LIMITED";

  const tabs: { key: ActiveTab; label: string; badgeCount?: number; badgeColor?: string }[] = [
    {
      key: "alerts",
      label: "Business Alerts",
      badgeCount: anomalyData?.total,
      badgeColor: criticalCount > 0 ? "bg-red-500" : hasAnomalies ? "bg-amber-500" : "bg-emerald-500",
    },
    { key: "insight", label: "Business Insight" },
    { key: "actions", label: "Priority Actions", badgeCount: insightData?.priorityActions?.length, badgeColor: "bg-indigo-500" },
  ];

  return (
    <>
      {/* ── AI Hub Card ─────────────────────────────────────────────────────── */}
      <div className="border border-indigo-100/80 bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/30 rounded-2xl shadow-sm overflow-hidden">

        {/* ── Panel Header ───────────────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-xl">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">AI Business Intelligence</h3>
                <p className="text-[11px] text-indigo-300/80 mt-0.5">Analisis, anomali, dan rekomendasi dari data laporan</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsChatOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 hover:text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Tanya AI</span>
              </button>
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-200 bg-red-500/20 border border-red-400/30 px-2 py-1 rounded-lg animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  {criticalCount} Critical
                </span>
              )}
            </div>
          </div>

        </div>

        {/* ── shadcn-style Tab Navigation ────────────────────────────────────── */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
          <div className="inline-flex h-9 items-center rounded-lg bg-slate-100 p-1 gap-0.5">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 h-7 text-xs font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  activeTab === tab.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badgeCount !== undefined && (
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white leading-none ${tab.badgeColor}`}>
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content Area ─────────────────────────────────────────────────── */}
        <div className="p-5 min-h-[240px]">

          {/* ━━━━ TAB: BUSINESS ALERTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === "alerts" && (
            <div className="space-y-3 animate-fadeIn">
              {anomalyLoading ? (
                <div className="space-y-2.5 animate-pulse">
                  <div className="h-12 rounded-xl bg-slate-100" />
                  <div className="h-12 rounded-xl bg-slate-100" />
                </div>
              ) : !hasAnomalies ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-950">Tidak ada anomali terdeteksi</h4>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Semua metrik operasional, pendapatan, dan stok berjalan normal.</p>
                  </div>
                </div>
              ) : (
                <>


                  {/* Anomaly List */}
                  <div className="space-y-2">
                    {anomalyData!.anomalies.map((item, idx) => {
                      const style = getSeverityStyle(item.severity);
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between gap-3 p-3 border rounded-xl transition-all group ${style.card}`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-semibold text-slate-800 truncate">{item.title}</h4>
                                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${style.bg}`}>
                                  {item.severity}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => { setSelectedAnomaly(item); setIsAnomalyDrawerOpen(true); }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <span>Detail</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ━━━━ TAB: BUSINESS INSIGHT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === "insight" && (
            <div className="space-y-4 animate-fadeIn">
              {insightLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-12 w-full bg-slate-100 rounded-xl" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-24 bg-slate-100 rounded-xl" />
                    <div className="h-24 bg-slate-100 rounded-xl" />
                    <div className="h-24 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              ) : insightError ? (
                <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <p className="text-xs text-rose-700">{insightError}</p>
                  </div>
                  <button onClick={fetchInsight} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0">
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Coba Lagi</span>
                  </button>
                </div>
              ) : !insightData ? null : (
                <>
                  {/* Confidence + Refresh */}
                  <div className="flex items-center justify-between">
                    {confBadge && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${confBadge.color}`}>{confBadge.label}</span>
                    )}
                    <button onClick={fetchInsight} title="Muat Ulang" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="bg-white/80 border border-slate-200/60 rounded-xl p-4 shadow-2xs">
                    <p className="text-sm text-slate-800 font-medium leading-relaxed">{insightData.summary}</p>
                  </div>

                  {/* Limited Data Banner */}
                  {isInsufficient && (
                    <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{insightData.dataQuality?.note || "Data laporan pada rentang ini masih terbatas."}</span>
                    </div>
                  )}

                  {/* Highlights */}
                  {insightData.highlights?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sorotan Bisnis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {insightData.highlights.map((item, i) => {
                          const s = getHighlightStyle(item.type);
                          return (
                            <div key={i} className={`border rounded-xl p-3.5 flex items-start gap-3 ${s.card}`}>
                              <div className={`p-1.5 rounded-lg shrink-0 ${s.icon}`}>
                                <s.Icon className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <h5 className={`text-xs font-bold leading-tight ${s.title}`}>{item.title}</h5>
                                <p className={`text-xs mt-1 leading-snug ${s.desc}`}>{item.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recommendation Box */}
                  {insightData.recommendation && (
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2 text-indigo-300">
                          <Zap className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Rekomendasi Utama</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white">{insightData.recommendation.title}</h4>
                        <p className="text-xs text-slate-300 leading-normal">{insightData.recommendation.description}</p>
                      </div>
                      {insightData.recommendation.actionTarget && (
                        <Link href={insightData.recommendation.actionTarget} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer">
                          <span>{insightData.recommendation.actionLabel || "Jalankan Aksi"}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Explanation Collapsible */}
                  {insightData.explanation && (
                    <div>
                      <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>{insightData.explanation.title || "Mengapa AI memberikan rekomendasi ini?"}</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showExplanation ? "rotate-180" : ""}`} />
                      </button>
                      {showExplanation && (
                        <div className="mt-2 bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3 text-xs">
                          <p className="font-medium text-slate-800 leading-relaxed">{insightData.explanation.summary}</p>
                          {insightData.explanation.evidence?.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {insightData.explanation.evidence.map((ev, idx) => (
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
                </>
              )}
            </div>
          )}

          {/* ━━━━ TAB: PRIORITY ACTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === "actions" && (
            <div className="space-y-3 animate-fadeIn">
              {insightLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-pulse">
                  <div className="h-40 bg-slate-100 rounded-xl" />
                  <div className="h-40 bg-slate-100 rounded-xl" />
                  <div className="h-40 bg-slate-100 rounded-xl" />
                </div>
              ) : !insightData?.priorityActions?.length ? (
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-lg shrink-0">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700">Belum Ada Tindakan Prioritas</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tambahkan data transaksi untuk mendapatkan rekomendasi tindakan dari AI.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {insightData.priorityActions.map((action) => {
                    const impactBadge =
                      action.impact === "HIGH"   ? "bg-rose-100 text-rose-800 border-rose-200"   :
                      action.impact === "MEDIUM" ? "bg-amber-100 text-amber-800 border-amber-200" :
                                                   "bg-slate-100 text-slate-700 border-slate-200";
                    const circledNum = ["①", "②", "③"][action.priority - 1] || `${action.priority}`;

                    return (
                      <div key={action.priority} className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs transition-all">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-extrabold text-indigo-600">{circledNum}</span>
                              <h5 className="text-sm font-semibold text-slate-900 leading-snug">{action.title}</h5>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${impactBadge}`}>
                              {action.impact}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">{action.description}</p>

                          {((action.estimatedRevenue != null) || (action.estimatedSaving != null)) && (
                            <div className="flex flex-wrap gap-1.5">
                              {action.estimatedRevenue != null && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                  <DollarSign className="h-3 w-3 text-emerald-600" />
                                  Rp {action.estimatedRevenue.toLocaleString("id-ID")}
                                </span>
                              )}
                              {action.estimatedSaving != null && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                  <PiggyBank className="h-3 w-3 text-blue-600" />
                                  Rp {action.estimatedSaving.toLocaleString("id-ID")}
                                </span>
                              )}
                            </div>
                          )}

                          <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            Alasan: {action.reason}
                          </p>

                          {action.why && (
                            <div>
                              <button
                                onClick={() => setOpenActionWhy(prev => ({ ...prev, [action.priority]: !prev[action.priority] }))}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors"
                              >
                                <span>{openActionWhy[action.priority] ? "▲ Sembunyikan" : "▼ Explain Why"}</span>
                              </button>
                              {openActionWhy[action.priority] && (
                                <div className="mt-2 p-2.5 bg-indigo-50/40 border border-indigo-100 rounded-lg text-[11px] text-slate-700 space-y-1.5">
                                  <p className="font-semibold text-slate-900 leading-snug">{action.why.summary}</p>
                                  {action.why.evidence?.length > 0 && (
                                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                                      {action.why.evidence.map((ev, i) => <li key={i}>{ev}</li>)}
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* ━━━━ ANOMALY DETAIL DRAWER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isAnomalyDrawerRendered && selectedAnomaly && typeof window !== "undefined" && createPortal(
        <>
          <div
            className={`fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out ${isAnomalyDrawerVisible ? "opacity-100" : "opacity-0"}`}
            onClick={() => setIsAnomalyDrawerOpen(false)}
          />
          <div
            className={`fixed top-0 right-0 z-[61] h-screen w-full max-w-[420px] flex flex-col bg-white shadow-2xl border-l border-slate-200/80 transition-transform duration-300 ease-in-out ${isAnomalyDrawerVisible ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex-none px-5 py-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white leading-tight">Detail Anomali Bisnis</h3>
                  <p className="text-[11px] text-indigo-300 mt-0.5">Analisis perilaku tidak biasa</p>
                </div>
              </div>
              <button onClick={() => setIsAnomalyDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs bg-slate-50/50">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityStyle(selectedAnomaly.severity).bg}`}>
                    {selectedAnomaly.severity}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200 uppercase tracking-wider">
                    {selectedAnomaly.category}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{selectedAnomaly.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedAnomaly.description}</p>
              </div>

              {selectedAnomaly.evidence?.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Evidence Data</span>
                  </h5>
                  <ul className="space-y-1.5 pt-1">
                    {selectedAnomaly.evidence.map((ev, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 text-xs font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-indigo-500 font-bold shrink-0">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-4 rounded-xl border border-indigo-100 shadow-2xs space-y-2">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Rekomendasi Tindakan</span>
                </h5>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed">{selectedAnomaly.recommendation}</p>
              </div>
            </div>

            <div className="flex-none px-5 py-3.5 bg-white border-t border-slate-200">
              <Link
                href={selectedAnomaly.actionTarget || "/reports"}
                onClick={() => setIsAnomalyDrawerOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                <span>Buka {selectedAnomaly.actionTarget}</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
              </Link>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ━━━━ AI CHAT DRAWER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isChatRendered && typeof window !== "undefined" && createPortal(
        <>
          <div
            className={`fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out ${isChatVisible ? "opacity-100" : "opacity-0"}`}
            onClick={() => setIsChatOpen(false)}
          />
          <div
            className={`fixed top-0 right-0 z-[61] h-screen w-full max-w-[420px] flex flex-col bg-white shadow-2xl border-l border-slate-200/80 transition-transform duration-300 ease-in-out ${isChatVisible ? "translate-x-0" : "translate-x-full"}`}
          >
            {/* Chat Header */}
            <div className="flex-none px-5 py-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white leading-tight">AI Business Assistant</h3>
                    <p className="text-[11px] text-indigo-300 mt-0.5">Tanyakan apapun tentang laporan ini</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div ref={chatBodyRef} className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 space-y-4 text-[13px]">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-5 text-center px-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shadow-inner">
                    <Sparkles className="h-7 w-7 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Ada yang ingin Anda tanyakan?</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mt-1 max-w-[280px] mx-auto">
                      Asisten AI dapat menjelaskan tren omzet, pelanggan inaktif, dan prioritas stok barang berdasarkan data laporan saat ini.
                    </p>
                  </div>
                  <div className="w-full text-left space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pertanyaan Populer</p>
                    <div className="flex flex-col gap-2">
                      {suggestedPrompts.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendChat(p)}
                          className="group text-left text-xs font-medium text-slate-700 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 px-3.5 py-2.5 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center justify-between gap-2"
                        >
                          <span>{p}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-none" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Bot className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 space-y-2 shadow-xs ${
                        msg.role === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-sm"
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap text-[12.5px]">{msg.content}</p>
                        {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-100">
                            {msg.citations.map((c, i) => (
                              <span key={i} className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
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

            {/* Chat Input */}
            <div className="flex-none px-4 py-3 bg-white border-t border-slate-200 space-y-2">
              <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="flex items-center gap-2">
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
              <p className="text-[10px] text-slate-400 text-center">AI menjawab secara real-time berdasarkan data agregat laporan.</p>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};
