import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, hint, id, className = "", ...rest }, ref) {
    const reactId = React.useId();
    const fieldId = id ?? reactId;
    const base =
      "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400";
    return (
      <div className="flex flex-col gap-1">
        {label ? (
          <label htmlFor={fieldId} className="text-xs font-semibold text-slate-700">
            {label}
          </label>
        ) : null}
        <textarea ref={ref} id={fieldId} className={`${base} ${className}`} {...rest} />
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </div>
    );
  },
);
