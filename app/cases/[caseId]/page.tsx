"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import CaseHeader from "@/components/CaseHeader";
import DocumentsTab from "@/components/DocumentsTab";
import FindingsTab from "@/components/FindingsTab";
import AuditLogTab from "@/components/AuditLogTab";
import { ApiError, api, type Case } from "@/lib/api";

type Tab = "documents" | "findings" | "audit";

const TABS: { id: Tab; label: string }[] = [
  { id: "documents", label: "Documents" },
  { id: "findings", label: "Findings" },
  { id: "audit", label: "Audit Log" },
];

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [tab, setTab] = useState<Tab>("documents");
  const [analysisJustStarted, setAnalysisJustStarted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getCase(caseId)
      .then((data) => {
        if (!cancelled) setCaseData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.detail : "Failed to load case";
        toast.error(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  if (!caseData) {
    return (
      <div className="p-10">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <CaseHeader case={caseData} />

      <div className="border-b border-slate-200 bg-white px-8">
        <nav className="flex gap-6" role="tablist">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(t.id);
                  if (t.id === "findings") setAnalysisJustStarted(false);
                }}
                className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {tab === "documents" ? (
          <DocumentsTab
            caseId={caseId}
            onAnalysisStarted={() => {
              setAnalysisJustStarted(true);
              setTab("findings");
            }}
          />
        ) : null}
        {tab === "findings" ? (
          <FindingsTab caseId={caseId} analysisJustStarted={analysisJustStarted} />
        ) : null}
        {tab === "audit" ? <AuditLogTab caseId={caseId} /> : null}
      </div>
    </div>
  );
}
