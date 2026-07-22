import React from "react";

interface ReportsTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ReportsTabs: React.FC<ReportsTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    { id: "revenue", label: "Revenue" },
    { id: "work-orders", label: "Work Orders" },
    { id: "services", label: "Services" },
    { id: "spare-parts", label: "Spare Parts" },
    { id: "customers", label: "Customers" },
  ];

  return (
    <div className="border-b border-slate-200">
      <nav className="flex flex-wrap -mb-px gap-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-bold text-sm whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
