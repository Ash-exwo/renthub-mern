import React from "react";

export function Tabs({
  tabs = [], // [{ id, label, icon: Icon, count }]
  activeTab,
  onChange,
  variant = "pill", // pill, underline
  className = "",
}) {
  const containerClasses =
    variant === "underline"
      ? "flex items-center gap-6 overflow-x-auto border-b border-[var(--color-border)] w-full"
      : "flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-full bg-[var(--color-surface-secondary)] w-fit max-w-full border border-[var(--color-border)]";

  return (
    <div className={`${containerClasses} ${className}`.trim()} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        const tabClasses =
          variant === "underline"
            ? `inline-flex items-center gap-2 py-3 text-sm font-semibold border-b-2 -mb-px cursor-pointer transition-colors duration-150 whitespace-nowrap ${
                isActive
                  ? "border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] font-bold"
                  : "border-transparent text-[var(--color-muted-grey)] hover:text-[var(--color-espresso)]"
              }`
            : `inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? "bg-[var(--color-surface)] text-[var(--color-espresso)] shadow-md shadow-black/5 dark:shadow-black/20 border border-[var(--color-border)]"
                  : "text-[var(--color-muted-grey)] hover:text-[var(--color-espresso)]"
              }`;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={tabClasses}
            onClick={() => onChange(tab.id)}
          >
            {Icon && <Icon size={15} className="shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-[var(--color-brand-primary)]">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
