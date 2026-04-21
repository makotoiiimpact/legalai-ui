"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import MatchupSection from "@/components/MatchupCard";
import { ApiError, api } from "@/lib/api";
import { caseDisplayName, formatDate, formatFileSize, relativeTime } from "@/lib/case-helpers";
import type { CaseDetail, DataTier, EntityCandidate, Matchup } from "@/lib/types";

const ROLE_LABEL: Record<EntityCandidate["role"], string> = {
  judge: "Judge",
  prosecutor: "Prosecutor",
  defense_attorney: "Defense",
  co_counsel: "Co-counsel",
  defendant: "Defendant",
  officer: "Officer",
  witness: "Witness",
  expert: "Expert",
};

const TIER_LABEL: Record<DataTier, string> = {
  tier_0_public: "Tier 0 (public record)",
  tier_1_ai_extracted: "Tier 1 (your upload)",
  tier_2_manual: "Tier 2 (manual entry)",
  tier_3_graph_derived: "Tier 3 (cross-case inference)",
};

export default function CaseViewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [matchup, setMatchup] = useState<Matchup | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getCase(caseId), api.getMatchup(caseId)])
      .then(([c, m]) => {
        if (cancelled) return;
        setCaseData(c);
        setMatchup(m);
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

  // Dispatch based on review status.
  useEffect(() => {
    if (!caseData) return;
    if (caseData.reviewStatus === "processing") {
      router.replace(`/cases/${caseId}/processing`);
    } else if (caseData.reviewStatus === "needs_review" || caseData.reviewStatus === "in_review") {
      router.replace(`/cases/${caseId}/review`);
    }
  }, [caseData, caseId, router]);

  if (!caseData) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-96 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (caseData.reviewStatus === "shell") {
    return <ShellCaseView caseData={caseData} />;
  }

  const confirmedDate = formatDate(caseData.updatedAt);
  const people = groupPeople(caseData.entities);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="mb-6">
        <Link href="/cases" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back to Cases
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          {caseData.caseName ? `State v. ${caseData.caseName}` : caseDisplayName(caseData)}
        </h1>
        <p className="mt-1 font-mono text-sm text-slate-500">
          {caseData.caseNumber}
          {caseData.court ? ` · ${caseData.court}` : ""}
          {caseData.courtDept ? `, ${caseData.courtDept}` : ""}
        </p>
        {caseData.charges.length > 0 ? (
          <p className="mt-1 text-sm text-slate-600">
            {caseData.charges[0].text}
            {caseData.filedDate ? ` · Filed ${formatDate(caseData.filedDate)}` : ""}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-slate-400">
          Data: {TIER_LABEL[caseData.dataTier]}
          {confirmedDate ? ` · Confirmed ${confirmedDate}` : ""}
        </p>
      </div>

      <div className="space-y-8">
        <MatchupSection
          matchup={matchup}
          caseContext={{ caseName: caseData.caseName, courtDept: caseData.courtDept ?? null }}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">People</h2>
          <dl className="mt-4 divide-y divide-slate-100">
            {(["judge", "prosecutor", "defense_attorney", "defendant", "officer", "witness", "expert"] as EntityCandidate["role"][]).map((role) => {
              const items = people[role];
              if (!items || items.length === 0) return null;
              return (
                <div key={role} className="grid grid-cols-[140px_1fr] gap-4 py-3 text-sm">
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {ROLE_LABEL[role]}
                  </dt>
                  <dd className="space-y-1.5">
                    {items.map((e) => (
                      <PersonRow key={e.id} entity={e} caseId={caseId} />
                    ))}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        {caseData.charges.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Charges</h2>
            <ol className="mt-4 space-y-2">
              {caseData.charges.map((c, i) => (
                <li key={c.id} className="flex items-baseline gap-2 text-sm">
                  <span className="font-mono text-xs text-slate-400">{i + 1}.</span>
                  <span className="text-slate-900">{c.text}</span>
                  {c.statute ? <span className="text-xs text-slate-500">({c.statute})</span> : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Documents</h2>
          <ul className="mt-4 space-y-2">
            {caseData.documents.map((d) => (
              <li
                key={d.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 px-3 py-2.5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl" aria-hidden>
                    📄
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{d.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {d.pageCount ? `${d.pageCount} pages` : formatFileSize(d.sizeBytes)} ·
                      Uploaded {relativeTime(d.uploadedAt)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500"
                >
                  View
                </button>
              </li>
            ))}
          </ul>
          <Link
            href="/cases/new"
            className="mt-4 inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            + Upload another document for this case
          </Link>
        </section>
      </div>
    </div>
  );
}

function groupPeople(entities: EntityCandidate[]): Partial<Record<EntityCandidate["role"], EntityCandidate[]>> {
  const g: Partial<Record<EntityCandidate["role"], EntityCandidate[]>> = {};
  for (const e of entities) {
    (g[e.role] ??= []).push(e);
  }
  return g;
}

function PersonRow({ entity, caseId }: { entity: EntityCandidate; caseId: string }) {
  const detail = [];
  if (entity.isFirmMember) detail.push("you");
  else if (entity.matchedPriorCases && entity.matchedPriorCases > 0) {
    detail.push(`${entity.matchedPriorCases} case${entity.matchedPriorCases === 1 ? "" : "s"} in system`);
  }

  return (
    <div className="group flex items-start justify-between gap-3">
      <div>
        <p className="font-medium text-slate-900">
          {entity.extractedName}
          {entity.isFirmMember ? <span className="ml-2 text-xs font-normal text-slate-500">(you)</span> : null}
        </p>
        {detail.length > 0 ? (
          <p className="mt-0.5 text-xs text-slate-500">{detail.join(" · ")}</p>
        ) : null}
      </div>
      {!entity.isFirmMember ? (
        <Link
          href={`/cases/${caseId}/review`}
          className="opacity-0 transition-opacity group-hover:opacity-100 text-xs text-slate-500 hover:text-slate-800"
        >
          Edit
        </Link>
      ) : null}
    </div>
  );
}

// ---------- Shell case ----------

function ShellCaseView({ caseData }: { caseData: CaseDetail }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6">
        <Link href="/cases" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back to Cases
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          {caseData.caseNumber || "New Case"}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Data: {TIER_LABEL[caseData.dataTier]} · Created {relativeTime(caseData.updatedAt)}
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-900">No document uploaded yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Upload a filing to auto-extract entities, or add them manually later.
        </p>
        <Link
          href="/cases/new"
          className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Upload a filing
        </Link>
      </div>
    </div>
  );
}
