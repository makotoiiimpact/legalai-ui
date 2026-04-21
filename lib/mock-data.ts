import type {
  CaseDetail,
  CaseSummary,
  EntityCandidate,
  ExtractedField,
  ExtractionStatus,
  Matchup,
} from "./types";

// ---------- Seed data ----------
// Banuelos, Beasley (crim), Beasley (SEC), Davis, Thompson, Martinez (processing), Ramirez (shell)

const nowIso = () => new Date().toISOString();
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

function banuelos(): CaseDetail {
  const entities: EntityCandidate[] = [
    {
      id: "e-banuelos-judge",
      role: "judge",
      extractedName: "William Kephart",
      confidence: "high",
      matchStatus: "matched",
      matchedEntityId: "judge-kephart",
      matchedEntityName: "William Kephart",
      matchedPriorCases: 3,
      reviewStatus: "pending",
      attributionConfidence: "inferred",
    },
    {
      id: "e-banuelos-pros",
      role: "prosecutor",
      extractedName: "John Jones, Deputy District Attorney",
      confidence: "high",
      matchStatus: "new",
      reviewStatus: "pending",
      attributionConfidence: "inferred",
    },
    {
      id: "e-banuelos-def",
      role: "defense_attorney",
      extractedName: "Garrett T. Ogata",
      confidence: "high",
      matchStatus: "auto_confirmed",
      matchedEntityId: "atty-ogata",
      matchedEntityName: "Garrett T. Ogata",
      isFirmMember: true,
      reviewStatus: "confirmed",
      attributionConfidence: "attorney_verified",
    },
    {
      id: "e-banuelos-defendant",
      role: "defendant",
      extractedName: "Carlos Banuelos",
      confidence: "high",
      matchStatus: "new",
      reviewStatus: "pending",
      attributionConfidence: "inferred",
    },
  ];

  const extractedFields: ExtractedField[] = [
    { key: "case_number", label: "Case Number", value: "A-21-841234-1", status: "extracted" },
    { key: "court", label: "Court", value: "Clark County, Dept. 14", status: "extracted" },
    { key: "filed_date", label: "Filed", value: "2021-03-15", status: "extracted" },
    { key: "case_type", label: "Case Type", value: "Criminal – DUI", status: "extracted" },
  ];

  return {
    id: "case-banuelos",
    caseNumber: "A-21-841234-1",
    caseName: "Banuelos",
    court: "Clark County",
    courtDept: "Dept. 14",
    filedDate: "2021-03-15",
    caseType: "Criminal – DUI",
    reviewStatus: "needs_review",
    dataTier: "tier_1_ai_extracted",
    entityCount: 4,
    confirmedCount: 1,
    hasMatchupData: true,
    updatedAt: minsAgo(2),
    extractedFields,
    entities,
    charges: [
      { id: "c-1", text: "DUI – 1st offense", statute: "NRS 484C.110" },
      { id: "c-2", text: "Failure to maintain lane", statute: "NRS 484B.217" },
    ],
    documents: [
      {
        id: "doc-banuelos-complaint",
        name: "Banuelos_complaint.pdf",
        fileType: "pdf",
        pageCount: 3,
        uploadedAt: minsAgo(2),
        sizeBytes: 1_240_000,
      },
    ],
  };
}

