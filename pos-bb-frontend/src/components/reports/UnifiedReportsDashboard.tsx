"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { AiBusinessInsightCard } from "./AiBusinessInsightCard";

// --- Mock Data for Chart ---
const MOCK_DAILY_REVENUE = [
  { date: "15 Jul", revenue: 1200000 },
  { date: "16 Jul", revenue: 1500000 },
  { date: "17 Jul", revenue: 900000 },
  { date: "18 Jul", revenue: 2200000 },
  { date: "19 Jul", revenue: 1800000 },
  { date: "20 Jul", revenue: 2950000 },
  { date: "21 Jul", revenue: 1200000 },
  { date: "22 Jul", revenue: 3100000 },
  { date: "23 Jul", revenue: 1800000 },
  { date: "24 Jul", revenue: 2450000 },
];


interface UnifiedReportsDashboardProps {
  filters: {
    startDate: string | null;
    endDate: string | null;
  };
}

export const UnifiedReportsDashboard: React.FC<UnifiedReportsDashboardProps> = ({ filters }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [filters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900"></div>
        <p className="text-sm text-slate-500 font-medium mt-4">Memuat data laporan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12 animate-fadeIn text-slate-900">
      
      {/* 1. KPI Overview */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Revenue" value="Rp 24.500.000" trend="+12.5%" description="vs bulan lalu" />
          <KpiCard title="Completed Work Orders" value="142" trend="+5.2%" description="vs bulan lalu" />
          <KpiCard title="Average Ticket" value="Rp 172.535" trend="-1.2%" description="vs bulan lalu" trendType="warning" />
          <KpiCard title="Gross Profit" value="Rp 9.800.000" trend="+15.0%" description="vs bulan lalu" />
        </div>
      </section>

      {/* 1.5. AI Business Insight */}
      <section>
        <AiBusinessInsightCard filters={filters} />
      </section>

      {/* 2. Revenue Overview & Workshop Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Revenue Trend</h3>
          </div>
          <div className="h-[350px] w-full border border-slate-200/60 rounded-xl bg-white shadow-sm flex flex-col p-6">
            <SimpleLineChart data={MOCK_DAILY_REVENUE} />
          </div>
        </div>
        
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Workshop Insights</h3>
          </div>
          <div className="border border-slate-200/60 rounded-xl bg-white shadow-sm p-6 space-y-5">
            <InsightRow status="success" text="Revenue meningkat 18% dibanding periode sebelumnya" />
            <InsightRow status="warning" text="Permintaan Brake Service turun 7%" />
            <InsightRow status="error" text="Stok Oli Mesin TMO 10W-40 di bawah batas minimum (Sisa: 2)" />
            <InsightRow status="info" text="Rata-rata transaksi (Average Ticket) mengalami peningkatan tipis" />
            
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Payment Breakdown</h4>
              <PaymentBreakdown />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Operational Performance */}
      <section className="space-y-6">
        <h3 className="text-lg font-semibold tracking-tight border-b border-slate-100 pb-2">Operational Performance</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Services */}
          <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-semibold text-slate-800">Top Services</h4>
            </div>
            <div className="p-0">
              <RankedList 
                items={[
                  { label: "Ganti Oli Mesin", value: "45 jobs", subValue: "Rp 6.750.000" },
                  { label: "Service Rutin (Tune Up)", value: "32 jobs", subValue: "Rp 11.200.000" },
                  { label: "Ganti Kampas Rem", value: "28 jobs", subValue: "Rp 4.200.000" },
                  { label: "Service AC", value: "15 jobs", subValue: "Rp 5.250.000" },
                ]} 
              />
            </div>
          </div>

          {/* Top Mechanics */}
          <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-semibold text-slate-800">Top Mechanics</h4>
            </div>
            <div className="p-0">
              <RankedList 
                items={[
                  { label: "Budi Santoso", value: "52 jobs", subValue: "Rp 8.500.000" },
                  { label: "Agus Prasetyo", value: "48 jobs", subValue: "Rp 7.200.000" },
                  { label: "Hendra Wijaya", value: "42 jobs", subValue: "Rp 8.800.000" },
                ]} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Inventory Insights */}
      <section className="space-y-6">
        <h3 className="text-lg font-semibold tracking-tight border-b border-slate-100 pb-2">Inventory Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SmallRankedCard title="Fast Moving Parts" items={[
            { label: "Oli Mesin TMO 10W-40", value: "120 unit" },
            { label: "Kampas Rem Depan", value: "85 unit" },
            { label: "Filter Oli", value: "72 unit" }
          ]} />
          <SmallRankedCard title="Highest Profit Parts" items={[
            { label: "Aki GS Astra Hybrid", value: "Rp 2.1M" },
            { label: "Shockbreaker Depan", value: "Rp 1.8M" },
            { label: "Ban Michelin 185/65", value: "Rp 1.5M" }
          ]} />
          <SmallRankedCard title="Low Stock Alerts" items={[
            { label: "Filter Udara Avanza", value: "3 unit left", warning: true },
            { label: "Busi NGK Iridium", value: "5 unit left", warning: true },
            { label: "Minyak Rem DOT 4", value: "2 unit left", warning: true }
          ]} />
          <SmallRankedCard title="Slow Moving" items={[
            { label: "Wiper Blade Belakang", value: "0 sold (30d)" },
            { label: "Radiator Coolant (Galon)", value: "1 sold (30d)" },
            { label: "Bohlam Halogen H4", value: "2 sold (30d)" }
          ]} />
        </div>
      </section>

      {/* 5. Customer Analytics */}
      <section className="space-y-6">
        <h3 className="text-lg font-semibold tracking-tight border-b border-slate-100 pb-2">Customer Analytics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="font-semibold text-slate-800">Highest Spending Customers</h4>
              <span className="text-xs font-medium text-slate-500">This Period</span>
            </div>
            <div className="p-0">
              <RankedList 
                items={[
                  { label: "PT Maju Terus (Fleet)", value: "12 visits", subValue: "Rp 15.400.000" },
                  { label: "Bpk. Andi Wijaya", value: "3 visits", subValue: "Rp 4.200.000" },
                  { label: "Ibu Siti Aminah", value: "2 visits", subValue: "Rp 2.800.000" },
                ]} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-6 flex flex-col justify-center items-center text-center">
              <span className="text-sm font-medium text-slate-500 mb-2">Returning Customer Rate</span>
              <span className="text-4xl font-bold tracking-tight text-slate-900">68%</span>
              <span className="text-xs text-emerald-600 font-medium mt-2 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                +4% from last month
              </span>
            </div>
            <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-6 flex flex-col justify-center items-center text-center">
              <span className="text-sm font-medium text-slate-500 mb-2">Average Visits / Year</span>
              <span className="text-4xl font-bold tracking-tight text-slate-900">2.4</span>
              <span className="text-xs text-slate-500 font-medium mt-2">
                Stable
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Revenue History Table */}
      <section className="space-y-6 pt-4">
        <h3 className="text-lg font-semibold tracking-tight border-b border-slate-100 pb-2">Revenue History</h3>
        <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-xs border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Completed WO</th>
                <th className="px-6 py-4 font-semibold text-right">Revenue</th>
                <th className="px-6 py-4 font-semibold text-right">Average Ticket</th>
                <th className="px-6 py-4 font-semibold text-right">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { date: "24 Jul 2026", wo: 12, rev: "Rp 2.450.000", avg: "Rp 204.166", growth: "+5%", up: true },
                { date: "23 Jul 2026", wo: 10, rev: "Rp 1.800.000", avg: "Rp 180.000", growth: "-2%", up: false },
                { date: "22 Jul 2026", wo: 15, rev: "Rp 3.100.000", avg: "Rp 206.666", growth: "+12%", up: true },
                { date: "21 Jul 2026", wo: 8, rev: "Rp 1.200.000", avg: "Rp 150.000", growth: "-8%", up: false },
                { date: "20 Jul 2026", wo: 14, rev: "Rp 2.950.000", avg: "Rp 210.714", growth: "+15%", up: true },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{row.date}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{row.wo}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900">{row.rev}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{row.avg}</td>
                  <td className={`px-6 py-4 text-right font-medium flex items-center justify-end ${row.up ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {row.up ? (
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    ) : (
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    )}
                    {row.growth}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

// --- Sub Components ---

function KpiCard({ title, value, trend, description, trendType = "success" }: any) {
  const isWarning = trendType === "warning";
  const trendColor = isWarning ? "text-slate-500" : "text-emerald-600";
  
  return (
    <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <h4 className="text-sm font-medium text-slate-500 mb-3">{title}</h4>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
      </div>
      <div className="mt-3 flex items-center text-xs font-medium">
        <span className={`${trendColor} bg-${isWarning ? 'slate' : 'emerald'}-50 px-1.5 py-0.5 rounded mr-2`}>
          {trend}
        </span>
        <span className="text-slate-400">{description}</span>
      </div>
    </div>
  );
}

function InsightRow({ status, text }: { status: "success" | "warning" | "error" | "info"; text: string }) {
  const colors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };
  
  return (
    <div className="flex items-start">
      <div className={`w-2 h-2 rounded-full ${colors[status]} mt-1.5 mr-3 flex-shrink-0`}></div>
      <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
    </div>
  );
}

function PaymentBreakdown() {
  // Horizontal stacked bar
  return (
    <div className="space-y-3">
      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
        <div className="bg-slate-800 h-full" style={{ width: '65%' }} title="Cash: 65%"></div>
        <div className="bg-slate-400 h-full" style={{ width: '25%' }} title="QRIS: 25%"></div>
        <div className="bg-slate-300 h-full" style={{ width: '10%' }} title="Transfer: 10%"></div>
      </div>
      <div className="flex justify-between text-xs font-medium text-slate-500">
        <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-800 mr-1.5"></div>Cash (65%)</div>
        <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-400 mr-1.5"></div>QRIS (25%)</div>
        <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-300 mr-1.5"></div>Trf (10%)</div>
      </div>
    </div>
  );
}

function RankedList({ items }: { items: any[] }) {
  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
          <div className="flex items-center">
            <span className="text-xs font-bold text-slate-400 w-5">{i + 1}.</span>
            <span className="text-sm font-medium text-slate-800">{item.label}</span>
          </div>
          <div className="text-right flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <span className="text-sm font-medium text-slate-900">{item.subValue}</span>
            <span className="text-xs text-slate-500 w-16 sm:text-right">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SmallRankedCard({ title, items }: { title: string, items: any[] }) {
  return (
    <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-5">
      <h4 className="text-sm font-semibold text-slate-800 mb-4">{title}</h4>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className={`truncate mr-2 ${item.warning ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
              {item.label}
            </span>
            <span className={`font-medium whitespace-nowrap ${item.warning ? 'text-red-600' : 'text-slate-900'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleLineChart({ data }: { data: any[] }) {
  const maxValue = Math.max(...data.map(d => d.revenue), 100000);
  const width = 100;
  const height = 40;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.revenue / maxValue) * height;
    return { x, y, value: d.revenue };
  });

  const pathD = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
    })
    .join(" ");

  const formatCurrency = (val: number) => {
    return `Rp ${(val / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative flex">
        {/* Y Axis Guide */}
        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs font-medium text-slate-400 pointer-events-none z-10 w-16">
          <span>{formatCurrency(maxValue)}</span>
          <span>{formatCurrency(maxValue * 0.5)}</span>
          <span>Rp 0</span>
        </div>
        
        {/* Chart Area */}
        <div className="ml-16 flex-1 relative h-full">
          <svg viewBox={`0 -2 ${width} ${height + 4}`} className="w-full h-full overflow-visible preserve-aspect-ratio-none">
            {/* Horizontal Grid lines */}
            {[0, 0.5, 1].map((f) => (
              <line key={f} x1="0" y1={height * f} x2={width} y2={height * f} stroke="#e2e8f0" strokeWidth="0.2" />
            ))}
            
            {/* Area gradient */}
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <path
              d={`${pathD} L ${width} ${height} L 0 ${height} Z`}
              fill="url(#lineGrad)"
            />
            
            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#0f172a"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="0.8"
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth="0.3"
                className="hover:r-1.5 transition-all cursor-pointer"
              />
            ))}
          </svg>
        </div>
      </div>
      {/* X Axis */}
      <div className="ml-16 h-6 mt-2 flex justify-between text-xs font-medium text-slate-400">
        {data.map((d, i) => (
          <span key={i} className={i % 2 !== 0 ? "hidden sm:block" : ""}>{d.date}</span>
        ))}
      </div>
    </div>
  );
}
