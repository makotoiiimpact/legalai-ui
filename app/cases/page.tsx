"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import CasesList from "@/components/CasesList";
import { ApiError, api } from "@/lib/api";
import type { CaseSummary } from "@/lib/types";

export default function CasesPage() {
  const [cases, setCases] = useState<CaseSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const next = await api.listCases();
        if (cancelled) return;
        setCases(next);
        const hasProcessing = next.some((c) => c.reviewStatus === "processing");
        // Keep polling while any case is still extracting — this lets
        // Martinez move from Processing → Needs Review automatically.
        timer = setTimeout(tick, hasProcessing ? 1500 : 6000);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.detail : "Failed to load cases";
        toast.error(msg);
        timer = setTimeout(tick, 6000);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!cases) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-8 h-72 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return <CasesList cases={cases} />;
}