function beasleyCrim(): CaseDetail {
  const entities: EntityCandidate[] = [
    {
      id: "e-beasley-crim-judge",
      role: "judge",
      extractedName: "Gloria Navarro",
      confidence: "high",
      matchStatus: "matched",
      matchedEntityId: "judge-navarro",
      matchedEntityName: "Gloria Navarro",
      matchedPriorCases: 2,
      reviewStatus: "confirmed",
      attributionConfidence: "attorney_verified",
    },
    {
      id: "e-beasley-crim-pros",
      role: "prosecutor",
      extractedName: "Rachel Kent, AUSA",
      confidence: "high",
      matchStatus: "matched",
      matchedEntityId: "pros-kent",
      matchedEntityName: "Rachel Kent",
      matchedPriorCases: 5,
      reviewStatus: "confirmed",
      attributionConfidence: "attorney_verified",
    },
    {
      id: "e-beasley-crim-def",
      role: "defense_attorney",
      extractedName: "Garrett T. Ogata",
      confidence: "high",
      matchStatus: "auto_confirmed",
      isFirmMember: true,
      reviewStatus: "confirmed",
      attributionConfidence: "attorney_verified",
    },
    {
      id: "e-beasley-crim-defendant",
      role: "defendant",
      extractedName: "Michael Beasley",
      confidence: "high",
      matchStatus: "new",
      reviewStatus: "confirmed",
      attributionConfidence: "attorney_verified",
    },
    {
      id: "e-beasley-crim-officer",
      role: "officer",
      extractedName: "Sgt. David Ruiz (LVMPD)",
      confidence: "high",
      matchStatus: "matched",
      matchedEntityId: "off-ruiz",
      matchedEntityName: "Sgt. David Ruiz",
      matchedPriorCases: 1,
      reviewStatus: "confirmed",
      attributionConfidence: "attorney_verified",
    },
  ];

  return {
    id: "case-beasley-crim",
    caseNumber: "2:18-cr-00157",
    caseName: "Beasley (crim)",
    court: "US District Court, Nevada",
    courtDept: "Courtroom 7C",
    filedDate: "2018-07-24",
    caseType: "Federal – Criminal",
    reviewStatus: "confirmed",
    dataTier: "tier_1_ai_extracted",
    entityCount: 5,
    confirmedCount: 5,
    hasMatchupData: true,
    updatedAt: hoursAgo(2),
    extractedFields: [
      { key: "case_number", label: "Case Number", value: "2:18-cr-00157", status: "extracted" },
      { key: "court", label: "Court", value: "US District Court, Nevada", status: "extracted" },
      { key: "filed_date", label: "Filed", value: "2018-07-24", status: "extracted" },
      { key: "case_type", label: "Case Type", value: "Federal – Criminal", status: "extracted" },
    ],
    entities,
    charges: [
      { id: "c-bc-1", text: "Wire fraud", statute: "18 U.S.C. § 1343" },
      { id: "c-bc-2", text: "Money laundering", statute: "18 U.S.C. § 1956" },
    ],
    documents: [
      {
        id: "doc-beasley-crim-indictment",
        name: "Beasley_indictment.pdf",
        fileType: "pdf",
        pageCount: 22,
        uploadedAt: hoursAgo(2),
        sizeBytes: 3_400_000,
      },
    ],
  };
}

function beasleySec(): CaseDetail {
  return {
    id: "case-beasley-sec",
    caseNumber: "2:19-cv-01741",
    caseName: "Beasley (SEC)",
    court: "US District Court, Nevada",
    courtDept: "Courtroom 7A",
    filedDate: "2019-10-04",
    caseType: "Federal – Civil (SEC)",
    reviewStatus: "confirmed",
    dataTier: "tier_1_ai_extracted",
    entityCount: 4,
    confirmedCount: 4,
    hasMatchupData: true,
    updatedAt: hoursAgo(2),
    extractedFields: [
      { key: "case_number", label: "Case Number", value: "2:19-cv-01741", status: "extracted" },
      { key: "court", label: "Court", value: "US District Court, Nevada", status: "extracted" },
      { key: "filed_date", label: "Filed", value: "2019-10-04", status: "extracted" },
      { key: "case_type", label: "Case Type", value: "Federal – Civil (SEC)", status: "extracted" },
    ],
    entities: [
      {
        id: "e-bsec-judge",
        role: "judge",
        extractedName: "Andrew Gordon",
        confidence: "high",
        matchStatus: "matched",
        matchedPriorCases: 1,
        matchedEntityName: "Andrew Gordon",
        reviewStatus: "confirmed",
        attributionConfidence: "attorney_verified",
      },
      {
        id: "e-bsec-pros",
        role: "prosecutor",
        extractedName: "Karen Walsh (SEC Enforcement)",
        confidence: "high",
        matchStatus: "new",
        reviewStatus: "confirmed",
        attributionConfidence: "attorney_verified",
      },
      {
        id: "e-bsec-def",
        role: "defense_attorney",
        extractedName: "Garrett T. Ogata",
        confidence: "high",
        matchStatus: "auto_confirmed",
        isFirmMember: true,
        reviewStatus: "confirmed",
        attributionConfidence: "attorney_verified",
      },
      {
        id: "e-bsec-defendant",
        role: "defendant",
        extractedName: "Michael Beasley",
        confidence: "high",
        matchStatus: "matched",
        matchedEntityName: "Michael Beasley",
        matchedPriorCases: 1,
        reviewStatus: "confirmed",
        attributionConfidence: "attorney_verified",
      },
    ],
    charges: [{ id: "c-bs-1", text: "Securities fraud — civil enforcement", statute: "15 U.S.C. § 78j(b)" }],
    documents: [
      {
        id: "doc-bsec-complaint",
        name: "SEC_v_Beasley_complaint.pdf",
        fileType: "pdf",
        pageCount: 41,
        uploadedAt: hoursAgo(2),
        sizeBytes: 5_800_000,
      },
    ],
  };
}

