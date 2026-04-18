import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Case } from "@/lib/api";

function statusTone(s: string): "gray" | "purple" | "green" | "neutral" {
  if (s === "intake") return "gray";
  if (s === "review") return "purple";
  if (s === "complete") return "green";
  return "neutral";
}

export default function CaseHeader({ case: c }: { case: Case }) {
  return (
    <header className="border-b border-slate-200 bg-white px-8 py-5">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">{c.case_number}</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{c.client_name}</h1>
          {c.charge ? (
            <p className="mt-1 text-sm text-slate-600">
              {c.charge}
              {c.charge_severity ? (
                <span className="text-slate-400"> — {c.charge_severity}</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={statusTone(c.status)}>{c.status}</Badge>
          {c.status === "complete" ? (
            <Link
              href={`/cases/${c.id}/memo`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View Memo →
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
