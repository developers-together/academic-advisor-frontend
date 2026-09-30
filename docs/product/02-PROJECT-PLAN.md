# Advaisor — Project Plan (React + Laravel + DeepSeek Rebuild)

> **Basis**: `01-PRODUCT-FOUNDATION.md` (§ refs below). **Prototype reference**: `docs/migration/00-MASTER-EXTRACTION.md`.
> The prototype is a behavioral inventory and a **spec to port** (rules engine + 2,212-assertion test suite),
> not an architecture to keep.

---

## 1. Target Architecture

```text
┌────────────────────────── React 18 SPA (Vite) ──────────────────────────┐
│  Role-scoped route tree (5 roles × 22 pages, foundation §14)            │
│  TanStack Query + API client · SSE chat streaming · i18n EN/AR + RTL    │
│  Tokens ↔ CSS variables (dark/light) · no business logic in client      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ REST (Sanctum) + SSE
┌──────────────────────────────▼──────────────────────────────────────────┐
│                        Laravel 11 API (modular)                         │
│  Auth          — in-system sign-up, ID binding, roles                   │
│  SIS           — pull sync (nightly batch + on-demand), source badges   │
│  RulesEngine   — pure PHP validators V1–V6; ported from policyInvariants│
│  Advising      — plans, lifecycle, comments/Seen, visits, availability  │
│  Notifications — in-app only, trigger table from foundation §11         │
│  Agent         — DeepSeek proxy, server-side ReAct loop, tool dispatch, │
│                 rate limiting, PII masking, semantic cache              │
│  Governance    — dean/VP aggregate queries (precomputed summary tables) │
│  Admin         — accounts, caseloads, structure, rules fallback         │
│  Audit         — server-side SHA-256 chain (prototype's, made real)     │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ pull-only
                        ┌──────▼──────┐
                        │     SIS     │  identity, catalog, sections, history,
                        │  endpoints  │  CGPA, analytics, window dates, registration status
                        └─────────────┘
```

**Invariants carried from the prototype (extraction §1, §5):**
- Neurosymbolic split: deterministic engine computes, LLM only converses and calls tools; **LLM has zero
  write power over academic state** (foundation §12).
- Every submission re-validated server-side even if the UI is bypassed (extraction §9.4-4).
- API keys server-side only; real authn/authz with per-role policies; no client RBAC ever.

## 2. Data Model (starting point — extends extraction §6's 8 tables)

**New core tables**: `users` (role, `@ejust.edu.eg` email, student-ID binding) · `faculties`, `departments`, `advisor_department`
· `advisor_student` (caseload, Admin-managed) · `plans` (student, term, state, locked_at) ·
`plan_lines` (course, group, section, credits snapshot) · `plan_comments` (advisor-only) ·
`plan_transitions` (audit of §7.2 table) · `availability_windows` (advisor, day/from/to, is_default) ·
`visit_requests` (direction, state, windows JSON) · `notifications` (user, type, payload, read_at) ·
`sis_sync_log` + source badges · `academic_windows` (mirrored from SIS, Q67) · `rules_config` (SIS-first,
manual fallback, Q56) · `audit_chain`.

**Ported/reshaped**: `tracks→departments` framing, `courses`, `course_prerequisites`,
`student_course_history`, `student_enrollments` — now **mirrors** of SIS data, marked with sync metadata.
Registration/appointments/audit leave sessionStorage permanently (extraction B5).

## 3. What Ports, What Dies, What's New

| Category | Items |
|---|---|
| **Ports ~1:1** | 12-grade-independent rule invariants V1–V6 from `policyInvariants` + `rulesEngine` (as PHP, unit-tested against the 2,212-assertion JS suite as the behavioral spec) · ReAct loop (≤6 turns, temp 0.15, tool-cycle breaker) · system prompt + student ground-truth block · security guard (injection regexes, PII masking, token bucket — as Laravel middleware) · prereq SVG roadmap · EN/AR dictionaries (`translations.js` seed) |
| **Dies** | GPA simulator + its scale conflict · plan/what-if simulator · registration desk (SIS owns) · petitions + 4-type modal · career recommender (+ bug B1 dies with it) · nudges-as-labels panel (Q57) · attendance/FW/scholarship/finance rules (ATT-001, SCHOL-001, tuition) · advisory emails (5 templates) · WhatsApp/SMS · 3-tier client router · client API keys |
| **New builds** | Plan lifecycle machine + hard-block submission gate · Seen/comment flow · verification against SIS registration status · availability windows + visit requests · notification center · advisor queue + scoreboard/funnel aggregates · VP rollups (precomputed summary tables — never scan 8K transcripts per request, extraction §9.2) · Admin console · self-registration + SIS record matching |

