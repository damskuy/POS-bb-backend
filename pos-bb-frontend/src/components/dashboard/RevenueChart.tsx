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
  const minValue = 0;
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

  return (
    <div className="bg-white rounded-2xl shadow-2xs border border-slate-100 animate-fadeIn">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-[14px] font-bold text-slate-800">Revenue (Last 7 Days)</h3>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0">
        {/* Chart Area */}
        <div className="flex-1 p-6 relative">
          {/* Y-axis labels */}
          <div className="absolute left-6 top-6 bottom-6 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-slate-400 select-none">
            <span>{(maxValue / 1000000).toFixed(1)}jt</span>
            <span>{((maxValue / 2) / 1000000).toFixed(1)}jt</span>
            <span>0jt</span>
          </div>

          {/* SVG Chart */}
          <div className="ml-10 relative">
            <svg
              viewBox={`0 0 100 ${height}`}
              className="w-full overflow-visible"
              style={{ height: "140px" }}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Grid lines */}
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

              {/* Line */}
              <path d={pathD} fill="none" stroke="#0f172a" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />

              {/* Points */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="0.8"
                    fill="white"
                    stroke="#0f172a"
                    strokeWidth="0.4"
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
                </g>
              ))}
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute pointer-events-none z-10 bg-slate-900 text-white text-[10px] font-semibold rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap -translate-x-1/2 -translate-y-full -mt-3.5 transition-all"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                <p className="text-slate-300 font-normal">{tooltip.label}</p>
                <p className="font-mono font-bold text-emerald-400 font-tabular">{formatRupiah(tooltip.value)}</p>
              </div>
            )}

            {/* X-axis labels */}
            <div className="flex justify-between mt-3 text-[9px] font-semibold text-slate-400 select-none border-t border-slate-50 pt-2">
              {last7Days.map((d, i) => (
                <span key={i} className={i === last7Days.length - 1 ? "text-slate-800 font-bold" : ""}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Summary */}
        <div className="lg:w-44 border-t lg:border-t-0 lg:border-l border-slate-100 p-6 flex flex-col justify-center gap-4 shrink-0 bg-slate-50/10">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Today</p>
            <p className="font-mono text-base font-extrabold text-slate-900 font-tabular">{formatRupiah(todayRevenue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Yesterday</p>
            <p className="font-mono text-base font-bold text-slate-500 font-tabular">{formatRupiah(yesterdayRevenue)}</p>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Difference</p>
            <p className={`font-mono text-xs font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"} font-tabular`}>
              {isPositive ? "+" : ""}{formatRupiah(diff)}
            </p>
            <span
              className={`mt-2.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black rounded-full border ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-rose-50 text-rose-700 border-rose-100"
              }`}
            >
              {isPositive ? "↑" : "↓"} {Math.abs(Math.round((diff / yesterdayRevenue) * 100))}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
