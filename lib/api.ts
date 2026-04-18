const API = process.env.NEXT_PUBLIC_API_URL ?? "https://web-production-e379a8.up.railway.app";

export type CaseStatus = "intake" | "review" | "complete" | string;
export type ChargeSeverity = "misdemeanor" | "gross_misdemeanor" | "felony" | string;
export type CaseType = "DUI" | "Drug" | "Assault" | "Domestic Violence" | "Theft" | "Other" | string;
export type ReviewAction = "confirmed" | "edited" | "rejected";
export type RecommendedPath = "suppression_motion" | "plea_negotiate" | "trial" | "dismiss" | string;

export interface Case {
  id: string;
  case_number: string;
  client_name: string;
  case_type: CaseType;
  charge: string | null;
  charge_severity: ChargeSeverity | null;
  incident_date: string | null;
  jurisdiction: string;
  status: CaseStatus;
  paralegal_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCaseBody {
  case_number: string;
  client_name: string;
  case_type: CaseType;
  charge?: string | null;
  charge_severity?: ChargeSeverity | null;
  incident_date?: string | null;
  jurisdiction?: string;
  notes?: string | null;
}

export interface Document {
  id: string;
  name: string;
  doc_type: string;
  file_size_kb: number;
  page_count: number;
  indexed: boolean;
  indexed_at: string | null;
  chunk_count: number;
  created_at: string;
}

export interface UploadDocumentResponse {
  document_id: string;
  name: string;
  doc_type: string;
  indexed: boolean;
  message: string;
}

export interface AnalyzeResponse {
  run_id: string;
  case_id: string;
  case_type: string;
  message: string;
}

export interface SourceExcerpt {
  doc_name: string;
  excerpt: string;
  relevance?: string;
}

export interface Finding {
  id: string;
  case_id: string;
  check_type: string;
  label: string;
  ai_answer: string;
  source_chunk_ids: string[] | null;
  source_excerpts: string;
  confidence: number;
  hil_status: ReviewAction | null;
  edited_answer: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  priority_flag: boolean;
  run_id: string;
  created_at: string;
}

export interface ReviewBody {
  action: ReviewAction;
  edited_answer?: string | null;
  reviewer_name?: string;
  note?: string | null;
}

export interface ReviewFindingResponse {
  finding_id: string;
  action: ReviewAction;
  all_reviewed: boolean;
  message: string;
}

export interface PriorityFinding {
  label: string;
  summary: string;
}

export interface Memo {
  id: string;
  case_id: string;
  draft_content: string;
  recommended_path: RecommendedPath;
  priority_findings: string;
  attorney_approved: boolean;
  attorney_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  version: number;
  created_at: string;
}

export interface GenerateMemoResponse {
  case_id: string;
  message: string;
}

export interface ApproveBody {
  attorney_name?: string;
  notes?: string | null;
}

export interface ApproveMemoResponse {
  case_id: string;
  memo_id: string;
  approved_by: string;
  approved_at: string;
  message: string;
}

export interface AuditEntry {
  id: string;
  case_id: string;
  finding_id: string | null;
  document_id: string | null;
  action: string;
  actor: string;
  actor_name: string;
  note: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body && typeof body.detail === "string") detail = body.detail;
      else if (body) detail = JSON.stringify(body);
    } catch {
      // ignore — keep statusText
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const api = {
  getCases: (status?: string) =>
    request<Case[]>(`/cases${status ? `?status=${encodeURIComponent(status)}` : ""}`),

  getCase: (id: string) => request<Case>(`/cases/${id}`),

  createCase: (body: CreateCaseBody) => request<Case>("/cases", jsonInit("POST", body)),

  getDocuments: (caseId: string) => request<Document[]>(`/cases/${caseId}/documents`),

  uploadDocument: (caseId: string, file: File, docType: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("doc_type", docType);
    return request<UploadDocumentResponse>(`/cases/${caseId}/documents`, {
      method: "POST",
      body: form,
    });
  },

  runAnalysis: (caseId: string) =>
    request<AnalyzeResponse>(`/cases/${caseId}/analyze`, { method: "POST" }),

  getFindings: (caseId: string) => request<Finding[]>(`/cases/${caseId}/findings`),

  reviewFinding: (caseId: string, findingId: string, body: ReviewBody) =>
    request<ReviewFindingResponse>(
      `/cases/${caseId}/findings/${findingId}/review`,
      jsonInit("POST", body),
    ),

  generateMemo: (caseId: string) =>
    request<GenerateMemoResponse>(`/cases/${caseId}/memo`, { method: "POST" }),

  getMemo: (caseId: string) => request<Memo>(`/cases/${caseId}/memo`),

  approveMemo: (caseId: string, body: ApproveBody) =>
    request<ApproveMemoResponse>(`/cases/${caseId}/memo/approve`, jsonInit("POST", body)),

  getAuditLog: (caseId: string) => request<AuditEntry[]>(`/cases/${caseId}/audit`),
};

export function parseSourceExcerpts(finding: Finding): SourceExcerpt[] {
  if (!finding.source_excerpts) return [];
  try {
    const parsed = JSON.parse(finding.source_excerpts);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parsePriorityFindings(memo: Memo): PriorityFinding[] {
  if (!memo.priority_findings) return [];
  try {
    const parsed = JSON.parse(memo.priority_findings);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function formatConfidence(value: number): number {
  return Math.round(value * 100);
}

export function confidenceLevel(value: number): "high" | "medium" | "low" {
  const pct = formatConfidence(value);
  if (pct >= 80) return "high";
  if (pct >= 60) return "medium";
  return "low";
}
