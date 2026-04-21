import { SEED_CASES, MATCHUPS, progressExtraction, type ProcessingSession } from "./mock-data";
import type { CaseDetail, CaseSummary, EntityCandidate, ExtractionStatus, Matchup } from "./types";

interface Store {
  cases: Map<string, CaseDetail>;
  processing: Map<string, ProcessingSession>;
  matchups: Map<string, Matchup>;
}

declare global {
  // eslint-disable-next-line no-var
  var __legalAiStore: Store | undefined;
}

function init(): Store {
  const cases = new Map<string, CaseDetail>();
  for (const c of SEED_CASES) cases.set(c.id, structuredClone(c));
  const processing = new Map<string, ProcessingSession>();

  // Kick off Martinez as an in-flight processing case (seeded so Cases List
  // shows a processing row on load).
  const martinez = cases.get("case-martinez");
  if (martinez) {
    processing.set(martinez.id, {
      caseId: martinez.id,
      // Target snapshot for extraction simulation.
      target: banuelosAsTarget(),
      startedAt: Date.now(),
    });
  }

  const matchups = new Map<string, Matchup>();
  for (const [id, m] of Object.entries(MATCHUPS)) matchups.set(id, m);

  return { cases, processing, matchups };
}

// Martinez is processing — we use a Banuelos-like target so the progressive
// reveal looks rich. The store rewrites the case at completion time with the
// target's entities/charges.
function banuelosAsTarget(): CaseDetail {
  const banuelos = SEED_CASES.find((c) => c.id === "case-banuelos");
  if (!banuelos) throw new Error("missing banuelos seed");
  return structuredClone({
    ...banuelos,
    id: "case-martinez",
    caseNumber: "A-24-901234-C",
    caseName: "Martinez",
    documents: [
      {
        id: "doc-martinez-complaint",
        name: "Martinez_complaint.pdf",
        fileType: "pdf" as const,
        pageCount: 5,
        uploadedAt: new Date().toISOString(),
        sizeBytes: 1_800_000,
      },
    ],
  });
}

export function getStore(): Store {
  if (!globalThis.__legalAiStore) {
    globalThis.__legalAiStore = init();
  }
  return globalThis.__legalAiStore;
}

// ---------- Operations ----------

export function listCases(): CaseSummary[] {
  const store = getStore();
  // Advance any in-flight processing sessions — on list we check if extraction finished.
  for (const [caseId, session] of store.processing) {
    const status = progressExtraction(session);
    if (status.state === "complete") {
      // Move the case into needs_review and apply extracted data.
      const c = store.cases.get(caseId);
      if (c) {
        const target = session.target;
        c.reviewStatus = "needs_review";
        c.caseName = target.caseName;
        c.caseNumber = target.caseNumber;
        c.court = target.court;
        c.courtDept = target.courtDept;
        c.filedDate = target.filedDate;
        c.caseType = target.caseType;
        c.charges = structuredClone(target.charges);
        c.entities = structuredClone(target.entities);
        c.extractedFields = structuredClone(target.extractedFields);
        c.entityCount = target.entities.length;
        c.confirmedCount = target.entities.filter((e) => e.reviewStatus === "confirmed").length;
        c.hasMatchupData = true;
        c.updatedAt = new Date().toISOString();
      }
      store.processing.delete(caseId);
    }
  }

  const summaries: CaseSummary[] = [];
  for (const c of store.cases.values()) {
    summaries.push(toSummary(c));
  }
  return summaries.sort(sortByStatusThenUpdated);
}

export function getCase(id: string): CaseDetail | null {
  const store = getStore();
  const c = store.cases.get(id);
  return c ? structuredClone(c) : null;
}

export function getExtractionStatus(caseId: string): ExtractionStatus | null {
  const store = getStore();
  const session = store.processing.get(caseId);
  if (!session) {
    const c = store.cases.get(caseId);
    if (!c) return null;
    // No active session — extraction already finished.
    return {
      caseId,
      state: "complete",
      fields: c.extractedFields,
      entities: c.entities,
      documentName: c.documents[0]?.name ?? "",
      documentPageCount: c.documents[0]?.pageCount,
      totalEntitiesFound: c.entities.length,
      startedAt: c.updatedAt,
    };
  }
  const status = progressExtraction(session);
  if (status.state === "complete") {
    listCases(); // triggers the flush-to-case logic
  }
  return status;
}

export function getMatchup(caseId: string): Matchup | null {
  return getStore().matchups.get(caseId) ?? null;
}

// ---------- Writes ----------

export interface CreateCaseFromUploadInput {
  fileName: string;
  fileSizeBytes: number;
  fileType: "pdf" | "docx" | "image";
  pageCount?: number;
}

