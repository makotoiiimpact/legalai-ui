"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import CaseList from "@/components/CaseList";
import NewCaseDialog from "@/components/NewCaseDialog";
import { Button } from "@/components/ui/button";
import { ApiError, api, type Case } from "@/lib/api";

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams<{ caseId?: string }>();
  const activeId = params?.caseId ?? null;
  const [cases, setCases] = useState<Case[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Failed to load cases";
      toast.error(msg);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .getCases()
      .then((data) => {
        if (!cancelled) setCases(data);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.detail : "Failed to load cases";
        toast.error(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <>
      <aside className="w-60 shrink-0 bg-slate-900 text-slate-200 flex flex-col h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-slate-800">
          <Link href="/cases" className="block">
            <p className="text-xs uppercase tracking-widest text-slate-400">LegalAI</p>
            <p className="text-sm font-semibold text-white mt-0.5">Ogata Law</p>
          </Link>
        </div>

        <nav className="px-2 py-3 border-b border-slate-800">
          <Link
            href="/cases"
            className={`block rounded-md px-3 py-2 text-sm transition-colors ${
              pathname === "/cases"
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            Cases
          </Link>
        </nav>

        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">
            Case Queue
          </span>
          <Button size="sm" variant="ghost" onClick={() => setDialogOpen(true)}>
            <span className="text-slate-300">+ New</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          <CaseList cases={cases} activeId={activeId} />
        </div>
      </aside>

      <NewCaseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={load}
      />
    </>
  );
}
