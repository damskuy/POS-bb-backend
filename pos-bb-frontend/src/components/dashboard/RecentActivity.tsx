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

const typeConfig: Record<string, { dot: string }> = {
  invoice: { dot: "bg-purple-500" },
  workorder: { dot: "bg-blue-500" },
  customer: { dot: "bg-emerald-500" },
  payment: { dot: "bg-amber-500" },
  default: { dot: "bg-slate-400" },
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
    <div className="bg-white rounded-2xl shadow-2xs overflow-hidden border border-slate-100 flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-[14px] font-bold text-slate-800">Recent Activity</h3>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-200" />
                  <div className="h-3.5 w-32 bg-slate-100 rounded" />
                </div>
                <div className="h-3 w-10 bg-slate-100 rounded" />
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
            {/* Vertical timeline line */}
            <div className="absolute left-[13px] top-2 bottom-2 w-[1px] bg-slate-100" />

            <div className="space-y-5">
              {activities.map((item) => {
                const { text, type } = formatActivityText(item);
                const config = typeConfig[type] || typeConfig.default;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-4 relative animate-fadeIn group">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Minimal timeline Dot */}
                      <div className={`w-2.5 h-2.5 rounded-full ${config.dot} ring-4 ring-white shrink-0 relative z-10`} />

                      {/* Content */}
                      <p className="text-xs font-medium text-slate-600 truncate leading-tight group-hover:text-slate-900 transition-colors">
                        {text}
                      </p>
                    </div>

                    {/* Right Aligned Time */}
                    <span className="text-[10px] text-slate-400 font-mono font-semibold shrink-0">
                      {formatTime(item.createdAt)}
                    </span>
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