function davis(): CaseDetail {
  return {
    id: "case-davis",
    caseNumber: "A-22-556789-C",
    caseName: "Davis",
    court: "Clark County",
    courtDept: "Dept. 9",
    filedDate: "2022-08-11",
    caseType: "Criminal – Drug",
    reviewStatus: "needs_review",
    dataTier: "tier_1_ai_extracted",
    entityCount: 6,
    confirmedCount: 0,
    hasMatchupData: false,
    ambiguousCount: 1,
    updatedAt: minsAgo(5),
    extractedFields: [
      { key: "case_number", label: "Case Number", value: "A-22-556789-C", status: "extracted" },
      { key: "court", label: "Court", value: "Clark County, Dept. 9", status: "extracted" },
      { key: "filed_date", label: "Filed", value: "2022-08-11", status: "extracted" },
      { key: "case_type", label: "Case Type", value: "Criminal – Drug", status: "extracted" },
    ],
    entities: [
      {
        id: "e-davis-judge",
        role: "judge",
        extractedName: "Kathleen Delaney",
        confidence: "high",
        matchStatus: "new",
        reviewStatus: "pending",
        attributionConfidence: "inferred",
      },
      {
        id: "e-davis-pros",
        role: "prosecutor",
        extractedName: "J. Jones",
        confidence: "medium",
        matchStatus: "ambiguous",
        reviewStatus: "pending",
        attributionConfidence: "inferred",
        alternatives: [
          { entityId: "pros-john-jones", name: "John Jones, DDA", priorCases: 12, jurisdiction: "Clark County" },
          { entityId: "pros-james-jones", name: "James Jones, DDA", priorCases: 2, jurisdiction: "Clark County" },
        ],
      },
      {
        id: "e-davis-def",
        role: "defense_attorney",
        extractedName: "Garrett T. Ogata",
        confidence: "high",
        matchStatus: "auto_confirmed",
        isFirmMember: true,
        reviewStatus: "confirmed",
        attributionConfidence: "attorney_verified",
      },
      {
        id: "e-davis-defendant",
        role: "defendant",
        extractedName: "Jasmine Davis",
        confidence: "high",
        matchStatus: "new",
        reviewStatus: "pending",
        attributionConfidence: "inferred",
      },
      {
        id: "e-davis-officer-1",
        role: "officer",
        extractedName: "Officer M. Chen (LVMPD)",
        confidence: "high",
        matchStatus: "new",
        reviewStatus: "pending",
        attributionConfidence: "inferred",
      },
      {
        id: "e-davis-officer-2",
        role: "officer",
        extractedName: "Officer R. Patel (LVMPD)",
        confidence: "low",
        matchStatus: "new",
        reviewStatus: "pending",
        attributionConfidence: "inferred",
      },
    ],
    charges: [
      { id: "c-davis-1", text: "Possession of controlled substance", statute: "NRS 453.336" },
      { id: "c-davis-2", text: "Trafficking schedule II", statute: "NRS 453.3385" },
    ],
    documents: [
      {
        id: "doc-davis-complaint",
        name: "Davis_complaint.pdf",
        fileType: "pdf",
        pageCount: 7,
        uploadedAt: minsAgo(5),
        sizeBytes: 2_100_000,
      },
    ],
  };
}

