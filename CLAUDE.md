@AGENTS.md

# LegalAI Project Instructions

Project-specific instructions for Claude Code when working on the LegalAI frontend (`legalai-ui`). This is the firm intelligence platform for criminal defense attorneys — initial customer is Garrett Ogata's firm.

## Repo + Local Paths

- **Frontend repo:** github.com/makotoiiimpact/legalai-ui
- **Frontend local:** `/Users/makotokern/Projects/legalai-ui/`
- **Backend repo:** github.com/makotoiiimpact/legalai-api
- **Backend local:** `/Users/makotokern/Projects/legalai-api/`

## Supabase Projects

| Env | Project ID | Purpose |
|---|---|---|
| Production | `kapyskpusteokxuaquwo` | Live firm data |
| Development | `cfiaxrvtafszmgraftbk` | Schema experimentation, migration staging |

**Never reference `wlksqdorclrxjbulvvik`** — that's AI GC, a different product. If you see that project ID anywhere in LegalAI code or docs, it's a bug.

Frontend v1 is wired to an in-memory mock store (`lib/store.ts`) until backend routes land. API client signatures (`lib/api.ts`) match the API Surface Sketch in the UX spec — swap implementations when the real endpoints ship.

## Notion Sync Protocol

After every meaningful ship — any commit that touches features, fixes bugs, or changes the user-facing app — append a dated entry to the LegalAI Ship Log.

- **Page URL:** https://www.notion.so/3483764230fa81fe9160f8d5c0b3bf34
- **Tool:** Notion MCP `notion-update-page` with `command: 'update_content'`. Create a new date heading if today's date doesn't exist yet.

**Entry format:**

```
### [HH:MM] - [Brief title] - commit `[hash]`
- **What shipped:** brief description, files touched
- **Migrations / infra:** SQL run, env vars, infrastructure changes
- **Test status:** what was tested, what wasn't
- **Follow-ups:** docs to update, cross-links, related work
```

**At the start of every new session,** scan the 'Tasks Mac CC Should Check Next' section of the Ship Log and action anything new. Move completed items to the dated ship log above.

**When to skip Notion sync:**
- Pure refactoring with no user-visible change
- Working in a temporary scratch branch
- Makoto explicitly says 'don't log this'

When unsure, default to logging.

**Status-check rule:** When Makoto asks "what did you ship today" or "what's the status," read the latest entries from the Ship Log first — don't rely on chat history alone.

## Reference Docs (Notion)

Primary sources of truth when working on this repo:

- **UX spec (Firm Case Intake v1):** https://www.notion.so/3493764230fa81e3bb2bcd23a813f7ae — screens, states, copy, API surface sketch
- **Schema & Data Model:** https://www.notion.so/3473764230fa8179865ac25d381feef4 — current table inventory, enums, RLS posture
- **Architecture Decision Log (ADRs):** https://www.notion.so/3473764230fa81f193bec4e2f9bf6ae4 — the "why" behind schema and product choices
- **LegalAI — Garrett Ogata Project (parent):** https://www.notion.so/3453764230fa811f97b3cca0f2123a78 — session retros and subpages live under here

When a question starts with "why are we doing it this way," the ADR log usually has the answer before the code does.

## Verification Protocol

From the global `~/CLAUDE.md` — applies here:

- After any file edit: `npx tsc --noEmit`
- After multi-file changes: `npx eslint . --quiet`
- For routing changes on Next 16: `npx next build` catches things tsc misses
- Never claim success without verification
