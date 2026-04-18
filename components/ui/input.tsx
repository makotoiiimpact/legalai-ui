import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className = "", ...rest },
  ref,
) {
  const reactId = React.useId();
  const fieldId = id ?? reactId;
  const base =
    "w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400";
  const borderClass = error ? "border-red-500" : "border-slate-300";
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={fieldId} className="text-xs font-semibold text-slate-700">
          {label}
        </label>
      ) : null}
      <input ref={ref} id={fieldId} className={`${base} ${borderClass} ${className}`} {...rest} />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});
