import React, { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string; // e.g. "max-w-4xl" (960px) or "max-w-5xl" (1024px)
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  maxWidthClassName = "max-w-4xl", // Defaults to enterprise size
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fadeIn">
      {/* Backdrop click closer */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Modal Container */}
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidthClassName} overflow-hidden flex flex-col max-h-[85vh] border border-slate-200/80 animate-scaleUp z-10`}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start gap-4">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              {icon}
            </div>
          )}
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 leading-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-400 font-medium">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar-light">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
