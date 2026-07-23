"use client";

import React, { useState } from "react";

interface MovementItem {
  date: string;
  label: string;
  count: number;
}

interface InventoryMovementChartProps {
  movement: MovementItem[];
}

export const InventoryMovementChart: React.FC<InventoryMovementChartProps> = ({
  movement,
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const data = movement.length > 0 ? movement : [{ date: new Date().toISOString(), label: "Today", count: 0 }];

  const maxValue = Math.max(...data.map((d) => d.count), 5);
  const minValue = 0;
  const range = maxValue - minValue;

  const width = 100;
  const height = 45;
  const paddingX = 3;
  const paddingY = 4;

  // Calculate coordinates for Sales count
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.count - minValue) / range) * (height - paddingY * 2);
    return { x, y, label: d.label, count: d.count };
  });

  // Helper to generate path string
  const getPathD = (pts: { x: number; y: number }[]) => {
    return pts
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = pts[i - 1];
        const cpx = (prev.x + p.x) / 2;
        return `C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
      })
      .join(" ");
  };

  const pathD = getPathD(points);
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 animate-fadeIn">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Inventory Movement (Sales Volume)</h3>
        </div>
        
        {/* Legend and Timeframe */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-slate-600">Parts Sold</span>
            </div>
          </div>
          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200">
            Last 30 Days
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative">
        {/* Y Axis Guide */}
        <div className="absolute left-0 top-1 bottom-8 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-slate-400 select-none">
          <span>{Math.round(maxValue)} qty</span>
          <span>{Math.round(maxValue / 2)} qty</span>
          <span>0 qty</span>
        </div>

        {/* SVG Drawing Canvas */}
        <div className="ml-12 relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-56 overflow-visible"
            onMouseLeave={() => setActiveIdx(null)}
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
                strokeWidth="0.25"
              />
            ))}

            {/* Area Fill */}
            <defs>
              <linearGradient id="invMoveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#invMoveGrad)" />

            {/* Sales Line Path */}
            <path
              d={pathD}
              fill="none"
              stroke="#2563eb"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Vertical Hover Indicator Line */}
            {activeIdx !== null && (
              <line
                x1={points[activeIdx].x}
                y1={paddingY}
                x2={points[activeIdx].x}
                y2={height - paddingY}
                stroke="#94a3b8"
                strokeWidth="0.3"
                strokeDasharray="1 1"
              />
            )}

            {/* Interactive Tooltip Points Tracker */}
            {points.map((p, i) => (
              <g key={i}>
                {/* Invisible hover area column */}
                <rect
                  x={p.x - (width - paddingX * 2) / (data.length - 1) / 2}
                  y={0}
                  width={(width - paddingX * 2) / (data.length - 1)}
                  height={height}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    const svgEl = (e.target as SVGElement).closest("svg");
                    if (!svgEl) return;
                    const rect = svgEl.getBoundingClientRect();
                    const svgW = rect.width;
                    const svgH = rect.height;
                    
                    setActiveIdx(i);
                    setTooltipPos({
                      x: (p.x / width) * svgW,
                      y: (points[i].y / height) * svgH,
                    });
                  }}
                />

                {/* Visible Dots on Hover */}
                {activeIdx === i && (
                  <circle
                    cx={points[i].x}
                    cy={points[i].y}
                    r="1.0"
                    fill="white"
                    stroke="#2563eb"
                    strokeWidth="0.5"
                  />
                )}
              </g>
            ))}
          </svg>

          {/* Interactive Tooltip Card */}
          {activeIdx !== null && tooltipPos && (
            <div
              className="absolute pointer-events-none z-10 bg-slate-900 text-white text-[10px] font-semibold rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap -translate-x-1/2 -translate-y-full -mt-4.5 transition-all"
              style={{ left: tooltipPos.x, top: tooltipPos.y }}
            >
              <p className="text-slate-300 font-normal border-b border-slate-700/60 pb-1 mb-1">
                {data[activeIdx].label}
              </p>
              <p className="flex items-center justify-between gap-4">
                <span className="text-blue-400">Sold:</span>
                <span className="font-mono font-bold text-white">{data[activeIdx].count} pcs</span>
              </p>
            </div>
          )}

          {/* X Axis Time Guide */}
          <div className="flex justify-between border-t border-slate-200/60 pt-2.5 text-[9px] font-semibold text-slate-400 select-none">
            <span>{data.length > 0 ? data[0].label : "Start"}</span>
            <span>{data.length > 1 ? data[data.length - 1].label : "End"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
