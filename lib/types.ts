// Type definitions for the Firm Case Intake v1 frontend.
// Mirrors the backend schema (see Notion: Schema & Data Model).

export type ReviewStatus =
  | "processing"
  | "needs_review"
  | "in_review"
  | "confirmed"
  | "shell";

export type DataTier =
  | "tier_0_public"
  | "tier_1_ai_extracted"
  | "tier_2_manual"
  | "tier_3_graph_derived";

export type AttributionConfidence =
  | "unverified"
  | "firm_level_only"
  | "inferred"
  | "paralegal_verified"
  | "attorney_verified"
  | "client_confirmed";

export type EntityRole =
  | "judge"
  | "prosecutor"
  | "defense_attorney"
  | "co_counsel"
  | "defendant"
  | "officer"
  | "witness"
  | "expert";

export type ExtractionConfidence = "high" | "medium" | "low";

export type ExtractionFieldStatus = "pending" | "extracted" | "matched" | "not_found";

export interface Charge {
  id: string;
  text: string;
  statute?: string;
}

export interface EntityCandidate {
  id: string;
  role: EntityRole;
  extractedName: string;
  confidence: ExtractionConfidence;
  matchStatus: "matched" | "new" | "ambiguous" | "auto_confirmed";
  matchedEntityId?: string;
  matchedEntityName?: string;
  matchedPriorCases?: number;
  alternatives?: Array<{
    entityId: string;
    name: string;
    priorCases: number;
    jurisdiction?: string;
  }>;
  reviewStatus: "pending" | "confirmed" | "rejected" | "edited";
  attributionConfidence: AttributionConfidence;
  isFirmMember?: boolean;
}

export interface ExtractedField {
  key: "case_number" | "court" | "filed_date" | "case_type";
  label: string;
  value?: string;
  status: ExtractionFieldStatus;
}

export interface CaseDocument {
  id: string;
  name: string;
  fileType: "pdf" | "docx" | "image";
  pageCount?: number;
  uploadedAt: string;
  sizeBytes: number;
}

export interface CaseSummary {
  id: string;
  caseNumber: string;
  caseName: string | null;
  court: string | null;
  courtDept?: string | null;
  filedDate: string | null;
  caseType: string | null;
  reviewStatus: ReviewStatus;
  dataTier: DataTier;
  entityCount: number;
  confirmedCount: number;
  hasMatchupData: boolean;
  ambiguousCount?: number;
  updatedAt: string;
}

export interface CaseDetail extends CaseSummary {
  charges: Charge[];
  entities: EntityCandidate[];
  documents: CaseDocument[];
  extractedFields: ExtractedField[];
}

// --- Matchup intelligence ---

export type ConfidenceTier = "sparse" | "building" | "strong" | "authoritative";

export interface MotionStat {
  label: string;
  granted: number;
  total: number;
}

export interface JudgeMatchup {
  judgeName: string;
  priorCasesWithYou: number;
  tier: ConfidenceTier;
  motionStats: MotionStat[];
  avgDispositionDays?: number;
  patternNarrative?: string;
  growthHint?: {
    totalAvailableCases: number;
    casesToNextTier: number;
    nextTier: ConfidenceTier;
  };
}

export interface ProsecutorMatchup {
  prosecutorName: string;
  priorCasesWithYou: number;
  tier: ConfidenceTier;
  pleaAcceptanceRate?: number;
  trialVsPleaRatio?: { trial: number; plea: number };
  patternNarrative?: string;
  placeholderCopy?: string;
}

export interface OwnRecord {
  scope: string; // e.g. "Dept. 14"
  caseCount: number;
  focusCaseType?: string;
  outcomes: Array<{ label: string; count: number }>;
  winRatePct: number;
}

export interface Matchup {
  caseId: string;
  judge?: JudgeMatchup;
  prosecutor?: ProsecutorMatchup;
  ownRecord?: OwnRecord;
}

// --- Upload / Extraction state ---

export interface ExtractionStatus {
  caseId: string;
  state: "reading" | "extracting" | "complete" | "partial" | "zero_entities" | "one_entity" | "image_only" | "error";
  errorMessage?: string;
  fields: ExtractedField[];
  entities: EntityCandidate[];
  documentName: string;
  documentThumbnailUrl?: string;
  documentPageCount?: number;
  totalEntitiesFound: number;
  startedAt: string;
}

// --- Correction flow ---

export type CorrectionType = "wrong_person" | "wrong_role" | "not_entity";

export interface CorrectionPayload {
  correctionType: CorrectionType;
  correctedEntityId?: string;
  newEntityName?: string;
  correctedRole?: EntityRole;
}
