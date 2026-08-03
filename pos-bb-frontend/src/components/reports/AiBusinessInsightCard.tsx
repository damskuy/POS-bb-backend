"use client";

import React, { useEffect, useState, useCallback } from "react";
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

export interface AiDataQuality {
  status: "SUFFICIENT" | "LIMITED" | "INSUFFICIENT";
  note?: string | null;
}

export interface AiInsightResponseData {
  summary: string;
  highlights: AiHighlightItem[];
  recommendation: AiRecommendation;
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
            Sorotan Kinerja Utama
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.highlights.slice(0, 3).map((item, idx) => {
              const style = getHighlightBadge(item.type);
              const IconComp = style.icon;
              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs transition-all hover:shadow-xs ${style.cardBg}`}
                >
                  <div className="flex items-start justify-between space-x-2">
                    <div className={`p-1.5 rounded-lg shrink-0 ${style.iconBg}`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    {item.metric?.changePercent !== undefined && item.metric?.changePercent !== null && (
                      <span className={`text-xs font-semibold ${item.metric.changePercent >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {item.metric.changePercent >= 0 ? `+${item.metric.changePercent}%` : `${item.metric.changePercent}%`}
                      </span>
                    )}
                  </div>
                  <div>
                    <h5 className={`text-sm font-semibold ${style.titleColor}`}>
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
    </div>
  );
};
