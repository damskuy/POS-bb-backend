"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ApiResponse } from "@/types/api";

interface AuditLogUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: number;
  createdAt: string;
  action: string;
  entity: string;
  entityId: number | null;
  user?: AuditLogUser;
}

const typeConfig: Record<string, { icon: React.ReactNode; dot: string; color: string }> = {
  invoice: {
    dot: "bg-violet-500",
    color: "text-violet-600",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  workorder: {
    dot: "bg-blue-500",
    color: "text-blue-600",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  customer: {
    dot: "bg-emerald-500",
    color: "text-emerald-600",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  payment: {
    dot: "bg-amber-500",
    color: "text-amber-600",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  default: {
    dot: "bg-slate-500",
    color: "text-slate-600",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export const RecentActivity: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await api.get<ApiResponse<AuditLog[]>>("/api/audit-logs", {
          params: {
            limit: 5,
            sort: "createdAt",
            order: "desc",
          },
        });
        setActivities(res.data || []);
      } catch (err: any) {
        console.error("Error fetching Audit Logs:", err);
        if (err.status === 403) {
          setForbidden(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const formatActivityText = (log: AuditLog): { text: string; type: string } => {
    const entity = log.entity.toLowerCase();
    const action = log.action.toUpperCase();
    const name = log.user?.name || "Sistem";

    let type = "default";
    if (entity.includes("workorder")) type = "workorder";
    else if (entity.includes("invoice")) type = "invoice";
    else if (entity.includes("customer")) type = "customer";
    else if (entity.includes("payment")) type = "payment";

    let actionLabel = "";
    if (action === "CREATE") {
      if (entity.includes("workorder")) actionLabel = "Work Order baru dibuat";
      else if (entity.includes("invoice")) actionLabel = "Invoice baru dibuat";
      else if (entity.includes("customer")) actionLabel = "Pelanggan baru terdaftar";
      else if (entity.includes("payment")) actionLabel = "Pembayaran baru diterima";
      else if (entity.includes("vehicle")) actionLabel = "Kendaraan baru terdaftar";
      else if (entity.includes("mechanic")) actionLabel = "Mekanik baru didaftarkan";
      else actionLabel = `Membuat data ${log.entity}`;
    } else if (action === "UPDATE" || action === "CHANGE_STATUS" || action === "PATCH") {
      if (entity.includes("workorder")) actionLabel = "Status Work Order diperbarui";
      else if (entity.includes("payment")) actionLabel = "Status pembayaran diperbarui";
      else actionLabel = `Mengubah data ${log.entity}`;
    } else if (action === "DELETE") {
      if (entity.includes("workorder")) actionLabel = "Work Order dihapus";
      else actionLabel = `Menghapus data ${log.entity}`;
    } else if (action === "LOGIN") {
      actionLabel = "Berhasil masuk ke aplikasi";
    } else {
      actionLabel = `${log.action} ${log.entity}`;
    }

    return {
      text: `${actionLabel} (${name})`,
      type,
    };
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-5 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <div className="h-3 w-3/4 bg-slate-100 rounded" />
                  <div className="h-2.5 w-1/4 bg-slate-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : forbidden ? (
          <div className="text-center text-xs text-slate-400 italic py-6">
            Log aktivitas hanya dapat diakses oleh Admin atau Owner.
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-xs text-slate-400 italic py-6">
            Belum ada aktivitas tercatat.
          </div>
        ) : (
          <div className="relative flex-1">
            {/* Vertical line */}
            <div className="absolute left-[18px] top-2 bottom-2 w-px bg-slate-100" />

            <div className="space-y-4">
              {activities.map((item) => {
                const { text, type } = formatActivityText(item);
                const config = typeConfig[type] || typeConfig.default;
                return (
                  <div key={item.id} className="flex items-start gap-3 relative animate-fadeIn">
                    {/* Icon */}
                    <div className={`w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 relative z-10 shadow-xs ${config.color}`}>
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1.5">
                      <p className="text-xs font-semibold text-slate-900 leading-tight">
                        {text}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatTime(item.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
