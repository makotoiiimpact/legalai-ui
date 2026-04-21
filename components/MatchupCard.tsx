import type {
  ConfidenceTier,
  JudgeMatchup,
  Matchup,
  MotionStat,
  OwnRecord,
  ProsecutorMatchup,
} from "@/lib/types";

const TIER_COPY: Record<
  ConfidenceTier,
  { label: string; tone: "slate" | "indigo" | "emerald" | "violet" }
> = {
  sparse: { label: "Not enough data yet", tone: "slate" },
  building: { label: "Confidence: Building", tone: "indigo" },
  strong: { label: "Confidence: Strong", tone: "emerald" },
  authoritative: { label: "Confidence: Authoritative", tone: "violet" },
};

const TIER_BADGE_CLASS: Record<"slate" | "indigo" | "emerald" | "violet", string> = {
  slate: "bg-slate-100 text-slate-600",
  indigo: "bg-indigo-100 text-indigo-700",
  emerald: "bg-emerald-100 text-emerald-700",
  violet: "bg-violet-100 text-violet-700",
};

export default function MatchupSection({
  matchup,
  caseContext,
}: {
  matchup: Matchup | null;
  caseContext: { caseName: string | null; courtDept: string | null };
}) {
  const hasAnyData = matchup && (matchup.judge || matchup.prosecutor || matchup.ownRecord);

  return (
    <section>
      <div className="flex items-center gap-3">
        <span aria-hidden className="text-xl">
          ⚡
        </span>
        <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
          Matchup Intelligence
        </h2>
        {matchup ? (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
            New
          </span>
        ) : null}
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {caseContext.caseName ? `${caseContext.caseName}` : ""}
        {caseContext.courtDept ? ` · ${caseContext.courtDept}` : ""}
      </p>

      {!hasAnyData ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          Not enough data yet. When you have 2+ cases with the same judge or prosecutor, matchup
          intelligence appears here.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {matchup?.judge ? <JudgeMatchupCard data={matchup.judge} /> : null}
          {matchup?.prosecutor ? <ProsecutorMatchupCard data={matchup.prosecutor} /> : null}
          {matchup?.ownRecord ? <OwnRecordCard data={matchup.ownRecord} /> : null}
        </div>
      )}
    </section>
  );
}

// ---------- Judge ----------