**AI tool set (rewrite of the prototype's 12 schemas for the new scope, ~10 tools)**:
`get_my_profile` · `get_my_history` · `get_remaining_requirements` · `get_catalog` (search/filter) ·
`get_prereq_map` · `recommend_courses` (uses history + course analytics) · `draft_plan` (structured
output → Draft Plan Card; **cannot submit**) · `validate_plan_lines` (calls RulesEngine) ·
`explain_rule` · `get_my_plan_status` (state + comments). Course analytics feeds `recommend_courses`
internally; no separate staff-facing analytics tool.

## 4. Milestones

Design runs ahead of build per `03-DESIGN-PLAN.md` (D-phases land before the matching P-phase starts).

| Phase | Weeks | Scope | Exit criteria |
|---|---|---|---|
| **P0 — Foundations** | 1–3 | Laravel skeleton, Sanctum auth + **in-system sign-up** (`@ejust.edu.eg` gate, student-ID binding), roles/policies, migrations, org structure, SIS sync skeleton + **mock SIS server** (contract §9), CI; RulesEngine PHP port with parity tests; React shell (routing, i18n, theming, role gates). Design D0–D1 parallel. | All P0 tests green; rules parity suite passing; mock SIS serving contract §9 |
| **P1 — Plan loop** | 3–7 | Plan CRUD + lifecycle + hard-block validation server-side, comments/Seen, advisor queue + review drawer, availability + visit requests, notifications v1, Admin accounts/caseloads minimum. Design D2–D3 done before build. | J1 + J2 journeys E2E on mock SIS; every plan transition audited |
| **P2 — AI** | 5–9 (overlap) | DeepSeek integration (server-side key), ReAct loop port, tool set (§3), SSE streaming, Draft Plan Card handoff, rate limiting + semantic cache, audit of AI calls. | All 6 AI capabilities demoed; injection/red-team suite from prototype passes server-side |
| **P3 — Governance + Admin** | 7–10 | Dean overview + explorer, VP scorecard + drill, aggregate summary tables + nightly recompute, exports (CSV/PDF), full Admin console. Design D4–D5 done before build. | Dean/VP screens answer foundation §13 with <300ms p95 on seeded 8K dataset |
| **P4 — Verification + hardening** | 9–12 | SIS registration verification, deadline/aging engine, stale-data banners, edge states (§15), RTL/i18n sweep, dark/light QA, a11y pass, load test at registration-week concurrency (~600 users), 6–8K synthetic seeder (extraction §9.3 distribution), UAT with one pilot department | All §15 states implemented; load test p95 < 1.5s non-AI; UAT sign-off |

Post-launch candidates (explicitly **not** v1): real SIS calendar/auth integrations beyond the contract,
staff-facing AI, SIS write-back, final-semester underload policy change (Open Question #3).

## 5. Scale & Performance (6–8K students)

- Peak ≈ 8% concurrency in window week → 480–640 simultaneous users (extraction §9.2).
- Chat is the only heavy path: per-student token bucket (20–25/min), Laravel queue + Redis for AI calls,
  semantic cache for similar prompts. Everything else is CRUD over indexed tables.
- Precompute governance aggregates (scoreboard, funnel, VP rollup) into summary tables; recomputed on
  transition events + nightly — never per-request scans.
- Always paginate admin/dean/advisor tables (prototype pattern 10/20/50/All survives).

## 6. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | **SIS endpoints don't exist / lack fields** (registration status, window dates, sections) — the #1 dependency | Mock SIS server from day 0; `04-SIS-DATA-REQUIREMENTS.md` reviewed and signed by the SIS team **before P1 exit**; fallbacks: Admin-entered dates would require reopening Q67 — escalate early, don't hack |
| R2 | Rules misinterpretation (attempted-final semantics, repeat counting) | Port the 2,212-assertion suite first; run it as parity tests; have the university validate 10 real transcripts |
| R3 | Sign-up binding mismatch (student ID not found among synced records) | Admin re-link path in M1; capture mismatch report; low risk — accounts no longer depend on any SIS email (round-4 correction) |
| R4 | AI cost/latency at peak | Queue + cache + strict tool schema; degrade to "AI busy, validation still works" — the plan loop must never depend on the LLM |
| R5 | Scope creep back toward the prototype | This document; every addition amends the Decisions Log first |
| R6 | V1 minimum-credit trap for final-semester students (Open Question #3) | Decide before P1 exit; it's a one-rule change in the engine if confirmed |

## 7. Quality Gates

- Unit: RulesEngine parity (2,212 assertions ported), lifecycle transition table (§7.2) tested row by row.
- Integration: every §11 notification fires exactly once per trigger; verification against mock SIS.
- E2E: journeys J1–J4 scripted (Playwright) on the seeded dataset.
- Security: OWASP pass, injection/red-team suite (prototype's) server-side, PII masking verified, audit
  chain tamper check.
- i18n/RTL: zero hardcoded strings rule enforced by lint; RTL screenshot sweep per screen.
