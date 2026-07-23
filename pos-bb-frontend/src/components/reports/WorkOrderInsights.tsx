import React from "react";

const typeConfig = {
  success: {
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-50 border-emerald-100",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  info: {
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50 border-blue-100",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50 border-amber-100",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
};

interface WorkOrderInsightsProps {
  summary: {
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
}

export const WorkOrderInsights: React.FC<WorkOrderInsightsProps> = ({
  summary,
}) => {
  const total = summary.pending + summary.inProgress + summary.completed + summary.cancelled;
  const completionRate = total > 0 ? Math.round((summary.completed / total) * 100) : 0;

  const insights = [
    {
      id: 1,
      type: "info" as const,
      text: `Total Perintah Kerja (Work Order) yang terdaftar pada periode ini sebanyak ${total} order.`,
    },
    {
      id: 2,
      type: completionRate >= 70 ? ("success" as const) : ("warning" as const),
      text: `Rasio penyelesaian pengerjaan service berada di angka ${completionRate}% dari total target antrean.`,
    },
    {
      id: 3,
      type: summary.pending > 5 ? ("warning" as const) : ("success" as const),
      text:
        summary.pending > 5
          ? `Terdapat ${summary.pending} antrean tertunda (Pending). Segera alokasikan mekanik untuk mempercepat pengerjaan.`
          : "Jumlah antrean pending terkendali dengan baik, efisiensi mekanik terjaga optimal.",
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 113.536 0V21h-2v-5.07z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">Operational Insights</h3>
      </div>

      {/* Insights bullet points */}
      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {insights.map((insight) => {
          const config = typeConfig[insight.type] || typeConfig.info;
          return (
            <div
              key={insight.id}
              className={`flex gap-3 p-3.5 rounded-xl border ${config.bgColor} animate-fadeIn`}
            >
              <div className={`shrink-0 ${config.iconColor}`}>
                {config.icon}
              </div>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                {insight.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
