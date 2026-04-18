"use client";

import * as React from "react";
import { useEffect } from "react";

type Side = "center" | "right";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  side?: Side;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}

export function Dialog({
  open,
  onClose,
  side = "center",
  children,
  className = "",
  labelledBy,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const panelBase =
    "bg-white shadow-xl ring-1 ring-slate-200 flex flex-col max-h-full overflow-hidden";
  const panelPos =
    side === "right"
      ? "absolute inset-y-0 right-0 w-full max-w-md"
      : "rounded-lg w-full max-w-lg mx-4";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={onClose}
    >
      <div
        className={`${panelBase} ${panelPos} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({
  title,
  onClose,
  id,
}: {
  title: string;
  onClose: () => void;
  id?: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
      <h2 id={id} className="text-base font-semibold text-slate-900">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

export function DialogBody({ className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-5 py-4 overflow-y-auto ${className}`} {...rest} />;
}

export function DialogFooter({ className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50 ${className}`}
      {...rest}
    />
  );
}
