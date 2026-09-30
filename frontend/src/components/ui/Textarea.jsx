import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export const Textarea = forwardRef(function Textarea(
  {
    label,
    id,
    name,
    value,
    defaultValue,
    onChange,
    placeholder,
    rows = 4,
    helperText,
    error,
    required = false,
    disabled = false,
    className = "",
    ...props
  },
  ref
) {
  const textareaId = id || name || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`flex flex-col gap-1.5 w-full text-left ${disabled ? "opacity-60 pointer-events-none" : ""} ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold text-[var(--color-espresso)] flex items-center gap-1">
          {label}
          {required && <span className="text-[var(--color-terracotta)]" aria-hidden="true">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`w-full py-2.5 px-3.5 text-sm rounded-xl font-[var(--font-sans)] bg-[var(--color-surface)] text-[var(--color-espresso)] placeholder-[var(--color-muted-grey)] border resize-y min-h-[80px] leading-relaxed transition-all duration-150 focus:outline-none disabled:bg-[var(--color-surface-secondary)] disabled:cursor-not-allowed ${
          error
            ? "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            : "border-[var(--color-border)] hover:border-[var(--color-secondary-text)] focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-indigo-500/25"
        }`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        {...props}
      />

      {error ? (
        <p id={`${textareaId}-error`} className="flex items-center gap-1.5 text-xs text-red-600 mt-0.5" role="alert">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={`${textareaId}-helper`} className="text-xs text-[var(--color-muted-grey)] mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Textarea;
