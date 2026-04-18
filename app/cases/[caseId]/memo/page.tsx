"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { ApiError, api, parsePriorityFindings, type Memo } from "@/lib/api";
import { usePoll } from "@/lib/usePoll";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MemoViewer from "@/components/MemoViewer";
import ApproveMemoDialog from "@/components/ApproveMemoDialog";

function pathLabel(path: string): string {
  const map: Record<string, string> = {
    suppression_motion: "Suppression Motion",
    plea_negotiate: "Plea Negotiate",
    trial: "Trial",
    dismiss: "Dismiss",
  };
  return map[path] ?? path;
}

export default function MemoPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const [approveOpen, setApproveOpen] = useState(false);

  const fetchMemo = useCallback(() => api.getMemo(caseId), [caseId]);

  const { data: memo, error } = usePoll<Memo>(
    fetchMemo,
    {
      intervalMs: 4000,
      shouldStop: (m) => m !== null && m !== undefined,
      swallowStatus: [404],
    },
    [caseId],
  );

  if (!memo) {
    if (error && !(error instanceof ApiError && error.status === 404)) {
      return (
        <div className="p-10">
          <p className="text-sm text-red-600">Failed to load memo: {error.message}</p>
          <Link
            href={`/cases/${caseId}`}
            className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to case
          </Link>
        </div>
      );
    }
    return (
      <div className="p-10">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="h-6 w-60 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 h-40 animate-pulse rounded bg-slate-200" />
          <p className="text-sm text-slate-500">Generating memo…</p>
        </div>
      </div>
    );
  }

  const priority = parsePriorityFindings(memo);
  const approved = memo.attorney_approved;

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-8 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href={`/cases/${caseId}`}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              ← Back to case
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              Disposition Memo
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge tone="indigo">{pathLabel(memo.recommended_path)}</Badge>
              {approved ? (
                <Badge tone="green">✓ APPROVED</Badge>
              ) : (
                <Badge tone="amber">AWAITING ATTORNEY APPROVAL</Badge>
              )}
              <span className="text-xs text-slate-500">Version {memo.version}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto grid max-w-6xl grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 px-8 py-8">
          <div className="rounded-lg border border-slate-200 bg-white p-8">
            <MemoViewer content={memo.draft_content} />
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Priority Findings
              </h2>
              {priority.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">None flagged.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {priority.map((p, i) => (
                    <li key={i} className="text-sm">
                      <p className="font-medium text-slate-900">{p.label}</p>
                      {p.summary ? (
                        <p className="mt-0.5 text-xs text-slate-600">{p.summary}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {approved ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-700">
                  Approved
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {memo.approved_by}
                </p>
                {memo.approved_at ? (
                  <p className="text-xs text-slate-600">
                    {new Date(memo.approved_at).toLocaleString()}
                  </p>
                ) : null}
                {memo.attorney_notes ? (
                  <p className="mt-2 text-sm text-slate-700">{memo.attorney_notes}</p>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>

        {!approved ? (
          <div className="sticky bottom-0 border-t border-slate-200 bg-white px-8 py-4">
            <div className="mx-auto flex max-w-6xl justify-end">
              <Button
                variant="attorney"
                size="lg"
                onClick={() => setApproveOpen(true)}
              >
                Approve Memo
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <ApproveMemoDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        caseId={caseId}
      />
    </div>
  );
}
