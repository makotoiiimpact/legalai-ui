"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CaseSummary } from "@/lib/types";
import { caseDisplayName, relativeTime, statusPath, STATUS_LABEL } from "@/lib/case-helpers";
import { StatusDot } from "./StatusDot";

type View = "list" | "board";

interface Props {
  cases: CaseSummary[];
}

export default function CasesList({ cases }: Props) {
  const [view, setView] = useState<View>("list");

  const hasAny = cases.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Your Cases</h1>
          <p className="mt-1 text-sm text-slate-500">
            {hasAny ? `${cases.length} total · sorted by priority` : "No cases yet"}
          </p>
        </div>
        {hasAny ? <ViewToggle value={view} onChange={setView} /> : null}
      </div>

      {hasAny ? (
        view === "list" ? (
          <ListView cases={cases} />
        ) : (
          <BoardView cases={cases} />
        )
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

// ---------- List view ----------

function ListView({ cases }: { cases: CaseSummary[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-5 py-3 w-40">Status</th>
            <th className="px-5 py-3">Case</th>
            <th className="px-5 py-3 w-32">Entities</th>
            <th className="px-5 py-3 w-40">Updated</th>
            <th className="px-5 py-3 w-40 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <ListRow key={c.id} c={c} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListRow({ c }: { c: CaseSummary }) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
      <td className="px-5 py-4 align-top">
        <div className="flex items-center gap-2">
          <StatusDot status={c.reviewStatus} />
          <span className="text-sm font-medium text-slate-700">{STATUS_LABEL[c.reviewStatus]}</span>
        </div>
      </td>
      <td className="px-5 py-4 align-top">
        <Link href={statusPath(c)} className="group block">
          <div className="text-sm font-medium text-slate-900 group-hover:text-blue-700">
            {caseDisplayName(c)}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">{c.caseNumber || "—"}</span>
            {c.courtDept ? <span>· {c.courtDept}</span> : null}
            {c.ambiguousCount ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                ⚠ {c.ambiguousCount} ambiguous
              </span>
            ) : null}
          </div>
        </Link>
      </td>
      <td className="px-5 py-4 align-top">
        <EntitiesProgress summary={c} />
      </td>
      <td className="px-5 py-4 align-top text-xs text-slate-500">{relativeTime(c.updatedAt)}</td>
      <td className="px-5 py-4 align-top text-right">
        {c.reviewStatus === "confirmed" && c.hasMatchupData ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
            <span aria-hidden>⚡</span> matchup ready
          </span>
        ) : null}
      </td>
    </tr>
  );
}

function EntitiesProgress({ summary }: { summary: CaseSummary }) {
  if (summary.reviewStatus === "processing") {
    return <span className="text-xs font-mono text-slate-400">◌◌◌◌</span>;
  }
  if (summary.entityCount === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const pct = (summary.confirmedCount / summary.entityCount) * 100;
  return (
    <div>
      <div className="text-xs font-mono text-slate-700">
        {summary.confirmedCount}/{summary.entityCount}
      </div>
      <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-emerald-500 transition-[width]"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

// ---------- Board view ----------

const BOARD_COLUMNS: Array<{
  id: "processing" | "needs_review" | "in_review" | "confirmed";
  label: string;
  tone: string;
}> = [
  { id: "processing", label: "Processing", tone: "bg-blue-50 text-blue-700" },
  { id: "needs_review", label: "Needs Review", tone: "bg-amber-50 text-amber-700" },
  { id: "in_review", label: "In Review", tone: "bg-indigo-50 text-indigo-700" },
  { id: "confirmed", label: "Confirmed", tone: "bg-emerald-50 text-emerald-700" },
];

function BoardView({ cases }: { cases: CaseSummary[] }) {
  const grouped = useMemo(() => {
    const g: Record<string, CaseSummary[]> = {};
    for (const c of cases) {
      if (c.reviewStatus === "shell") continue; // shells don't show on board
      (g[c.reviewStatus] ??= []).push(c);
    }
    return g;
  }, [cases]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {BOARD_COLUMNS.map((col) => {
        const col_cases = grouped[col.id] ?? [];
        return (
          <div key={col.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${col.tone}`}>
                {col.label}
              </span>
              <span className="text-xs text-slate-400">{col_cases.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {col_cases.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white/40 px-3 py-4 text-center text-xs text-slate-400">
                  Empty
                </div>
              ) : (
                col_cases.map((c) => <BoardCard key={c.id} c={c} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BoardCard({ c }: { c: CaseSummary }) {
  return (
    <Link
      href={statusPath(c)}
      className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow"
    >
      <div className="text-sm font-medium text-slate-900">{caseDisplayName(c)}</div>
      <div className="mt-1 font-mono text-[11px] text-slate-500">{c.caseNumber || "—"}</div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        {c.reviewStatus === "processing" ? (
          <span className="font-mono text-slate-400">◌◌◌◌</span>
        ) : c.entityCount > 0 ? (
          <span className="font-mono">
            {c.confirmedCount}/{c.entityCount} entities
          </span>
        ) : (
          <span className="text-slate-400">No entities</span>
        )}
        {c.reviewStatus === "confirmed" && c.hasMatchupData ? (
          <span aria-hidden className="text-indigo-600">⚡ matchup</span>
        ) : null}
      </div>
    </Link>
  );
}

// ---------- Empty state ----------

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-10 py-16 text-center">
      <h2 className="text-lg font-semibold text-slate-900">No cases yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        Add your first case to start building your firm&apos;s intelligence.
      </p>
      <div className="mt-6">
        <Link
          href="/cases/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Add Case
        </Link>
      </div>
      <p className="mx-auto mt-6 max-w-xs text-xs text-slate-400">
        Tip: start with a complaint or indictment. The system will extract the judge, prosecutor, and parties automatically.
      </p>
    </div>
  );
}

// ---------- View toggle ----------

function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const base = "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors";
  const active = "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200";
  const idle = "text-slate-500 hover:text-slate-800";

  return (
    <div role="tablist" aria-label="View toggle" className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
      <button
        role="tab"
        aria-selected={value === "list"}
        onClick={() => onChange("list")}
        className={`${base} ${value === "list" ? active : idle}`}
        type="button"
      >
        <span aria-hidden>≡</span> List
      </button>
      <button
        role="tab"
        aria-selected={value === "board"}
        onClick={() => onChange("board")}
        className={`${base} ${value === "board" ? active : idle}`}
        type="button"
      >
        <span aria-hidden>▦</span> Board
      </button>
    </div>
  );
}
