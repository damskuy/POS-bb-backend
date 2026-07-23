"use client";

import React, { useState } from "react";
import { formatRupiah } from "@/utils/format";

interface DailyItem {
  day: number;
  label: string;
  revenue: number;
}

interface MonthlyItem {
  monthKey: string;
  label: string;
  revenue: number;
}

interface ServiceRevenueChartProps {
  dailyTrend: DailyItem[];
  monthlyTrend: MonthlyItem[];
}

export const ServiceRevenueChart: React.FC<ServiceRevenueChartProps> = ({
  dailyTrend,
  monthlyTrend,
}) => {
  const [timeframe, setTimeframe] = useState<30 | 3 | 6 | 12>(30);
  const [activePoint, setActivePoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  // Derive charts data
  const data =
    timeframe === 30
      ? dailyTrend
      : monthlyTrend.slice(-timeframe);

  const values = data.map((d) => d.revenue);
  const maxValue = Math.max(...values, 500000); // default scale limit
  const minValue = 0;
  const range = maxValue - minValue;

  const width = 100;
  const height = 45;
  const paddingX = 4;
  const paddingY = 4;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.revenue - minValue) / range) * (height - paddingY * 2);
    return { x, y, label: d.label, revenue: d.revenue };
  });

  const pathD = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
    })
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Service Revenue Trend</h3>
        </div>

        {/* Filter buttons */}
        <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto flex-wrap gap-0.5">
          <button
            onClick={() => setTimeframe(30)}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
              timeframe === 30
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeframe(3)}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
              timeframe === 3
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            3 Mos
          </button>
          <button
            onClick={() => setTimeframe(6)}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
              timeframe === 6
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            6 Mos
          </button>
          <button
            onClick={() => setTimeframe(12)}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
              timeframe === 12
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            12 Mos
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative">
        {/* Y Axis Guide */}
        <div className="absolute left-0 top-1 bottom-8 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-slate-400 select-none">
          <span>{(maxValue / 1000000).toFixed(1)}jt</span>
          <span>{((maxValue / 2) / 1000000).toFixed(1)}jt</span>
          <span>0jt</span>
        </div>

        <div className="ml-12 relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-52 overflow-visible"
            onMouseLeave={() => setActivePoint(null)}
          >
            {/* Background Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <line
                key={f}
                x1={paddingX}
                y1={paddingY + f * (height - paddingY * 2)}
                x2={width - paddingX}
                y2={paddingY + f * (height - paddingY * 2)}
                stroke="#f1f5f9"
                strokeWidth="0.2"
              />
            ))}

            {/* Area Fill */}
            <defs>
              <linearGradient id="serviceTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#serviceTrendGrad)" />

            {/* Line Path */}
            <path
              d={pathD}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.65"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dots */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="0.9"
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth="0.4"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    const svgEl = (e.target as SVGElement).closest("svg");
                    if (!svgEl) return;
                    const rect = svgEl.getBoundingClientRect();
                    const svgW = rect.width;
                    const svgH = rect.height;
                    setActivePoint({
                      x: (p.x / width) * svgW,
                      y: (p.y / height) * svgH,
                      label: p.label,
                      value: p.revenue,
                    });
                  }}
                />
              </g>
            ))}
          </svg>

          {/* Interactive Tooltip Card */}
          {activePoint && (
            <div
              className="absolute pointer-events-none z-10 bg-slate-900 text-white text-[10px] font-semibold rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap -translate-x-1/2 -translate-y-full -mt-2.5 transition-all"
              style={{ left: activePoint.x, top: activePoint.y }}
            >
              <p className="text-slate-300 font-normal">{activePoint.label}</p>
              <p className="font-mono font-bold text-emerald-400">{formatRupiah(activePoint.value)}</p>
            </div>
          )}

          {/* X Axis month labels */}
          <div className="flex justify-between border-t border-slate-200/60 pt-2.5 text-[9px] font-semibold text-slate-400 select-none">
            {data.map((d, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === data.length - 1;
              const isMiddle = idx === Math.floor(data.length / 2);
              
              // Filter labels on large lists
              if (timeframe === 30) {
                if (idx % 6 !== 0 && !isLast) return null;
              }
              return (
                <span key={idx}>
                  {d.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
