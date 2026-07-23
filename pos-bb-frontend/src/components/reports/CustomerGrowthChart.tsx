"use client";

import React, { useState } from "react";

interface GrowthDataItem {
  monthKey: string;
  label: string;
  count: number;
}

interface CustomerGrowthChartProps {
  growth: GrowthDataItem[];
}

export const CustomerGrowthChart: React.FC<CustomerGrowthChartProps> = ({
  growth,
}) => {
  const [timeframe, setTimeframe] = useState<6 | 12>(6);
  const [activePoint, setActivePoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  // Slice data based on selected timeframe
  const data = timeframe === 6 ? growth.slice(-6) : growth;

  const values = data.map((d) => d.count);
  const maxValue = Math.max(...values, 5); // scale max to at least 5
  const minValue = 0;
  const range = maxValue - minValue;

  const width = 100;
  const height = 45;
  const paddingX = 4;
  const paddingY = 4;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.count - minValue) / range) * (height - paddingY * 2);
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
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 animate-fadeIn">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Customer Growth</h3>
        </div>

        {/* Timeframe selector buttons */}
        <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setTimeframe(6)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
              timeframe === 6
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            6 Months
          </button>
          <button
            onClick={() => setTimeframe(12)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
              timeframe === 12
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            12 Months
          </button>
        </div>
      </div>

      {/* SVG Line Chart Canvas */}
      <div className="relative">
        {/* Y Axis Guide */}
        <div className="absolute left-0 top-1 bottom-8 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-slate-400 select-none">
          <span>{maxValue} cust</span>
          <span>{Math.round(maxValue / 2)} cust</span>
          <span>0 cust</span>
        </div>

        <div className="ml-12 relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-48 overflow-visible"
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

            {/* Gradient Area Fill */}
            <defs>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#growthGrad)" />

            {/* Line Path */}
            <path
              d={pathD}
              fill="none"
              stroke="#2563eb"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Tracking points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="0.9"
                  fill="white"
                  stroke="#2563eb"
                  strokeWidth="0.45"
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
                      value: p.count,
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
              <p className="font-mono font-bold text-blue-400">+{activePoint.value} new customers</p>
            </div>
          )}

          {/* X Axis month labels */}
          <div className="flex justify-between border-t border-slate-200/60 pt-2.5 text-[9px] font-semibold text-slate-400 select-none">
            {data.map((d, idx) => {
              // Only render first, middle, and last labels on small screens, or all on wide
              const isFirst = idx === 0;
              const isLast = idx === data.length - 1;
              const isMiddle = idx === Math.floor(data.length / 2);
              return (
                <span
                  key={d.monthKey}
                  className={timeframe === 12 && !isFirst && !isLast && !isMiddle ? "hidden sm:inline" : ""}
                >
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
