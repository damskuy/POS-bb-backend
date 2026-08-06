"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Info,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AnomalyCategory =
  | "REVENUE"
  | "WORK_ORDER"
  | "CUSTOMER"
  | "INVENTORY"
  | "SERVICE"
  | "MECHANIC";

export interface DetectedAnomalyItem {
  severity: AnomalySeverity;
  category: AnomalyCategory;
  title: string;
  description: string;
  evidence: string[];
  recommendation: string;
  actionTarget: string;
}

export interface AiAnomalyDataResponse {
  generatedAt: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  anomalies: DetectedAnomalyItem[];
}

interface AiAnomalyCardProps {
  filters: {
    startDate: string | null;
    endDate: string | null;
  };
}

export const AiAnomalyCard: React.FC<AiAnomalyCardProps> = ({ filters }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AiAnomalyDataResponse | null>(null);

  // Selected Anomaly for Drawer Details
  const [selectedAnomaly, setSelectedAnomaly] = useState<DetectedAnomalyItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isDrawerRendered, setIsDrawerRendered] = useState<boolean>(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);

  // Smooth Drawer Animation Effect
  useEffect(() => {
    let animFrame: number;
    let timeout: NodeJS.Timeout;

    if (isDrawerOpen) {
      setIsDrawerRendered(true);
      animFrame = requestAnimationFrame(() => {
        animFrame = requestAnimationFrame(() => {
          setIsDrawerVisible(true);
        });
      });
    } else {
      setIsDrawerVisible(false);
      timeout = setTimeout(() => {
        setIsDrawerRendered(false);
      }, 300);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (timeout) clearTimeout(timeout);
    };
  }, [isDrawerOpen]);

  const fetchAnomalies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get<any>("/api/reports/ai-anomalies", { params });
      const anomalyData = res?.data || res;
      setData(anomalyData);
    } catch (err: any) {
      console.error("[AiAnomalyCard] Failed to fetch anomalies:", err);
      setError(err.message || "Gagal memuat anomali bisnis");
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const handleOpenDetails = (anomaly: DetectedAnomalyItem) => {
    setSelectedAnomaly(anomaly);
    setIsDrawerOpen(true);
  };

  // Color & Badge Styling Rules
  const getSeverityBadge = (severity: AnomalySeverity) => {
    switch (severity) {
      case "CRITICAL":
        return {
          bg: "bg-red-50 text-red-700 border-red-200",
          dot: "bg-red-500",
          badgeText: "CRITICAL",
          cardBorder: "border-red-200 hover:border-red-300",
          dotEmoji: "🔴",
        };
      case "HIGH":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          dot: "bg-amber-500",
          badgeText: "HIGH",
          cardBorder: "border-amber-200 hover:border-amber-300",
          dotEmoji: "🟠",
        };
      case "MEDIUM":
        return {
          bg: "bg-yellow-50 text-yellow-800 border-yellow-200",
          dot: "bg-yellow-500",
          badgeText: "MEDIUM",
          cardBorder: "border-yellow-200 hover:border-yellow-300",
          dotEmoji: "🟡",
        };
      case "LOW":
      default:
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
          badgeText: "LOW",
          cardBorder: "border-blue-200 hover:border-blue-300",
          dotEmoji: "🔵",
        };
    }
  };

  if (loading) {
    return (
      <div className="border border-slate-200/80 bg-white rounded-2xl p-5 shadow-2xs space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 bg-slate-200 rounded-md"></div>
          <div className="h-5 w-24 bg-slate-200 rounded-full"></div>
        </div>
        <div className="space-y-2.5">
          <div className="h-14 w-full bg-slate-100 rounded-xl"></div>
          <div className="h-14 w-full bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null; // Silently hide card if error occurs
  }

  const hasAnomalies = data.anomalies && data.anomalies.length > 0;

  return (
    <div className="border border-slate-200/90 bg-gradient-to-br from-slate-50/70 via-white to-amber-50/20 rounded-2xl p-5 shadow-2xs space-y-4 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-gradient-to-tr from-amber-500 to-red-500 text-white rounded-lg shadow-xs">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Business Alerts</h3>
            <p className="text-[11px] text-slate-500">
              {hasAnomalies
                ? `${data.total} ${data.total === 1 ? "anomaly" : "anomalies"} detected`
                : "No anomalies detected. Everything looks healthy."}
            </p>
          </div>
        </div>

        {hasAnomalies ? (
          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            {data.critical > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                🔴 {data.critical} Critical
              </span>
            )}
            {data.high > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                🟠 {data.high} High
              </span>
            )}
            {data.medium > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                🟡 {data.medium} Medium
              </span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Healthy</span>
          </span>
        )}
      </div>

      {/* Body: Anomalies List or Healthy Empty State */}
      {!hasAnomalies ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-emerald-900">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-950">No anomalies detected. Everything looks healthy.</h4>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Metrik operasional, pendapatan, dan stok barang berjalan dalam rentang normal.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.anomalies.map((item, idx) => {
            const badge = getSeverityBadge(item.severity);
            return (
              <div
                key={idx}
                className={`p-3.5 bg-white border ${badge.cardBorder} rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 group`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-base leading-none mt-0.5 shrink-0">{badge.dotEmoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-semibold text-slate-800 truncate">{item.title}</h4>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badge.bg}`}>
                        {badge.badgeText}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenDetails(item)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <span>View Details</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer Details Modal */}
      {isDrawerRendered && selectedAnomaly && typeof window !== "undefined" && createPortal(
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out ${
              isDrawerVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className={`fixed top-0 right-0 z-[61] h-screen w-full max-w-[420px] flex flex-col bg-white shadow-2xl border-l border-slate-200/80 transition-transform duration-300 ease-in-out ${
              isDrawerVisible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header */}
            <div className="flex-none px-5 py-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white leading-tight truncate">Detail Anomali Bisnis</h3>
                  <p className="text-[11px] text-indigo-300 mt-0.5">Analisis perilaku tidak biasa pada laporan</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs bg-slate-50/50">
              {/* Title & Badges */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadge(selectedAnomaly.severity).bg}`}>
                    Severity: {selectedAnomaly.severity}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200 uppercase tracking-wider">
                    {selectedAnomaly.category}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{selectedAnomaly.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedAnomaly.description}</p>
              </div>

              {/* Evidence Section */}
              {selectedAnomaly.evidence && selectedAnomaly.evidence.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Evidence Data (Bukti Metrik)</span>
                  </h5>
                  <ul className="space-y-1.5 pt-1">
                    {selectedAnomaly.evidence.map((ev, evIdx) => (
                      <li key={evIdx} className="flex items-start gap-2 text-slate-700 text-xs font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-4 rounded-xl border border-indigo-100 shadow-2xs space-y-2">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Rekomendasi Tindakan</span>
                </h5>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                  {selectedAnomaly.recommendation}
                </p>
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex-none px-5 py-3.5 bg-white border-t border-slate-200">
              <Link
                href={selectedAnomaly.actionTarget || "/reports"}
                onClick={() => setIsDrawerOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                <span>Buka Halaman Terkait ({selectedAnomaly.actionTarget})</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
              </Link>
            </div>
          </div>
        </>
      , document.body)}
    </div>
  );
};
