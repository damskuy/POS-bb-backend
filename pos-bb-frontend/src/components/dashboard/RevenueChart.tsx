"use client";

import React, { useState } from "react";
import { formatRupiah } from "@/utils/format";

const last7Days = (() => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
      value: Math.floor(Math.random() * 3000000) + 800000,
    });
  }
  // Ensure today is a specific value
  days[6].value = 2350000;
  days[5].value = 1990000;
  return days;
})();

const todayRevenue = last7Days[6].value;
const yesterdayRevenue = last7Days[5].value;
const diff = todayRevenue - yesterdayRevenue;
const isPositive = diff >= 0;

export const RevenueChart: React.FC = () => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  const maxValue = Math.max(...last7Days.map((d) => d.value));
  const minValue = Math.min(...last7Days.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const width = 100;
  const height = 60;
  const paddingX = 2;
  const paddingY = 5;

  const points = last7Days.map((d, i) => {
    const x = paddingX + (i / (last7Days.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.value - minValue) / range) * (height - paddingY * 2);
    return { x, y, ...d };
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
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Revenue (Last 7 Days)</h3>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0">
        {/* Chart Area */}
        <div className="flex-1 p-5 relative">
          {/* Y-axis labels */}
          <div className="absolute left-5 top-5 bottom-5 flex flex-col justify-between pointer-events-none">
            {[1, 0.5, 0].map((factor) => (
              <span key={factor} className="text-[9px] text-slate-400 font-mono leading-none">
                {(minValue + factor * range / 1000000).toFixed(1)}jt
              </span>
            ))}
          </div>

          {/* SVG Chart */}
          <div className="ml-8 relative">
            <svg
              viewBox={`0 0 100 ${height}`}
              className="w-full"
              style={{ height: "140px" }}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map((f) => (
                <line
                  key={f}
                  x1={paddingX}
                  y1={paddingY + f * (height - paddingY * 2)}
                  x2={width - paddingX}
                  y2={paddingY + f * (height - paddingY * 2)}
                  stroke="#f1f5f9"
                  strokeWidth="0.5"
                />
              ))}

              {/* Area fill */}
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#revenueGrad)" />

              {/* Line */}
              <path d={pathD} fill="none" stroke="#10b981" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />

              {/* Points */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="1.5"
                    fill="white"
                    stroke="#10b981"
                    strokeWidth="0.8"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => {
                      const svgEl = (e.target as SVGElement).closest("svg");
                      if (!svgEl) return;
                      const rect = svgEl.getBoundingClientRect();
                      const svgW = rect.width;
                      const svgH = rect.height;
                      setTooltip({
                        x: (p.x / 100) * svgW,
                        y: (p.y / height) * svgH,
                        label: p.label,
                        value: p.value,
                      });
                    }}
                  />
                  {/* Today highlight */}
                  {i === points.length - 1 && (
                    <circle cx={p.x} cy={p.y} r="2" fill="#10b981" stroke="white" strokeWidth="0.5" />
                  )}
                </g>
              ))}
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute pointer-events-none z-10 bg-slate-900 text-white text-[10px] font-semibold rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap -translate-x-1/2 -translate-y-full -mt-2"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                <p className="text-slate-300 font-normal">{tooltip.label}</p>
                <p className="font-mono font-bold text-emerald-400">{formatRupiah(tooltip.value)}</p>
              </div>
            )}

            {/* X-axis labels */}
            <div className="flex justify-between mt-2">
              {last7Days.map((d, i) => (
                <span key={i} className={`text-[9px] font-medium ${i === last7Days.length - 1 ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Summary */}
        <div className="lg:w-44 border-t lg:border-t-0 lg:border-l border-slate-100 p-5 flex flex-col justify-center gap-4 shrink-0">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Today</p>
            <p className="font-mono text-base font-bold text-slate-900">{formatRupiah(todayRevenue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Yesterday</p>
            <p className="font-mono text-base font-bold text-slate-700">{formatRupiah(yesterdayRevenue)}</p>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Difference</p>
            <p className={`font-mono text-sm font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
              {isPositive ? "+" : ""}{formatRupiah(diff)}
            </p>
            <span
              className={`mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full border ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {isPositive ? "↑" : "↓"} {Math.abs(Math.round((diff / yesterdayRevenue) * 100))}% from yesterday
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
