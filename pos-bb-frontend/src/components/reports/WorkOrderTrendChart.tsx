"use client";

import React, { useState } from "react";
import { woTrend } from "@/mock/workOrderReport";

export const WorkOrderTrendChart: React.FC = () => {
  const [activePoint, setActivePoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  const maxValue = Math.max(...woTrend.map((d) => d.count));
  const minValue = Math.min(...woTrend.map((d) => d.count));
  const range = maxValue - minValue || 1;

  const width = 100;
  const height = 45;
  const paddingX = 3;
  const paddingY = 4;

  const points = woTrend.map((d, i) => {
    const x = paddingX + (i / (woTrend.length - 1)) * (width - paddingX * 2);
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
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Work Orders Created</h3>
        </div>
        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200">
          Last 30 Days
        </span>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative">
        {/* Y Axis Guide */}
        <div className="absolute left-0 top-1 bottom-8 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-slate-400 select-none">
          <span>{maxValue} orders</span>
          <span>{Math.round(minValue + range / 2)} orders</span>
          <span>{minValue} orders</span>
        </div>

        {/* SVG Drawing Canvas */}
        <div className="ml-14 relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-56"
            onMouseLeave={() => setActivePoint(null)}
          >
            {/* Background Grid Lines */}
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1={paddingX}
                y1={paddingY + f * (height - paddingY * 2)}
                x2={width - paddingX}
                y2={paddingY + f * (height - paddingY * 2)}
                stroke="#f1f5f9"
                strokeWidth="0.3"
              />
            ))}

            {/* Area Fill */}
            <defs>
              <linearGradient id="woTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#woTrendGrad)" />

            {/* Line Path */}
            <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />

            {/* Mouse Tracking Points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="1.2"
                  fill="white"
                  stroke="#2563eb"
                  strokeWidth="0.6"
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
              <p className="font-mono font-bold text-blue-400">{activePoint.value} work orders</p>
            </div>
          )}

          {/* X Axis Time Guide */}
          <div className="flex justify-between border-t border-slate-200/60 pt-2.5 text-[9px] font-semibold text-slate-400 select-none">
            <span>Day 1</span>
            <span>Day 10</span>
            <span>Day 20</span>
            <span>Day 30</span>
          </div>
        </div>
      </div>
    </div>
  );
};
