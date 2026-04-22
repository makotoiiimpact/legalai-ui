import type {
  CaseDetail,
  CaseSummary,
  CorrectionPayload,
  EntityRole,
  ExtractionStatus,
  Matchup,
} from "./types";

// Real HTTP client against the legalai-api v2 surface (FastAPI on Railway).
// Endpoint contract: see /Users/makotokern/Projects/legalai-api/routes/intake.py
// TypeScript type contract: ./types.ts
//
// Local dev: set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v2 in .env.local
// Production: Vercel project env var points at Railway /api/v2
//
// lib/store.ts and lib/mock-data.ts are retained as reference / fallback but
// no longer imported by this module.

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://web-production-e379a8.up.railway.app/api/v2";

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
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText || `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body.detail === "string") detail = body.detail;
      else if (body) detail = JSON.stringify(body);
    } catch {
      try {
        const text = await res.text();
        if (text) detail = text;
      } catch {
        // ignore
      }
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  // null responses (e.g. no matchup yet) parse as `null` — that's fine.
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
  listCases(): Promise<CaseSummary[]> {
    return request<CaseSummary[]>(`/cases`);
  },

  getCase(caseId: string): Promise<CaseDetail> {
    return request<CaseDetail>(`/cases/${caseId}`);
  },

  getExtractionStatus(caseId: string): Promise<ExtractionStatus> {
    return request<ExtractionStatus>(`/cases/${caseId}/extraction`);
  },

  getMatchup(caseId: string): Promise<Matchup | null> {
    return request<Matchup | null>(`/cases/${caseId}/matchup`);
  },

  async uploadCaseDocument(file: File): Promise<CaseDetail> {
    const form = new FormData();
    form.append("file", file);
    return request<CaseDetail>(`/cases/upload`, {
      method: "POST",
      body: form,
    });
  },

  createCase(caseNumber: string): Promise<{ caseId: string; duplicateOf?: string }> {
    return request(`/cases`, jsonInit("POST", { caseNumber }));
  },

  confirmEntity(caseId: string, entityId: string): Promise<CaseDetail> {
    return request<CaseDetail>(
      `/cases/${caseId}/entities/${entityId}/confirm`,
      { method: "PATCH" },
    );
  },

  confirmAllRemaining(caseId: string): Promise<CaseDetail> {
    return request<CaseDetail>(
      `/cases/${caseId}/entities/confirm-all`,
      { method: "PATCH" },
    );
  },

  applyCorrection(caseId: string, entityId: string, payload: CorrectionPayload): Promise<CaseDetail> {
    return request<CaseDetail>(
      `/cases/${caseId}/entities/${entityId}/correct`,
      jsonInit("PATCH", payload),
    );
  },

  resolveAmbiguous(
    caseId: string,
    entityId: string,
    pickedEntityId: string | null,
  ): Promise<CaseDetail> {
    return request<CaseDetail>(
      `/cases/${caseId}/entities/${entityId}/resolve`,
      jsonInit("PATCH", { pickedEntityId }),
    );
  },

  addEntity(caseId: string, name: string, role: EntityRole): Promise<CaseDetail> {
    return request<CaseDetail>(
      `/cases/${caseId}/entities`,
      jsonInit("POST", { name, role }),
    );
  },

  getDocumentUrl(caseId: string, documentId: string): Promise<{ url: string }> {
    return request<{ url: string }>(`/cases/${caseId}/documents/${documentId}/url`);
  },
};

// Re-exported so components can reuse the allowlists / limits. These mirror
// the backend validation in routes/intake.py.
export const ACCEPTED_EXTS = [".pdf", ".docx", ".jpg", ".jpeg", ".png", ".heic"];
export const ACCEPTED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/heic",
];
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
