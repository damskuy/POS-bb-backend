import React from "react";
import Link from "next/link";

const actions = [
  { label: "New Work Order", href: "/work-orders/new", primary: true },
  { label: "New Customer", href: "/customers" },
];

export const QuickActions: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-2 animate-fadeIn">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 ${
            action.primary
              ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
          }`}
        >
          + {action.label}
        </Link>
      ))}
    </div>
  );
};
