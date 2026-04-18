"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, api, type AuditEntry } from "@/lib/api";

function actionTone(action: string): string {
  const a = action.toUpperCase();
  if (a.includes("CONFIRM")) return "text-green-700";
  if (a.includes("EDIT")) return "text-amber-700";
  if (a.includes("REJECT")) return "text-red-700";
  if (a.includes("APPROV")) return "text-blue-700";
  return "text-slate-700";
}

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function AuditLogTab({ caseId }: { caseId: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getAuditLog(caseId)
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setEntries(sorted);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.detail : "Failed to load audit log";
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  if (loading && entries.length === 0) {
    return <div className="h-24 animate-pulse rounded bg-slate-200" />;
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No audit entries yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-2.5">Time</th>
            <th className="px-4 py-2.5">Action</th>
            <th className="px-4 py-2.5">Actor</th>
            <th className="px-4 py-2.5">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((e) => (
            <tr key={e.id}>
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                {fmtTime(e.created_at)}
              </td>
              <td className={`px-4 py-3 font-medium ${actionTone(e.action)}`}>
                {e.action}
              </td>
              <td className="px-4 py-3 text-slate-700">{e.actor_name || e.actor}</td>
              <td className="px-4 py-3 text-slate-600">{e.note ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