function thompson(): CaseDetail {
  return {
    id: "case-thompson",
    caseNumber: "A-23-112233-C",
    caseName: "Thompson",
    court: "Clark County",
    courtDept: "Dept. 14",
    filedDate: "2023-05-02",
    caseType: "Criminal – DUI",
    reviewStatus: "in_review",
    dataTier: "tier_1_ai_extracted",
    entityCount: 6,
    confirmedCount: 2,
    hasMatchupData: true,
    updatedAt: hoursAgo(1),
    extractedFields: [
      { key: "case_number", label: "Case Number", value: "A-23-112233-C", status: "extracted" },
      { key: "court", label: "Court", value: "Clark County, Dept. 14", status: "extracted" },
      { key: "filed_date", label: "Filed", value: "2023-05-02", status: "extracted" },
      { key: "case_type", label: "Case Type", value: "Criminal – DUI", status: "extracted" },
    ],
    entities: [
      {
        id: "e-thomp-judge",
        role: "judge",
        extractedName: "William Kephart",
        confidence: "high",
        matchStatus: "matched",
        matchedPriorCases: 3,
        matchedEntityName: "William Kephart",
        reviewStatus: "confirmed",
        attributionConfidence: "attorney_verified",
      },
      {
        id: "e-thomp-pros",
        role: "prosecutor",
        extractedName: "Maria Alvarez, DDA",
        confidence: "high",
        matchStatus: "new",
        reviewStatus: "pending",
        attributionConfidence: "inferred",
      },
      {
        id: "e-thomp-def",
        role: "defense_attorney",
        extractedName: "Garrett T. Ogata",
        confidence: "high",
        matchStatus: "auto_confirmed",
        isFirmMember: true,
        reviewStatus: "confirmed",
        attributionConfidence: "attorney_verified",
      },
      {
        id: "e-thomp-defendant",
        role: "defendant",
        extractedName: "Lionel Thompson",
        confidence: "high",
        matchStatus: "new",
        reviewStatus: "pending",
        attributionConfidence: "inferred",
      },
      {
        id: "e-thomp-officer",
        role: "officer",
        extractedName: "Trooper D. Hayes (NHP)",
        confidence: "high",
        matchStatus: "new",
        reviewStatus: "pending",
        attributionConfidence: "inferred",
      },
      {
        id: "e-thomp-expert",
        role: "expert",
        extractedName: "Dr. Alan Park, toxicologist",
        confidence: "medium",
        matchStatus: "new",
        reviewStatus: "pending",
        attributionConfidence: "inferred",
      },
    ],
    charges: [
      { id: "c-t-1", text: "DUI – 2nd offense", statute: "NRS 484C.110" },
      { id: "c-t-2", text: "Child endangerment", statute: "NRS 200.508" },
    ],
    documents: [
      {
        id: "doc-thomp-complaint",
        name: "Thompson_complaint.pdf",
        fileType: "pdf",
        pageCount: 4,
        uploadedAt: hoursAgo(1),
        sizeBytes: 1_600_000,
      },
    ],
  };
}

function martinezProcessing(): CaseDetail {
  return {
    id: "case-martinez",
    caseNumber: "A-24-901234-C",
    caseName: "Martinez",
    court: "Clark County",
    courtDept: null,
    filedDate: null,
    caseType: null,
    reviewStatus: "processing",
    dataTier: "tier_1_ai_extracted",
    entityCount: 0,
    confirmedCount: 0,
    hasMatchupData: false,
    updatedAt: minsAgo(0),
    extractedFields: [
      { key: "case_number", label: "Case Number", status: "pending" },
      { key: "court", label: "Court", status: "pending" },
      { key: "filed_date", label: "Filed", status: "pending" },
      { key: "case_type", label: "Case Type", status: "pending" },
    ],
    entities: [],
    charges: [],
    documents: [
      {
        id: "doc-martinez-complaint",
        name: "Martinez_complaint.pdf",
        fileType: "pdf",
        pageCount: 5,
        uploadedAt: minsAgo(0),
        sizeBytes: 1_800_000,
      },
    ],
  };
}

function ramirezShell(): CaseDetail {
  return {
    id: "case-ramirez",
    caseNumber: "A-24-667788-C",
    caseName: null,
    court: null,
    courtDept: null,
    filedDate: null,
    caseType: null,
    reviewStatus: "shell",
    dataTier: "tier_2_manual",
    entityCount: 0,
    confirmedCount: 0,
    hasMatchupData: false,
    updatedAt: hoursAgo(3),
    extractedFields: [
      { key: "case_number", label: "Case Number", value: "A-24-667788-C", status: "extracted" },
      { key: "court", label: "Court", status: "pending" },
      { key: "filed_date", label: "Filed", status: "pending" },
      { key: "case_type", label: "Case Type", status: "pending" },
    ],
    entities: [],
    charges: [],
    documents: [],
  };
}

export const SEED_CASES: CaseDetail[] = [
  martinezProcessing(),
  banuelos(),
  davis(),
  thompson(),
  beasleyCrim(),
  beasleySec(),
  ramirezShell(),
];

// ---------- Matchups ----------

