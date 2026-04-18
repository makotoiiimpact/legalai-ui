"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Case } from "@/lib/api";

function caseTypeTone(
  t: string,
): "blue" | "green" | "orange" | "purple" | "red" | "neutral" {
  const v = t.toLowerCase();
  if (v.includes("murder")) return "red";
  if (v.includes("dui")) return "blue";
  if (v.includes("drug")) return "green";
  if (v.includes("assault")) return "orange";
  if (v.includes("domestic")) return "purple";
  return "neutral";
}

function statusTone(s: string): "gray" | "purple" | "green" | "neutral" {
  if (s === "intake") return "gray";
  if (s === "review") return "purple";
  if (s === "complete") return "green";
  return "neutral";
}

interface Props {
  cases: Case[];
  activeId: string | null;
}

export default function CaseList({ cases, activeId }: Props) {
  if (cases.length === 0) {
    return (
      <p className="px-3 py-4 text-xs text-slate-500 italic">No cases yet</p>
    );
  }

  return (
    <ul className="space-y-1 px-2">
      {cases.map((c) => {
        const active = c.id === activeId;
        return (
          <li key={c.id}>
            <Link
              href={`/cases/${c.id}`}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-slate-800 border-l-2 border-blue-400 text-white"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                {c.case_number}
              </div>
              <div className="font-medium truncate">{c.client_name}</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Badge tone={caseTypeTone(c.case_type)}>{c.case_type}</Badge>
                <Badge tone={statusTone(c.status)}>{c.status}</Badge>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
