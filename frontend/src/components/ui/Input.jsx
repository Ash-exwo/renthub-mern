import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export const Input = forwardRef(function Input(
  {
    label,
    id,
    name,
    type = "text",
    value,
    defaultValue,
    onChange,
    placeholder,
    helperText,
    error,
    required = false,
    disabled = false,
    prefixIcon: PrefixIcon,
    suffixIcon: SuffixIcon,
    onSuffixClick,
    className = "",
    autoComplete,
    min,
    max,
    step,
    ...props
  },
  ref
) {
  const inputId = id || name || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`flex flex-col gap-1.5 w-full text-left ${disabled ? "opacity-60 pointer-events-none" : ""} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[var(--color-espresso)] flex items-center gap-1">
          {label}
          {required && <span className="text-[var(--color-brand-primary)]" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {PrefixIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--color-muted-grey)] pointer-events-none">
            <PrefixIcon size={18} />
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          className={`w-full min-h-[44px] py-2.5 px-3.5 text-sm rounded-xl font-[var(--font-sans)] bg-[var(--color-surface)] text-[var(--color-espresso)] placeholder-[var(--color-muted-grey)] border transition-all duration-150 focus:outline-none disabled:bg-[var(--color-surface-secondary)] disabled:cursor-not-allowed ${
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              : "border-[var(--color-border)] hover:border-[var(--color-secondary-text)] focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-indigo-500/25"
          } ${PrefixIcon ? "pl-10" : ""} ${SuffixIcon ? "pr-10" : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />

        {SuffixIcon && (
          <button
            type="button"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--color-muted-grey)] hover:text-[var(--color-espresso)] cursor-pointer transition-colors"
            onClick={onSuffixClick}
            tabIndex={onSuffixClick ? 0 : -1}
            aria-label="Toggle input action"
          >
            <SuffixIcon size={18} />
          </button>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="flex items-center gap-1.5 text-xs text-rose-600 mt-0.5" role="alert">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-xs text-[var(--color-muted-grey)] mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