export const MATCHUPS: Record<string, Matchup> = {
  "case-banuelos": {
    caseId: "case-banuelos",
    judge: {
      judgeName: "William Kephart",
      priorCasesWithYou: 4,
      tier: "building",
      motionStats: [
        { label: "Suppression motions", granted: 3, total: 4 },
        { label: "Continuance requests", granted: 2, total: 2 },
      ],
      avgDispositionDays: 94,
      patternNarrative:
        "Kephart tends to grant suppression motions when bodycam evidence is contested. He has denied 1 motion where the stop was based on a 911 caller report.",
      growthHint: {
        totalAvailableCases: 2200,
        casesToNextTier: 10,
        nextTier: "strong",
      },
    },
    prosecutor: {
      prosecutorName: "John Jones, DDA",
      priorCasesWithYou: 1,
      tier: "sparse",
      placeholderCopy:
        "When you've faced Jones on 3+ cases, you'll see plea offer patterns and timing, trial vs. plea tendencies, and charge bargaining behavior.",
    },
    ownRecord: {
      scope: "Dept. 14",
      caseCount: 4,
      focusCaseType: "DUI-focused",
      outcomes: [
        { label: "Dismissed", count: 1 },
        { label: "Reduced charges", count: 2 },
        { label: "Guilty as charged", count: 1 },
      ],
      winRatePct: 75,
    },
  },
  "case-thompson": {
    caseId: "case-thompson",
    judge: {
      judgeName: "William Kephart",
      priorCasesWithYou: 4,
      tier: "building",
      motionStats: [
        { label: "Suppression motions", granted: 3, total: 4 },
        { label: "Continuance requests", granted: 2, total: 2 },
      ],
      avgDispositionDays: 94,
      patternNarrative:
        "Kephart tends to grant suppression motions when bodycam evidence is contested.",
      growthHint: {
        totalAvailableCases: 2200,
        casesToNextTier: 10,
        nextTier: "strong",
      },
    },
  },
  "case-beasley-crim": {
    caseId: "case-beasley-crim",
    judge: {
      judgeName: "Gloria Navarro",
      priorCasesWithYou: 2,
      tier: "sparse",
      motionStats: [
        { label: "Motions to dismiss", granted: 1, total: 2 },
      ],
    },
    prosecutor: {
      prosecutorName: "Rachel Kent, AUSA",
      priorCasesWithYou: 5,
      tier: "building",
      pleaAcceptanceRate: 60,
      trialVsPleaRatio: { trial: 1, plea: 4 },
      patternNarrative:
        "Kent opens with high charge counts and narrows after initial discovery. Plea offered within 45 days of indictment in 4 of 5 cases.",
    },
    ownRecord: {
      scope: "D.Nev federal",
      caseCount: 6,
      focusCaseType: "White-collar",
      outcomes: [
        { label: "Dismissed", count: 1 },
        { label: "Reduced charges", count: 3 },
        { label: "Guilty as charged", count: 2 },
      ],
      winRatePct: 67,
    },
  },
  "case-beasley-sec": {
    caseId: "case-beasley-sec",
    judge: {
      judgeName: "Andrew Gordon",
      priorCasesWithYou: 1,
      tier: "sparse",
      motionStats: [],
    },
  },
};

// ---------- Processing / extraction simulation ----------

export interface ProcessingSession {
  caseId: string;
  target: CaseDetail;
  startedAt: number;
}

export function progressExtraction(session: ProcessingSession): ExtractionStatus {
  const elapsed = Date.now() - session.startedAt;
  const { target } = session;
  const fieldOrder: ExtractedField[] = target.extractedFields;

  // One stage per field + one per entity. Faster at demo scale.
  const STAGE_DELAY_MS = 1100;
  const INITIAL_READ_MS = 800;
  const totalStages = fieldOrder.length + target.entities.length;
  const effective = Math.max(0, elapsed - INITIAL_READ_MS);
  const done = Math.min(totalStages, Math.floor(effective / STAGE_DELAY_MS));

  const fields: ExtractedField[] = fieldOrder.map((f, i) => {
    if (done > i) return { ...f, status: "extracted" };
    return { ...f, status: "pending" };
  });

  const entitiesToReveal = target.entities.slice(0, Math.max(0, done - fieldOrder.length));
  const entities: EntityCandidate[] = entitiesToReveal.map((e) => ({ ...e }));

  const isComplete = done >= totalStages;

  return {
    caseId: session.caseId,
    state: isComplete ? "complete" : elapsed < INITIAL_READ_MS ? "reading" : "extracting",
    fields,
    entities,
    documentName: target.documents[0]?.name ?? "document.pdf",
    documentPageCount: target.documents[0]?.pageCount,
    totalEntitiesFound: entities.length,
    startedAt: new Date(session.startedAt).toISOString(),
  };
}

// ---------- Summaries ----------

export function toSummary(c: CaseDetail): CaseSummary {
  const { charges: _c, entities: _e, documents: _d, extractedFields: _f, ...rest } = c;
  void _c;
  void _e;
  void _d;
  void _f;
  return rest;
}
