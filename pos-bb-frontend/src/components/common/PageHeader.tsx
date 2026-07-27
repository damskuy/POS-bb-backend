import React, { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  badge?: string;
  breadcrumbs?: string[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  badge,
  breadcrumbs,
}) => {
  return (
    <div className="flex flex-col gap-4 pb-6 border-b border-slate-200/60 mb-8 animate-fadeIn">
      {/* 1. Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              <span className={i === breadcrumbs.length - 1 ? "text-slate-600 font-bold" : ""}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* 2. Main Title, Subtitle & Actions */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-page-title">
              {title}
            </h1>
            {badge && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-normal text-slate-500 max-w-2xl font-normal">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-3 shrink-0 self-end md:self-start">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

