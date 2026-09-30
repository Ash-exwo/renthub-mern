import React from "react";
import { FolderSearch } from "lucide-react";
import Button from "./Button";

export function EmptyState({
  icon: Icon = FolderSearch,
  title = "Nothing found here",
  description = "There are no items matching your criteria. Try adjusting your search or filters.",
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-14 px-6 bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-2xl w-full shadow-sm ${className}`.trim()}>
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 grid place-items-center mb-4 shadow-sm">
        <Icon size={26} />
      </div>
      <h3 className="font-[var(--font-heading)] text-lg font-extrabold text-[var(--color-espresso)] mb-1.5">{title}</h3>
      <p className="text-sm text-[var(--color-muted-grey)] max-w-sm mb-6 leading-relaxed">{description}</p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {actionLabel && (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