function JudgeMatchupCard({ data }: { data: JudgeMatchup }) {
  return (
    <MatchupCardShell tier={data.tier} title="Judge" name={data.judgeName}>
      <p className="text-xs text-slate-500">
        {data.priorCasesWithYou === 0
          ? `First time facing ${data.judgeName.split(" ").slice(-1)[0]}`
          : `You've appeared before ${data.judgeName.split(" ").slice(-1)[0]} ${data.priorCasesWithYou} times`}
      </p>

      {data.motionStats.length > 0 ? (
        <div className="mt-4 space-y-3">
          {data.motionStats.map((s) => (
            <StatRow key={s.label} stat={s} />
          ))}
          {data.avgDispositionDays ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Avg time to disposition</span>
              <span className="font-mono text-slate-900">{data.avgDispositionDays} days</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {data.patternNarrative ? (
        <blockquote className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-sm italic leading-relaxed text-slate-700">
          {data.patternNarrative}
        </blockquote>
      ) : null}

      <p className="mt-4 text-[11px] text-slate-500">
        Based on {data.priorCasesWithYou} of your cases · {TIER_COPY[data.tier].label}
      </p>

      {data.growthHint ? (
        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          <p className="font-medium text-slate-700">📊 More cases = sharper patterns.</p>
          <p className="mt-1 text-slate-500">
            You have {data.growthHint.totalAvailableCases.toLocaleString()}+ Clark County cases.
            Upload {data.growthHint.casesToNextTier} more {data.judgeName.split(" ").slice(-1)[0]} cases to reach{" "}
            {TIER_COPY[data.growthHint.nextTier].label.replace("Confidence: ", "")} confidence.
          </p>
        </div>
      ) : null}
    </MatchupCardShell>
  );
}

function StatRow({ stat }: { stat: MotionStat }) {
  const pct = stat.total === 0 ? 0 : (stat.granted / stat.total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-700">{stat.label}</span>
        <span className="font-mono text-xs text-slate-700">
          {stat.granted}/{stat.total} granted
        </span>
      </div>
      <BlockBar pct={pct} tone="indigo" />
    </div>
  );
}

// ---------- Prosecutor ----------

function ProsecutorMatchupCard({ data }: { data: ProsecutorMatchup }) {
  const firstName = data.prosecutorName.split(",")[0].trim();
  return (
    <MatchupCardShell tier={data.tier} title="Prosecutor" name={data.prosecutorName}>
      <p className="text-xs text-slate-500">
        {data.priorCasesWithYou === 0
          ? `First time facing ${firstName}`
          : `${data.priorCasesWithYou} prior case${data.priorCasesWithYou === 1 ? "" : "s"}`}
      </p>

      {data.tier === "sparse" ? (
        <>
          <p className="mt-4 text-sm text-slate-500">No pattern data yet.</p>
          {data.placeholderCopy ? (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">{data.placeholderCopy}</p>
          ) : null}
        </>
      ) : null}

      {data.pleaAcceptanceRate !== undefined ? (
        <div className="mt-4 space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700">Plea acceptance rate</span>
              <span className="font-mono text-xs text-slate-700">{data.pleaAcceptanceRate}%</span>
            </div>
            <BlockBar pct={data.pleaAcceptanceRate} tone="emerald" />
          </div>
          {data.trialVsPleaRatio ? (
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">Trial vs. plea</span>
                <span className="font-mono text-xs text-slate-700">
                  {data.trialVsPleaRatio.trial} trial · {data.trialVsPleaRatio.plea} plea
                </span>
              </div>
              <BlockBar
                pct={
                  (data.trialVsPleaRatio.plea /
                    Math.max(1, data.trialVsPleaRatio.plea + data.trialVsPleaRatio.trial)) *
                  100
                }
                tone="indigo"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {data.patternNarrative ? (
        <blockquote className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-sm italic leading-relaxed text-slate-700">
          {data.patternNarrative}
        </blockquote>
      ) : null}

      <p className="mt-4 text-[11px] text-slate-500">
        Based on {data.priorCasesWithYou} case{data.priorCasesWithYou === 1 ? "" : "s"} ·{" "}
        {TIER_COPY[data.tier].label}
      </p>
    </MatchupCardShell>
  );
}

// ---------- Own record ----------

function OwnRecordCard({ data }: { data: OwnRecord }) {
  const total = data.outcomes.reduce((s, o) => s + o.count, 0) || 1;
  return (
    <MatchupCardShell tier="building" title="Your record" name={data.scope}>
      <p className="text-xs text-slate-500">
        {data.caseCount} cases{data.focusCaseType ? ` · ${data.focusCaseType}` : ""}
      </p>
      <div className="mt-4 space-y-3">
        {data.outcomes.map((o) => (
          <div key={o.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{o.label}</span>
              <span className="font-mono text-xs text-slate-700">{o.count}</span>
            </div>
            <BlockBar pct={(o.count / total) * 100} tone={toneForOutcome(o.label)} />
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm">
        <span className="text-slate-600">Win rate (dismissed + reduced)</span>
        <span className="ml-2 font-mono text-base font-semibold text-emerald-700">{data.winRatePct}%</span>
      </div>
    </MatchupCardShell>
  );
}

function toneForOutcome(label: string): BarTone {
  const l = label.toLowerCase();
  if (l.includes("dismiss")) return "emerald";
  if (l.includes("reduc")) return "indigo";
  return "amber";
}

// ---------- Shared shell + bar ----------

type BarTone = "indigo" | "emerald" | "amber";

function MatchupCardShell({
  tier,
  title,
  name,
  children,
}: {
  tier: ConfidenceTier;
  title: string;
  name: string;
  children: React.ReactNode;
}) {
  const tone = TIER_COPY[tier].tone;
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{title}</p>
          <p className="mt-0.5 text-base font-semibold tracking-tight text-slate-900">{name}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TIER_BADGE_CLASS[tone]}`}
        >
          {tier}
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function BlockBar({ pct, tone = "indigo" }: { pct: number; tone?: BarTone }) {
  const blocks = 10;
  const filled = Math.max(0, Math.min(blocks, Math.round((pct / 100) * blocks)));

  const toneClass: Record<BarTone, string> = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
  };
  const dim = "bg-slate-200";

  return (
    <div className="mt-1.5 flex items-center gap-1" aria-hidden>
      {Array.from({ length: blocks }).map((_, i) => (
        <span
          key={i}
          className={`h-2 flex-1 rounded-[2px] ${i < filled ? toneClass[tone] : dim}`}
        />
      ))}
    </div>
  );
}
