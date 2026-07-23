"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { WorkOrder } from "@/types/workOrder";

type WOStatus = "Waiting" | "In Progress" | "Finished";

const statusConfig: Record<WOStatus, { text: string; dot: string; label: string }> = {
  Waiting: {
    text: "text-slate-500",
    dot: "bg-slate-400",
    label: "Waiting",
  },
  "In Progress": {
    text: "text-blue-600",
    dot: "bg-blue-500 animate-pulse",
    label: "In Progress",
  },
  Finished: {
    text: "text-emerald-600",
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
            limit: 5,
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
    <div className="bg-white rounded-2xl shadow-2xs overflow-hidden border border-slate-100">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <h3 className="text-[14px] font-bold text-slate-800">Today's Work Order Queue</h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
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
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6 text-left">Vehicle Plate</th>
                <th className="py-3.5 px-4 text-left">Customer</th>
                <th className="py-3.5 px-4 text-left">Mechanic</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((row) => {
                const mappedStatus = getWOStatus(row.status);
                const s = statusConfig[mappedStatus];
                return (
                  <tr key={row.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="py-4.5 px-6">
                      <div>
                        <p className="font-mono font-bold text-slate-900 text-[13px] tracking-wider uppercase">
                          {row.vehicle?.plateNumber || "-"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{row.code}</p>
                      </div>
                    </td>
                    <td className="py-4.5 px-4">
                      <p className="font-semibold text-slate-700">{row.customer?.name || "-"}</p>
                    </td>
                    <td className="py-4.5 px-4">
                      <p className="text-slate-500 font-medium">{row.mechanic?.name || "Belum ditentukan"}</p>
                    </td>
                    <td className="py-4.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <span className="font-mono text-xs font-bold text-slate-600 font-tabular">
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
      <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/10 flex justify-end">
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          View All Work Orders
          <svg className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};