let nextId = 1000;
function newId(prefix: string) {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

export function createCaseFromUpload(input: CreateCaseFromUploadInput): CaseDetail {
  const store = getStore();
  const caseId = newId("case");

  // Pick a random "target" from a pool of demo-ready extractions to keep
  // repeat uploads feeling varied. For v1 we always build toward a
  // Banuelos-shaped case and swap the document name.
  const banuelos = SEED_CASES.find((c) => c.id === "case-banuelos");
  if (!banuelos) throw new Error("missing banuelos seed");
  const target = structuredClone({
    ...banuelos,
    id: caseId,
    documents: [
      {
        id: newId("doc"),
        name: input.fileName,
        fileType: input.fileType,
        pageCount: input.pageCount ?? 3,
        uploadedAt: new Date().toISOString(),
        sizeBytes: input.fileSizeBytes,
      },
    ],
  });

  if (input.fileType === "image") {
    // Images don't trigger extraction.
    const shell: CaseDetail = {
      ...target,
      caseName: null,
      caseNumber: "",
      court: null,
      courtDept: null,
      filedDate: null,
      caseType: null,
      reviewStatus: "shell",
      entities: [],
      charges: [],
      entityCount: 0,
      confirmedCount: 0,
      hasMatchupData: false,
      extractedFields: [
        { key: "case_number", label: "Case Number", status: "pending" },
        { key: "court", label: "Court", status: "pending" },
        { key: "filed_date", label: "Filed", status: "pending" },
        { key: "case_type", label: "Case Type", status: "pending" },
      ],
      updatedAt: new Date().toISOString(),
      dataTier: "tier_2_manual",
    };
    store.cases.set(caseId, shell);
    return structuredClone(shell);
  }

  // Create the case row in processing state with empty extracted fields.
  const processingCase: CaseDetail = {
    ...target,
    caseName: null,
    caseNumber: "",
    court: null,
    courtDept: null,
    filedDate: null,
    caseType: null,
    reviewStatus: "processing",
    entities: [],
    charges: [],
    entityCount: 0,
    confirmedCount: 0,
    hasMatchupData: false,
    extractedFields: [
      { key: "case_number", label: "Case Number", status: "pending" },
      { key: "court", label: "Court", status: "pending" },
      { key: "filed_date", label: "Filed", status: "pending" },
      { key: "case_type", label: "Case Type", status: "pending" },
    ],
    updatedAt: new Date().toISOString(),
  };
  store.cases.set(caseId, processingCase);

  // Start the extraction session.
  store.processing.set(caseId, {
    caseId,
    target,
    startedAt: Date.now(),
  });

  // Seed a matchup (Banuelos-shaped) for this new case.
  const seedMatchup = MATCHUPS["case-banuelos"];
  if (seedMatchup) {
    store.matchups.set(caseId, { ...seedMatchup, caseId });
  }

  return structuredClone(processingCase);
}

export function createCaseFromNumber(caseNumber: string): { caseId: string; duplicateOf?: string } {
  const store = getStore();
  for (const c of store.cases.values()) {
    if (c.caseNumber.trim().toLowerCase() === caseNumber.trim().toLowerCase()) {
      return { caseId: c.id, duplicateOf: c.id };
    }
  }
  const caseId = newId("case");
  const shell: CaseDetail = {
    id: caseId,
    caseNumber,
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
    updatedAt: new Date().toISOString(),
    extractedFields: [
      { key: "case_number", label: "Case Number", value: caseNumber, status: "extracted" },
      { key: "court", label: "Court", status: "pending" },
      { key: "filed_date", label: "Filed", status: "pending" },
      { key: "case_type", label: "Case Type", status: "pending" },
    ],
    entities: [],
    charges: [],
    documents: [],
  };
  store.cases.set(caseId, shell);
  return { caseId };
}

export function confirmEntity(caseId: string, entityId: string): CaseDetail | null {
  return updateEntity(caseId, entityId, (e) => {
    e.reviewStatus = "confirmed";
    e.attributionConfidence = "attorney_verified";
  });
}

export function confirmAllRemaining(caseId: string): CaseDetail | null {
  const store = getStore();
  const c = store.cases.get(caseId);
  if (!c) return null;
  for (const e of c.entities) {
    if (e.reviewStatus === "pending" && e.confidence === "high") {
      e.reviewStatus = "confirmed";
      e.attributionConfidence = "attorney_verified";
    }
  }
  recomputeCounts(c);
  return structuredClone(c);
}

export function applyCorrection(
  caseId: string,
  entityId: string,
  payload: {
    correctionType: "wrong_person" | "wrong_role" | "not_entity";
    correctedEntityId?: string;
    newEntityName?: string;
    correctedRole?: EntityCandidate["role"];
  },
): CaseDetail | null {
  const store = getStore();
  const c = store.cases.get(caseId);
  if (!c) return null;

  if (payload.correctionType === "not_entity") {
    c.entities = c.entities.filter((e) => e.id !== entityId);
    recomputeCounts(c);
    return structuredClone(c);
  }

  const entity = c.entities.find((e) => e.id === entityId);
  if (!entity) return structuredClone(c);

  if (payload.correctionType === "wrong_person") {
    if (payload.correctedEntityId) {
      entity.matchStatus = "matched";
      entity.matchedEntityId = payload.correctedEntityId;
      entity.matchedEntityName = payload.newEntityName ?? entity.extractedName;
      entity.extractedName = payload.newEntityName ?? entity.extractedName;
    } else if (payload.newEntityName) {
      entity.matchStatus = "new";
      entity.matchedEntityId = undefined;
      entity.matchedEntityName = payload.newEntityName;
      entity.extractedName = payload.newEntityName;
    }
    entity.reviewStatus = "edited";
    entity.attributionConfidence = "attorney_verified";
  } else if (payload.correctionType === "wrong_role") {
    if (payload.correctedRole) entity.role = payload.correctedRole;
    entity.reviewStatus = "edited";
    entity.attributionConfidence = "attorney_verified";
  }

  recomputeCounts(c);
  return structuredClone(c);
}

export function resolveAmbiguous(caseId: string, entityId: string, pickedEntityId: string | null): CaseDetail | null {
  return updateEntity(caseId, entityId, (e) => {
    if (pickedEntityId === null) {
      e.matchStatus = "new";
      e.matchedEntityId = undefined;
      e.matchedEntityName = undefined;
      e.matchedPriorCases = undefined;
      e.alternatives = undefined;
    } else {
      const alt = e.alternatives?.find((a) => a.entityId === pickedEntityId);
      if (alt) {
        e.matchStatus = "matched";
        e.matchedEntityId = alt.entityId;
        e.matchedEntityName = alt.name;
        e.matchedPriorCases = alt.priorCases;
        e.extractedName = alt.name;
      }
      e.alternatives = undefined;
    }
    e.confidence = "high";
    e.reviewStatus = "confirmed";
    e.attributionConfidence = "attorney_verified";
  });
}

export function addEntity(
  caseId: string,
  name: string,
  role: EntityCandidate["role"],
): CaseDetail | null {
  const store = getStore();
  const c = store.cases.get(caseId);
  if (!c) return null;
  c.entities.push({
    id: newId("e"),
    role,
    extractedName: name,
    confidence: "high",
    matchStatus: "new",
    reviewStatus: "confirmed",
    attributionConfidence: "attorney_verified",
  });
  recomputeCounts(c);
  return structuredClone(c);
}

// ---------- Helpers ----------

function updateEntity(
  caseId: string,
  entityId: string,
  patch: (e: EntityCandidate) => void,
): CaseDetail | null {
  const store = getStore();
  const c = store.cases.get(caseId);
  if (!c) return null;
  const entity = c.entities.find((e) => e.id === entityId);
  if (!entity) return null;
  patch(entity);
  recomputeCounts(c);
  return structuredClone(c);
}

function recomputeCounts(c: CaseDetail): void {
  c.entityCount = c.entities.length;
  c.confirmedCount = c.entities.filter((e) => e.reviewStatus === "confirmed" || e.reviewStatus === "edited").length;
  c.updatedAt = new Date().toISOString();

  const pending = c.entities.some((e) => e.reviewStatus === "pending");
  if (!pending && c.entities.length > 0) {
    c.reviewStatus = "confirmed";
  } else if (c.confirmedCount > 0) {
    c.reviewStatus = "in_review";
  } else if (c.entities.length > 0) {
    c.reviewStatus = "needs_review";
  }
}

function toSummary(c: CaseDetail): CaseSummary {
  return {
    id: c.id,
    caseNumber: c.caseNumber,
    caseName: c.caseName,
    court: c.court,
    courtDept: c.courtDept,
    filedDate: c.filedDate,
    caseType: c.caseType,
    reviewStatus: c.reviewStatus,
    dataTier: c.dataTier,
    entityCount: c.entityCount,
    confirmedCount: c.confirmedCount,
    hasMatchupData: c.hasMatchupData,
    ambiguousCount: c.ambiguousCount,
    updatedAt: c.updatedAt,
  };
}

const STATUS_PRIORITY: Record<CaseDetail["reviewStatus"], number> = {
  processing: 0,
  needs_review: 1,
  in_review: 2,
  shell: 3,
  confirmed: 4,
};

function sortByStatusThenUpdated(a: CaseSummary, b: CaseSummary): number {
  const pa = STATUS_PRIORITY[a.reviewStatus] ?? 99;
  const pb = STATUS_PRIORITY[b.reviewStatus] ?? 99;
  if (pa !== pb) return pa - pb;
  return b.updatedAt.localeCompare(a.updatedAt);
}
