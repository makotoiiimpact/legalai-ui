import {
  addEntity,
  applyCorrection,
  confirmAllRemaining,
  confirmEntity,
  createCaseFromNumber,
  createCaseFromUpload,
  getCase,
  getExtractionStatus,
  getMatchup,
  listCases,
  resolveAmbiguous,
} from "./store";
import type {
  CaseDetail,
  CaseSummary,
  CorrectionPayload,
  EntityRole,
  ExtractionStatus,
  Matchup,
} from "./types";

// Client-side API shim. All operations hit the in-memory mock store
// (lib/store.ts) with a small delay to simulate network latency.
//
// When real HTTP endpoints ship in legalai-api, swap the body of each
// method for a fetch() call — the signatures match the spec's API surface
// sketch in Notion (Firm Case Intake — Frontend UX Design v1).

const DEFAULT_DELAY_MS = 180;

function delay<T>(value: T, ms: number = DEFAULT_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export const api = {
  listCases(): Promise<CaseSummary[]> {
    return delay(listCases());
  },

  getCase(caseId: string): Promise<CaseDetail> {
    const c = getCase(caseId);
    if (!c) return Promise.reject(new ApiError(404, "Case not found"));
    return delay(c);
  },

  getExtractionStatus(caseId: string): Promise<ExtractionStatus> {
    const s = getExtractionStatus(caseId);
    if (!s) return Promise.reject(new ApiError(404, "Case not found"));
    // Shorter delay on polling so UI feels snappy.
    return delay(s, 60);
  },

  getMatchup(caseId: string): Promise<Matchup | null> {
    return delay(getMatchup(caseId));
  },

  async uploadCaseDocument(file: File): Promise<CaseDetail> {
    const fileType = inferFileType(file);
    const created = createCaseFromUpload({
      fileName: file.name,
      fileSizeBytes: file.size,
      fileType,
      pageCount: fileType === "pdf" ? 3 : undefined,
    });
    return delay(created, 450);
  },

  createCase(caseNumber: string): Promise<{ caseId: string; duplicateOf?: string }> {
    const result = createCaseFromNumber(caseNumber);
    return delay(result);
  },

  confirmEntity(caseId: string, entityId: string): Promise<CaseDetail> {
    const updated = confirmEntity(caseId, entityId);
    if (!updated) return Promise.reject(new ApiError(404, "Case or entity not found"));
    return delay(updated);
  },

  confirmAllRemaining(caseId: string): Promise<CaseDetail> {
    const updated = confirmAllRemaining(caseId);
    if (!updated) return Promise.reject(new ApiError(404, "Case not found"));
    return delay(updated);
  },

  applyCorrection(caseId: string, entityId: string, payload: CorrectionPayload): Promise<CaseDetail> {
    const updated = applyCorrection(caseId, entityId, payload);
    if (!updated) return Promise.reject(new ApiError(404, "Case not found"));
    return delay(updated);
  },

  resolveAmbiguous(
    caseId: string,
    entityId: string,
    pickedEntityId: string | null,
  ): Promise<CaseDetail> {
    const updated = resolveAmbiguous(caseId, entityId, pickedEntityId);
    if (!updated) return Promise.reject(new ApiError(404, "Case not found"));
    return delay(updated);
  },

  addEntity(caseId: string, name: string, role: EntityRole): Promise<CaseDetail> {
    const updated = addEntity(caseId, name, role);
    if (!updated) return Promise.reject(new ApiError(404, "Case not found"));
    return delay(updated);
  },
};

function inferFileType(file: File): "pdf" | "docx" | "image" {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx") || name.endsWith(".doc")) return "docx";
  return "image";
}

export const ACCEPTED_EXTS = [".pdf", ".docx", ".jpg", ".jpeg", ".png", ".heic"];
export const ACCEPTED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/heic",
];
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
