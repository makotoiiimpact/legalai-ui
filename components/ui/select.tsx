import * as React from "react";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, id, className = "", ...rest },
  ref,
) {
  const reactId = React.useId();
  const fieldId = id ?? reactId;
  const base =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400";
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={fieldId} className="text-xs font-semibold text-slate-700">
          {label}
        </label>
      ) : null}
      <select ref={ref} id={fieldId} className={`${base} ${className}`} {...rest}>
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
});
