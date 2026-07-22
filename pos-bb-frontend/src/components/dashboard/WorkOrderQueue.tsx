"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { WorkOrder } from "@/types/workOrder";

type WOStatus = "Waiting" | "In Progress" | "Finished";

const statusConfig: Record<WOStatus, { bg: string; text: string; border: string; dot: string; label: string }> = {
  Waiting: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Waiting",
  },
  "In Progress": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500 animate-pulse",
    label: "In Progress",
  },
  Finished: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Finished",
  },
};

export const WorkOrderQueue: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<WorkOrder[]>([]);

  useEffect(() => {
    const fetchTodayQueue = async () => {
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        const res = await api.get<ApiResponse<WorkOrder[]>>("/api/work-orders", {
          params: {
            startDate: todayStart.toISOString(),
            limit: 5, // Show 5 sample rows as requested, or top 5 today
          },
        });

        setQueue(res.data || []);
      } catch (err) {
        console.error("Error fetching Today's Work Order Queue:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayQueue();
  }, []);

  const getWOStatus = (status: string): WOStatus => {
    if (status === "PENDING" || status === "WAITING_PART") return "Waiting";
    if (status === "IN_PROGRESS" || status === "READY") return "In Progress";
    return "Finished";
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Today's Work Order Queue</h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          {queue.length} orders today
        </span>
      </div>

      {/* Table / Content */}
      {loading ? (
        <div className="p-6 space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center gap-4">
              <div className="h-4 w-24 bg-slate-100 rounded" />
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-4 w-20 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 italic">
          Belum ada work order yang dibuat hari ini.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5 text-left">Vehicle Plate</th>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-left hidden md:table-cell">Mechanic</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-5 text-right hidden sm:table-cell">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((row) => {
                const mappedStatus = getWOStatus(row.status);
                const s = statusConfig[mappedStatus];
                return (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div>
                        <p className="font-mono font-black text-slate-900 text-sm tracking-widest uppercase">
                          {row.vehicle?.plateNumber || "-"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{row.code}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{row.customer?.name || "-"}</p>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <p className="text-slate-600 font-medium">{row.mechanic?.name || "Belum ditentukan"}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right hidden sm:table-cell">
                      <span className="font-mono text-sm font-bold text-slate-700">
                        {row.scheduleDate ? formatTime(row.scheduleDate) : formatTime(row.createdAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 flex justify-end">
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All Work Orders
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};
