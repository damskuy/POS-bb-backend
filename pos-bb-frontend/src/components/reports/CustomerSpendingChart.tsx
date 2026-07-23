import React from "react";

interface SpendingBracket {
  bracket: string;
  count: number;
}

interface CustomerSpendingChartProps {
  spendingDistribution: SpendingBracket[];
}

export const CustomerSpendingChart: React.FC<CustomerSpendingChartProps> = ({
  spendingDistribution,
}) => {
  const maxCount = Math.max(...spendingDistribution.map((d) => d.count), 1);

  // SVG parameters
  const width = 100;
  const height = 45;
  const paddingX = 8;
  const paddingY = 5;

  // Calculate coordinates for vertical bars
  const totalBrackets = spendingDistribution.length;
  const barWidth = 10;
  const spacing = (width - paddingX * 2 - barWidth * totalBrackets) / (totalBrackets - 1);

  const bars = spendingDistribution.map((d, i) => {
    const barHeight = (d.count / maxCount) * (height - paddingY * 2);
    const x = paddingX + i * (barWidth + spacing);
    const y = height - paddingY - barHeight;
    return { x, y, barHeight, ...d };
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Spending Distribution</h3>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 flex flex-col justify-center">
        {/* Y Axis Guide */}
        <div className="absolute left-0 top-1 bottom-8 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-slate-400 select-none">
          <span>{maxCount} cust</span>
          <span>{Math.round(maxCount / 2)} cust</span>
          <span>0 cust</span>
        </div>

        <div className="ml-12 relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            {/* Background Grid Lines */}
            {[0, 0.5, 1].map((f) => (
              <line
                key={f}
                x1={0}
                y1={paddingY + f * (height - paddingY * 2)}
                x2={width}
                y2={paddingY + f * (height - paddingY * 2)}
                stroke="#f1f5f9"
                strokeWidth="0.25"
              />
            ))}

            {/* Gradient definition for bars */}
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.85" />
              </linearGradient>
            </defs>

            {/* Render Bars */}
            {bars.map((b, i) => (
              <g key={i} className="group">
                {/* Rounded Top Bar */}
                <rect
                  x={b.x}
                  y={b.y}
                  width={barWidth}
                  height={b.barHeight}
                  rx="1.5"
                  fill="url(#barGrad)"
                  className="transition-all duration-300 hover:opacity-90"
                  style={{ cursor: "pointer" }}
                />
                
                {/* Tooltip Label inside SVG for numbers */}
                <text
                  x={b.x + barWidth / 2}
                  y={b.y - 1.5}
                  textAnchor="middle"
                  className="text-[6px] font-mono font-bold fill-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {b.count}
                </text>
              </g>
            ))}
          </svg>

          {/* X Axis Labels */}
          <div className="flex justify-between border-t border-slate-200/60 pt-2.5 text-[9px] font-bold text-slate-500 select-none">
            {spendingDistribution.map((d) => (
              <span key={d.bracket} className="w-12 text-center truncate" title={d.bracket}>
                {d.bracket}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
