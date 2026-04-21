"use client";

import { useState } from "react";
import type { EntityCandidate, ExtractionConfidence } from "@/lib/types";

const ROLE_LABEL: Record<EntityCandidate["role"], string> = {
  judge: "Judge",
  prosecutor: "Prosecutor",
  defense_attorney: "Defense Attorney",
  co_counsel: "Co-counsel",
  defendant: "Defendant",
  officer: "Officer",
  witness: "Witness",
  expert: "Expert",
};

const CONFIDENCE_LABEL: Record<ExtractionConfidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const CONFIDENCE_CLASS: Record<ExtractionConfidence, string> = {
  high: "text-emerald-700",
  medium: "text-amber-700",
  low: "text-slate-500",
};

interface Props {
  entity: EntityCandidate;
  busy?: boolean;
  onConfirm: () => void;
  onCorrect: () => void;
  onEdit: (name: string) => void;
  onResolveAmbiguous: (pickedEntityId: string | null) => void;
}

export default function EntityCard({ entity, busy, onConfirm, onCorrect, onEdit, onResolveAmbiguous }: Props) {
  const isFirmMember = entity.matchStatus === "auto_confirmed" || entity.isFirmMember;
  const isAmbiguous = entity.matchStatus === "ambiguous" && !!entity.alternatives?.length;
  const confirmed = entity.reviewStatus === "confirmed" || entity.reviewStatus === "edited";

  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm transition-colors ${
        confirmed ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <Avatar role={entity.role} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {ROLE_LABEL[entity.role]}
          </p>
          <p className="mt-0.5 text-base font-semibold text-slate-900">
            {isAmbiguous ? `"${entity.extractedName}" extracted from document` : entity.extractedName}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <MatchStatusLine entity={entity} />
            <span className={`${CONFIDENCE_CLASS[entity.confidence]} font-medium`}>
              · Confidence: {CONFIDENCE_LABEL[entity.confidence]}
              {isAmbiguous && entity.alternatives
                ? ` — ${entity.alternatives.length} possible matches`
                : ""}
            </span>
          </div>

          {isAmbiguous && entity.alternatives ? (
            <AmbiguousPicker
              alternatives={entity.alternatives}
              busy={busy}
              onPick={onResolveAmbiguous}
            />
          ) : (
            <CardActions
              entity={entity}
              busy={busy}
              isFirmMember={!!isFirmMember}
              confirmed={confirmed}
              onConfirm={onConfirm}
              onCorrect={onCorrect}
              onEdit={onEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CardActions({
  entity,
  busy,
  isFirmMember,
  confirmed,
  onConfirm,
  onCorrect,
  onEdit,
}: {
  entity: EntityCandidate;
  busy?: boolean;
  isFirmMember: boolean;
  confirmed: boolean;
  onConfirm: () => void;
  onCorrect: () => void;
  onEdit: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entity.extractedName);

  if (isFirmMember && entity.reviewStatus === "confirmed") {
    return (
      <div className="mt-3">
        <span className="inline-flex items-center rounded-md bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-800">
          ✓ Auto-confirmed
        </span>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <input
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          disabled={busy || !draft.trim()}
          onClick={() => {
            onEdit(draft.trim());
            setEditing(false);
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="text-xs text-slate-500 hover:text-slate-700"
          onClick={() => {
            setEditing(false);
            setDraft(entity.extractedName);
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={onConfirm}
        className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          confirmed
            ? "bg-emerald-100 text-emerald-800"
            : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        }`}
      >
        {confirmed ? "✓ Confirmed" : "✓ Confirm"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onCorrect}
        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        ✕ Wrong
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setDraft(entity.extractedName);
          setEditing(true);
        }}
        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        ✎ Edit
      </button>
    </div>
  );
}

function AmbiguousPicker({
  alternatives,
  busy,
  onPick,
}: {
  alternatives: NonNullable<EntityCandidate["alternatives"]>;
  busy?: boolean;
  onPick: (entityId: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-slate-700">Which one?</p>
      <div className="mt-2 space-y-2">
        {alternatives.map((alt) => (
          <label
            key={alt.entityId}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              selected === alt.entityId
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="ambiguous-pick"
              className="mt-1"
              checked={selected === alt.entityId}
              onChange={() => setSelected(alt.entityId)}
            />
            <div>
              <p className="font-medium text-slate-900">
                {alt.name}
                {alt.jurisdiction ? (
                  <span className="ml-2 text-xs text-slate-500">· {alt.jurisdiction}</span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {alt.priorCases} prior case{alt.priorCases === 1 ? "" : "s"} in your system
              </p>
            </div>
          </label>
        ))}
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
            selected === "__new__"
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <input
            type="radio"
            name="ambiguous-pick"
            className="mt-1"
            checked={selected === "__new__"}
            onChange={() => setSelected("__new__")}
          />
          <p className="font-medium text-slate-700">Neither — this is someone new</p>
        </label>
      </div>
      <button
        type="button"
        disabled={busy || !selected}
        onClick={() => onPick(selected === "__new__" ? null : selected)}
        className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        Confirm Selection
      </button>
    </div>
  );
}

function MatchStatusLine({ entity }: { entity: EntityCandidate }) {
  if (entity.matchStatus === "matched") {
    const cases = entity.matchedPriorCases;
    if (cases && cases > 0) {
      return (
        <span className="text-indigo-700">
          ⚡ Matched: {cases} prior case{cases === 1 ? "" : "s"} in your system
        </span>
      );
    }
    return <span className="text-indigo-700">⚡ Matched in your system</span>;
  }
  if (entity.matchStatus === "auto_confirmed") {
    return <span className="text-emerald-700">⚡ Matched: firm member</span>;
  }
  if (entity.matchStatus === "ambiguous") {
    return <span className="text-amber-700">⚠ Multiple possible matches</span>;
  }
  return <span className="text-slate-500">◌ New: not yet in your system</span>;
}

function Avatar({ role }: { role: EntityCandidate["role"] }) {
  const initial = ROLE_LABEL[role].charAt(0);
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
      {initial}
    </div>
  );
}
