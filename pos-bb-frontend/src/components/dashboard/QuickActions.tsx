import React from "react";
import Link from "next/link";

const actions = [
  { label: "New Work Order", href: "/work-orders/new" },
  { label: "New Customer", href: "/customers" },
  { label: "Create Invoice", href: "/invoices" },
];

export const QuickActions: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-150"
        >
          + {action.label}
        </Link>
      ))}
    </div>
  );
};
