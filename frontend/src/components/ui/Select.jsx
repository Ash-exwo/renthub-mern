import React, { forwardRef } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";

export const Select = forwardRef(function Select(
  {
    label,
    id,
    name,
    value,
    defaultValue,
    onChange,
    options = [],
    placeholder = "Select an option",
    helperText,
    error,
    required = false,
    disabled = false,
    className = "",
    children,
    ...props
  },
  ref
) {
  const selectId = id || name || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`flex flex-col gap-1.5 w-full text-left ${disabled ? "opacity-60 pointer-events-none" : ""} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-[var(--color-espresso)] flex items-center gap-1">
          {label}
          {required && <span className="text-[var(--color-terracotta)]" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          className={`w-full min-h-[44px] py-2.5 pl-3.5 pr-10 text-sm rounded-xl font-[var(--font-sans)] bg-[var(--color-surface)] text-[var(--color-espresso)] border appearance-none cursor-pointer transition-all duration-150 focus:outline-none disabled:bg-[var(--color-surface-secondary)] disabled:cursor-not-allowed ${
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : "border-[var(--color-border)] hover:border-[var(--color-secondary-text)] focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-indigo-500/25"
          }`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.length > 0
            ? options.map((opt) => {
                const optValue = typeof opt === "string" ? opt : opt.value;
                const optLabel = typeof opt === "string" ? opt : opt.label;
                return (
                  <option key={optValue} value={optValue}>
                    {optLabel}
                  </option>
                );
              })
            : children}
        </select>

        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--color-muted-grey)] pointer-events-none">
          <ChevronDown size={18} />
        </span>
      </div>

      {error ? (
        <p id={`${selectId}-error`} className="flex items-center gap-1.5 text-xs text-red-600 mt-0.5" role="alert">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={`${selectId}-helper`} className="text-xs text-[var(--color-muted-grey)] mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Select;
