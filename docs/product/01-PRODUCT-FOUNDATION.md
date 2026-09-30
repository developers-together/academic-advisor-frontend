# Advaisor — Product Design Source of Truth

> **Status**: v1.0 — agreed in grilling rounds 1–4 (Decisions Q1–Q68, sessions of 2026-09-29).
> This document is the **contract**. Nothing gets designed in Figma or built in code that contradicts it.
> If reality contradicts it, the document is amended first — via the Decisions Log — never silently.
>
> Companion documents: `02-PROJECT-PLAN.md` (how we build it) · `03-DESIGN-PLAN.md` (how we design it).
> Prototype reference: `docs/migration/00-MASTER-EXTRACTION.md` (behavioral inventory only — its navigation,
> architecture, and features do **not** carry forward unless restated here).

---

## 0. The One-Paragraph Product

Advaisor is the university's **academic plan platform with an AI advisor inside it**. A student builds one
official course-registration plan per semester — by hand or from an AI draft — the platform validates it
against deterministic academic rules, the assigned advisor approves it or returns it with a mandatory
written reason, the student registers the approved plan manually in the SIS, and the platform verifies the
registration against SIS. Deans and the VP see purely administrative read-only dashboards of how that
pipeline is doing. AI helps students exclusively; humans own every decision.

---

## 1. Product Vision *(delegated to designer in Q29 — ratify on read)*

> **Every student always knows what to take next and why. Advisors spend time only where a human is
> actually needed. Department and university leadership see the health of advising at a glance — without
> asking anyone.**

## 2. Product Principles

1. **Rules are rules.** A plan that violates an academic rule cannot be submitted. No exceptions, no
   overrides, no petitions (Q64/Q65). Exceptions live in the physical world: the advisor's office.
2. **Humans own decisions.** AI recommends and drafts; the student sends; the advisor approves. The AI
   never sends, never approves, never writes academic state (Q33, Q45, round-2 bullets).
3. **The plan is the product.** Everything else — profile, chat, dashboards — exists to move a plan from
   Draft to Confirmed (Q31).
4. **In-app only.** No email, no SMS, no WhatsApp, no push, no messaging between people (Q22/round 1,
   Q39, Q48). If a student must be told something, it is a notification or an advisor comment.
5. **No labels.** No student is ever flagged "at risk" or "probation" anywhere in the UI (Q57). The
   rule engine constrains plans silently; the AI may explain constraints conversationally.
6. **Read-only governance.** Dean and VP observe; they never message, never override (Q39, Q63).
7. **SIS is the ledger.** Identity, catalog, history, CGPA, window dates, registration truth — all from
   SIS. Advaisor never becomes a system of record for academic data (Q59, Q67).
8. **Bilingual, themed, responsive** — EN/AR with full RTL, dark/light, mobile-friendly web (Q49).

## 3. Product Scope

**In scope (v1)**

- **Account registration & auth, in-system**: sign-up happens inside the product itself — never provisioned from SIS — and accepts `@ejust.edu.eg` addresses only; students bind their account to their academic record by student ID at sign-up; staff accounts are Admin-created (Q68, round-4 correction)
- Academic plan lifecycle: Draft → Submitted → Under Review → Returned → Approved & Locked →
  Registration Confirmed → Closed (Q32, round 3)
- Deterministic plan validation (prerequisites, credit window, probation cap, repeat policy, summer cap)
- Advisor review: Approve / Return with mandatory reason / Request office visit (Q33)
- Office-visit model: availability windows, requests in both directions (Q38, Q61, round-2 bullets)
- Student profile: CGPA, remaining credit hours, prerequisite map, course history (Q58)
- AI chat for students only: 6 capabilities, full student data via tool-calls (Q44, Q64)
- In-app notification center (Q62)
- Governance dashboards: Advisor queue, Dean (department), VP (university), all read-only except the
  advisor's review actions (Q40, Q63, Q39)
- Admin console: accounts, roles, caseload assignment, org structure, rules fallback (Q41, Q55)
- Verification of registration against SIS (Q34)
- CSV/PDF exports from governance tables

**Out of scope (v1 — and mostly forever)**

- **Course registration** (enrolling in sections), add/drop, schedule building — the SIS owns these (Q31, Q37). *Account registration (sign-up) is the opposite: in-system and in scope — see glossary.*
- GPA simulator, plan simulator, what-if plans (Q36)
- Petitions in any form (Q64/Q65)
- Career-path recommender (Q64)
- Student state labels / risk flags / early-warning anything (Q57)
- Attendance, financial, scholarship data (round 1, A14/A15)
- Email / SMS / WhatsApp / push; any person-to-person messaging (round 1 A22)
- Dean ↔ advisor communication (Q39); dean → student contact
- Timetable/calendar management (Q55); academic calendar authoring (window dates come from SIS, Q67)
- Staff-facing AI (Q44); predictions (Q64)

## 4. University Operating Model

```text
University  (1–3 VPs see everything, read-only)
   ↓
Faculty     (aggregation layer only — nobody "is" a faculty role)
   ↓
Department  (Dean attached here — one department, possibly many deans per faculty)
   ↓
Advisor     (assigned a caseload of students, by Admin)
   ↓
Student     (belongs to exactly one department, has exactly one advisor)
```

- A dean sees **only their own department**. Sibling departments are invisible (Q54).
- Dean and advisor can never be the same human (Q41).
- Department and faculty are data, not roles (Q41).
- **The academic clock**: the only time structure the product understands is the **registration window**
  (open date → close date), provided by SIS (Q67). Before it opens and after it closes, plan submission
  is disabled platform-wide (Q31). Deadline math (notifications, aging) derives from the close date.

## 5. Role Definitions

| Role | One-line job | Authority |
|---|---|---|
| **Student** | Build one official plan, respond to advisor feedback, register in SIS | Owns their plan; cannot send AI outputs anywhere without approving them |
| **Advisor** | Turn the queue into decisions; be physically available when needed | Approve / Return (mandatory reason) / Request visit. **Never edits a plan** (Q33) |
| **Dean** | Know whether their department's advising pipeline is healthy | Read-only, own department only. No messaging in any direction (Q39) |
| **VP** | Compare faculties and departments at a glance | Read-only, university-wide, aggregates only — never individual students (Q63) |
| **Admin** | Keep the machine running | Accounts, roles, caseloads, org structure, rules fallback. Sees no analytics (Q55) |

### 5.1 Advisor responsibilities (exact)

1. Review submitted plans in their queue; Approve or Return.
2. Write a **mandatory reason comment** on every Return (Q32, Q66: comments are advisor-only).
3. Request an office visit: mandatory availability slots (≤5 `day/from/to` windows), unless global
   defaults exist, which are offered for reuse (Q38, round-2 bullets).
4. Approve/deny student-initiated visit requests; approval requires slots (round-2 bullets).
5. Maintain global availability in settings; edit or delete slots (Q38).
6. Monitor their caseload list and plan statuses. That is all — no notes on students, no editing, no
   messaging (Q33, Q66).

### 5.2 What the advisor does NOT do

Does not edit plans, does not approve rule-violating plans (hard block, Q65-A), does not email or
message, does not see risk flags (there are none), does not manage anything.

## 6. Ubiquitous Language (glossary)

| Term | Meaning |
|---|---|
| **Plan** | The single official course-registration plan a student builds per semester. The core object. |
| **Plan line** | One row: `course + group + section`. Groups/sections are chosen from SIS-sourced dropdowns (Q59, Q60). |
| **Validation** | Deterministic rule check on every plan line and on the plan total. Hard-blocks submission. |
| **Return** | Advisor rejects a plan by writing the mandatory comment; state becomes Returned. |
| **Comment** | Advisor-only text. A comment on a Returned plan = the reason. Students cannot write text anywhere except plan fields and AI chat (Q66). |
| **Seen** | Student acknowledgment button on an advisor comment. Pressing it unlocks the Returned plan for editing/resubmission (Q32). |
| **Availability window** | `day / from / to` slot the advisor publishes; informational only — no booking (Q61-a/Q66). |
| **Visit request** | A meeting request. Advisor→student (with slots, mandatory) or student→advisor (advisor approves/denies; approval requires slots). Never changes plan state (Q61-b). |
| **Registration window** | SIS-provided open/close dates; the platform's only clock (Q67). |
| **Verification** | Server check against SIS that the student actually registered the approved plan (Q34). |
| **Caseload** | The set of students assigned to one advisor, created by Admin (Q59.9). |
| **Course analytics** | Per-course average grade + fail percentage, from SIS, exposed to the AI only (Q59.11). |
| **Account registration (sign-up)** | Creating a user account **inside Advaisor**. In-system, `@ejust.edu.eg` addresses only, never provisioned from SIS (Q68, round-4 correction). |
| **Course registration** | Enrolling in sections. Happens **in the SIS only** — out of product scope; the platform only verifies afterwards that it happened (Q34). |

## 7. The Core Object: Academic Plan

### 7.1 Lifecycle state machine (locked, Q32 + round-3)

```text
                 ┌─────────────── resubmit (valid, window open) ───────────────┐
                 ▼                                                              │
   ┌───────┐   submit   ┌──────────────┐  advisor opens   ┌──────────────┐       │
   │ DRAFT │ ─────────► │  SUBMITTED   │ ───────────────► │ UNDER REVIEW │ ──────┘
   └───────┘            └──────────────┘                  └──────┬───────┘
      ▲          ▲            │ expired                    approve│  │ return (mandatory comment)
      │ seen     │ withdraw   │                                   │  ▼
      │          │            │                            ┌──────┴────────┐
   ┌──┴────────┐ │        ┌───┴───┐                        │ RETURNED 🔒   │── student presses
   │ (edit ok) │ │        │EXPIRED│                        │ (locked until │   "Seen" → back to
   └───────────┘ │        └───────┘                        │    "Seen")    │   DRAFT (edit ok)
                 │                                         └──────┬────────┘
                 ▼                                                │ (resubmit loop above)
        ┌────────────────┐   SIS verification passes   ┌──────────────────────┐
        │ APPROVED 🔒    │ ──────────────────────────► │ REGISTRATION         │
        │                │                             │ CONFIRMED            │
        └───────┬────────┘                             └──────────┬───────────┘
                │ SIS mismatch / window ends                      │ window ends
                ▼                                                 ▼
        ┌────────────────┐                              ┌──────────────┐
        │ VERIFICATION   │                              │    CLOSED    │
        │ FAILED         │                              └──────────────┘
        └────────────────┘
```

### 7.2 Transition table

| # | From → To | Actor | Guard | Side effects |
|---|---|---|---|---|
| 1 | — → Draft | Student | Registration window open | — |
| 2 | Draft → Submitted | Student | **All lines valid** (hard block, Q65-A); window open | Advisor notified |
| 3 | Submitted → Under Review | Advisor | Assigned advisor opens it | — |
| 4 | Under Review → Returned | Advisor | **Comment mandatory**; auto-reject on comment (Q33) | Student notified; plan locked |
| 5 | Returned → Draft | Student | Presses **"Seen"** (Q32) | Plan editable again |
| 6 | Under Review → Approved & Locked | Advisor | Server re-validates all lines | Student notified; plan immutable |
| 7 | Under Review → Under Review | Advisor/Student | Visit request raised | Badge only; **state unchanged** (Q61-b) |
| 8 | Approved → Registration Confirmed | System | SIS shows approved courses registered (Q34) | Student notified |
| 9 | Approved → Verification Failed | System | SIS mismatch, or window ends unverified | Student + advisor notified; visible in dean funnel |
| 10 | any of Submitted/Under Review/Returned → Expired | System | Window closes | Student notified |
| 11 | Confirmed / Verification Failed / Expired → Closed | System | Window ends | Terminal |
| 12 | Draft → Withdrawn | Student | — | Terminal for the semester |

Hard invariants (Q33, round-2 bullets): the plan is **immutable by the student** from Submitted until
"Seen"-unlocked; the advisor **never** edits; approval requires a fully valid plan; every Return carries
exactly one mandatory advisor comment (multiple comments may accumulate; the first one gates "Seen").

### 7.3 Validation rules (hard block — no submission while any fails)

Derived from the prototype's registry (`docs/migration/00` §4), minus everything whose data we dropped:

| ID | Rule | Message shape (reveals no label, per Q57) |
|---|---|---|
| V1 | 12 ≤ plan total credits ≤ 18 (REG-001) | "Total credits must be between 12 and 18." |
| V2 | If SIS CGPA < 2.00 → plan total ≤ 12 (PROB-001) | "Your current academic standing limits you to 12 credits this semester." |
| V3 | Every prerequisite satisfied under **attempted-final** semantics (REG-002) | "COURSE-X requires COURSE-Y (final attempt recorded)." |
| V4 | Repeat allowed once; **3rd attempt of the same course blocked** (REPEAT-001/002) | "This would be your 3rd attempt. Department chair approval is required — visit your department office." |
| V5 | Summer plan total ≤ 6 credits (SUMM-001) | "Summer plans are limited to 6 credits." |
| V6 | Shared-core courses apply across departments (PROG-001) | Enforced in catalog composition, not surfaced as a block. |

Dropped with their data: ATT-001 (no attendance), SCHOL-001 (no scholarships), tuition blockers (no
finance). GRAD-001 becomes **display-only** in the profile (remaining credit hours). The REG-004
"mandatory advising verification" ambiguity from the prototype is **resolved by design**: advisor
approval *is* the verification. The dual GPA scale conflict is **dissolved**: the platform never
computes GPA — CGPA arrives from SIS as data (Q58).

Known edge to confirm (see Open Questions): a final-semester student with fewer than 12 credits
remaining will trip V1's minimum.

## 8. Permission Matrix

| Action | Student | Advisor | Dean | VP | Admin |
|---|---|---|---|---|---|
| Create/edit own plan | ✅ (state-gated) | — | — | — | — |
| Submit/resubmit plan | ✅ | — | — | — | — |
| See own plan + comments | ✅ | — | — | — | — |
| Open plan from queue | — | ✅ own caseload | ✅ own dept | — | — |
| Approve / Return + comment | — | ✅ | — | — | — |
| Request visit (with slots) | — | ✅ | — | — | — |
| Request visit (no slots) | ✅ | — | — | — | — |
| Approve/deny visit request | — | ✅ | — | — | — |
| Publish/edit availability | — | ✅ | — | — | — |
| Advisee list + profiles | — | ✅ own caseload | ✅ own dept | — | — |
| Dept scoreboard + funnel | — | — | ✅ | — | — |
| Faculty/university aggregates | — | — | — | ✅ | — |
| Accounts, roles, caseloads, structure | — | — | — | — | ✅ |
| Rules (fallback config) | — | — | — | — | ✅ |
| AI chat | ✅ | — | — | — | — |
| Anything student-facing about grades | own CGPA/history only (Q58) | via student profile view | via student explorer | ❌ (aggregates only) | ❌ |

## 9. SIS Integration Contract

Pull-based. Platform never writes to SIS. Cadence: nightly batch for catalog/history/CGPA/analytics +
on-demand verification checks during the window *(engineering recommendation — see Open Questions)*.

| # | Data | Source | Consumer |
|---|---|---|---|
| 1 | Student identity: name, ID, program, department, faculty, level | SIS | All roles (scoped) |
| 2 | Course catalog: code, title, credits, prerequisites, level, type | SIS | Plan builder, AI, prereq map |
| 3 | Groups/sections per course (valid options; no meeting times) | SIS | Plan line dropdowns (Q60) |
| 4 | Course history: passed/failed/attempts | SIS | Validation V3/V4, profile, AI |
| 5 | Current enrollments | SIS | Profile, AI context |
| 6 | CGPA | SIS | Profile, V2, AI |
| 7 | Remaining credit hours / graduation requirements | SIS (or derived from 2+4) | Profile, AI |
| 8 | **Registration status** per student per course | SIS | Verification (Q34) |
| 9 | **Registration window dates** | **SIS — sole provider** (Q67) | Academic clock |
| 10 | Course analytics: avg grade + fail % | SIS | **AI tool-calls only** (Q59.11) |
| 11 | Account ↔ student-record binding | **In-system** — student ID entered at sign-up; Admin re-links on mismatch (round-4 correction) | Auth, plan ownership, caseload routing |
| 12 | Rules (credit caps, thresholds) | SIS-first; **Admin fallback config** (Q56) | Validation engine |
| 13 | Advisor ↔ student assignments | **Admin creates** (Q59.9) | Routing, scoping |

## 10. Meetings / Office Hours Model

- **Availability window component**: repeated rows of `day ▾ · from · to`, maximum **5**; advisor may
  add, edit, delete at any time (Q38).
- **Global defaults** live in advisor settings; when any flow needs slots, the system pre-offers the
  saved defaults — advisor reuses them or edits inline (round-2 bullets).
- **Advisor→student visit request**: mandatory slots; student sees the windows; shows up. No booking,
  no confirmation, no attendance tracking (Q61-a/Q66).
- **Student→advisor visit request**: one tap + optional nothing — students write no text (Q66).
  Advisor approves (slots mandatory) or denies. Both outcomes notify the student.
- Visit requests **never change plan state**; an Under Review plan shows a "visit requested" badge (Q61-b).

## 11. Notification Architecture (in-app only — complete list, Q62)

| Trigger | Recipient | Payload |
|---|---|---|
| Registration window opened | All students | Window dates |
| Deadline approaching (3 days before close, no approved plan) | Affected students | Close date |
| Plan returned with comment | Student | Comment preview + "Seen" CTA |
| Plan approved | Student | Locked plan + "register in SIS" checklist |
| Registration verified / failed | Student (+ advisor on failure) | Result |
| Visit request: advisor → student | Student | Slots |
| Visit request: student → advisor | Advisor | Student name |
| Visit approved / denied | Student | Slots or denial |
| Queue item aging (3+ days undecided) | Advisor (dashboard badge) | — *(dean sees it on the scoreboard, no notification — Q39)* |

Delivery: notification center + unread badge. Nothing leaves the app. Ever.

## 12. AI Model

**Audience: students only** (Q44). Six capabilities (Q64):

1. Explain university and registration rules
2. Explain degree requirements
3. Recommend courses
4. **Draft a plan** → renders as a structured Draft Plan Card → *"Review in Plan Builder"* — the student
   reviews, edits, and **only the student can submit** (round-2 bullets, Q46)
5. Explain why a plan line is invalid (reads validation results)
6. Explain the student's own state: CGPA, remaining credits, plan status, advisor comments

**Data access**: everything about *this* student via tool-calls — identity, catalog, history, CGPA,
remaining requirements, plan + comments, course analytics (Q59.11). Zero access to other students.

**Constitution (ratified Q45 + round-2)**: AI output is advisory; the Approved Plan is the system of
record; the human decision always wins; the AI cannot send, submit, approve, or modify anything; every
answer is grounded in tool results or labeled as general explanation. Server-side neurosymbolic split is
preserved from the prototype: deterministic engine computes, LLM converses, LLM has zero write power.

**Dropped from prototype's AI**: GPA/plan simulation, career recommender, emails/petitions generation,
grade-event monitoring, proactive push. Proactive AI = the 3 student triggers in §11 surfacing as chat
entry points only (Q43, Q47).

## 13. Governance & Reporting Model

**Advisor scoreboard metrics** (locked Q40) — the dean's primary screen:

| Metric | Definition |
|---|---|
| Completion % | Caseload with Approved plans ÷ total caseload (before window close) |
| Median decision time | Submitted → decision (Approve or Return) |
| Aging | Queue items undecided ≥ 3 days (count; drives the dean-visible escalation from Q35-b) |

**Dean (own department)**: advisor scoreboard · approval funnel (count per plan state) · student
explorer (any dept student: profile, plan history, comments) · exports. *(Label aggregates removed by
Q57.)*

**VP (university)**: per-faculty rollup — total approvals (explicitly requested, Q40) · completion % ·
median responsiveness · drill faculty → department · exports. **No individual students anywhere** (Q63).

## 14. Information Architecture & Page Inventory

Shared shell: persistent left rail (role-scoped) + topbar (language toggle, theme toggle, notification
bell, account menu). AI chat lives **only** in the student rail.

### Student — 6 screens (+ shared auth)
| # | Screen | Purpose / key content |
|---|---|---|
| S1 | **Dashboard** (landing, Q53-A) | Plan-state card, window countdown, notification digest, `New/Resume Plan` + `Chat with AI` |
| S2 | **My Plan** | Plan detail: lines, state, advisor comment + **Seen** button, verification result |
| S3 | **Plan Builder** | Catalog picker, plan lines (course+group+section), live validation panel, submit gate |
| S4 | **Profile** | CGPA, remaining credit hours, **prerequisite map** (prototype SVG roadmap survives, Q58), course history |
| S5 | **AI Chat** | The 6 capabilities; Draft Plan Card handoff |
| S6 | **Notifications** | Center + per-item deep links |

### Advisor — 5 screens
| # | Screen | Purpose |
|---|---|---|
| A1 | **Queue** (landing) | Pending reviews, aging badges, visit requests awaiting decision |
| A2 | **Student Explorer** | Caseload list → student drawer (profile, plan, history) |
| A3 | **Meetings** | Requests to approve/deny; upcoming visit commitments |
| A4 | **Office Hours** | Global availability editor (≤5 windows) |
| A5 | **Notifications** | — |

### Dean — 4 screens
| # | Screen | Purpose |
|---|---|---|
| D1 | **Department Overview** (landing) | Scoreboard (§13 metrics) + approval funnel + aging |
| D2 | **Advisor Detail** | One advisor: queue state, decision times, completion |
| D3 | **Student Explorer** | Any dept student: profile, plan, comments |
| D4 | **Notifications** | — |

### VP — 2 screens
| # | Screen | Purpose |
|---|---|---|
| V1 | **University Scorecard** (landing) | Faculties compared: approvals, completion %, responsiveness |
| V2 | **Drill-down** | Faculty → departments; exports |

### Admin — 5 screens
| # | Screen | Purpose |
|---|---|---|
| M1 | **Accounts** | CRUD students/staff, roles, deactivate |
| M2 | **Caseloads** | Advisor ↔ student assignment, bulk upload |
| M3 | **Structure** | Faculties, departments, dean/advisor mapping |
| M4 | **Rules** | SIS-synced values with source badges; manual fallback editor (Q56) |
| M5 | **System Log** | Sync status, audit trail |

### Shared
| # | Screen |
|---|---|
| X1 | **Auth** — login + **account registration (sign-up)**: in-system, `@ejust.edu.eg` only, bound to the academic record by student ID (Q68, round-4 correction); staff accounts are Admin-created |

**Total: 22 pages, plus ~12 modals/drawers** (plan review drawer, comment modal, visit-request modal,
slot viewer, course picker, Seen-confirm, account editor, bulk-assign, rule editor, export, confirm
dialogs) **and the global state banners** (§15).

## 15. State & Outcome System

**Every screen must define**: loading · empty · error · permission-denied · stale-SIS
("data as of …, retry") · window-closed (submission disabled) — in addition to its content states.

**Plan state × surface matrix** (excerpt — full matrix in design doc):

| Plan state | Student sees | Advisor queue row | Dean funnel |
|---|---|---|---|
| Draft | Editable, "not submitted yet" | — | — |
| Submitted | "Waiting for {advisor}" | New item | Submitted bucket |
| Under Review | Same + visit badge if requested | Open item | In-review bucket |
| Returned 🔒 | Comment + **Seen** CTA | Returned (awaiting student) | Returned bucket |
| Approved 🔒 | Locked plan + SIS checklist | Approved | Approved bucket |
| Registration Confirmed | ✅ verified | ✅ verified | Confirmed bucket |
| Verification Failed | Fix instructions + visit CTA | ⚠ row | Failed bucket |
| Expired / Closed / Withdrawn | Terminal notice | Grayed | Terminal bucket |

**Edge states**: student with 0 remaining credits ("nothing to register"); final-semester underload
(Open Question #3); student with no advisor assigned yet (Admin gap — blocking banner to Admin log,
disabled builder); SIS unreachable during window (verification deferred, banner).

## 16. Journeys (condensed)

**J1 — The happy loop**: Window opens → student notified → Dashboard CTA → Builder → (optionally asks AI
to draft, reviews the Draft Plan Card) → lines valid → Submit → advisor approves in Queue → student
notified → registers in SIS → platform verifies → Confirmed → Closed.

**J2 — The return loop**: Advisor returns with mandatory reason → student notified → presses **Seen** →
plan unlocks → edits → resubmits (no note — Q66) → loop until approved or window ends (Expired).

**J3 — The visit loop**: Student requests visit → advisor approves with slots (defaults pre-offered) →
student sees windows → shows up physically → advisor returns to the plan and Approves/Returns.

**J4 — Governance**: Admin seeds accounts/caseloads → pipeline runs → Dean opens Overview Monday
morning: completion %, aging, funnel → VP opens Scorecard: 7 faculties compared.

## 17. Cross-Cutting Requirements

- **Bilingual EN/AR, full RTL**: logical CSS properties, mirrored iconography, Arabic-first typography
  in AR locale; `translations.js` dictionaries from the prototype are the i18n seed.
- **Dark/light theming** via tokens (Figma variables ↔ CSS custom properties).
- **Responsive web**: phone-first for students (dashboard, chat, plan status), desktop-first for
  advisor/dean/VP/admin tables. No native app.
- **Accessibility**: WCAG 2.1 AA target — contrast in both themes and both languages, keyboard
  navigation for the builder and queue, screen-reader labels on state chips.
- **Audit**: server-side, tamper-evident; every plan transition, decision, and AI call is recorded
  (prototype's SHA-256 chain, moved server-side).

## 18. Success Metrics

1. ≥ 85% of students with an **Approved** plan before window close (per department — the dean metric).
2. Median advisor decision time ≤ 48h during the window.
3. Verification pass rate ≥ 90% (approved plans actually registered in SIS).
4. AI chat adoption: ≥ 60% of active students use it during the window.
5. Routine-question load on advisors visibly drops (office-visit request volume vs. baseline).

## 19. Open Questions (tracked, non-blocking)

1. **Q65 interpretation flag**: from "no petition at all / no need to add confusion" I locked **hard
   block** (Option A: invalid plans cannot be submitted; advisors cannot approve exceptions). If the
   intent was actually Option B (advisor may approve-with-exception + mandatory reason), say so — it
   changes §7.3 and one dean metric.
2. **SIS reality check**: do the promised endpoints actually expose — registration
   status, window dates, per-course sections? Discovery task with university IT before Phase 1 build.
   *(Student email no longer needed — accounts are born in-system, round-4 correction.)*
3. **Final-semester underload**: V1's 12-credit minimum traps a student with <12 credits left. Confirm:
   hard minimum always, or final-semester allowance (requires a data-driven exemption in the engine).
4. **Sync cadence**: nightly batch + on-demand verification is the recommendation; confirm with SIS
   admins (rate limits, freshness guarantees).
5. **First admin account** seeding procedure (engineering detail).
6. **AI concurrency budget** at registration-week peak (~480–640 concurrent users; queue + semantic
   cache per extraction §9.2).

## 20. Decisions Log (condensed — grilling rounds 1–4)

| Topic | Decision | Refs |
|---|---|---|
| Identity | AI academic advisor for plan-making; SIS owns registration | A1, A18 |
| Customer | University (E-JUST); one university; ~7 faculties, many departments, 6–8K students | A2, A26 |
| Roles | Student, Advisor, Dean, VP, **Admin**; no dual-hatting; dean per department; no program layer | Q41, Q54, Q55 |
| Core loop | Plan lifecycle (§7); hard-block validation; advisor never edits; mandatory reason on Return; Seen unlocks | Q32, Q33, Q64, Q65 |
| Registration truth | Platform verifies against SIS (not self-reported) | Q34 |
| Escalation | Reminders + dean-visible aging; never auto-approve | Q35 |
| Simulators | None. No GPA sim, no plan sim, no what-ifs | Q36 |
| Meetings | Informational windows (day/from/to, ≤5), global defaults; requests both ways; advisor approval needs slots; no booking; no plan-state change | Q38, Q61, Q66 |
| Communication | In-app notifications only; advisor-only comments; students write no free text anywhere (except plan fields + AI chat); no dean↔advisor comms; no email/push ever | Q22, Q39, Q48, Q62, Q66 |
| Governance | Dean read-only (dept), VP read-only (aggregates + approvals/faculty); scoreboard metrics locked | Q39, Q40, Q63 |
| Risk model | **No labels, no flags anywhere**; validation rules still hard-block; AI explains conversationally | Q57, round 3 |
| Student record | CGPA + remaining credits + prereq map + history only; no grade pages, no transcript | Q31, Q58 |
| SIS contract | §9 table; window dates SIS-only; rules SIS-first/admin-fallback; assignments Admin-made; sections from SIS dropdowns; analytics = avg grade + fail % (AI-only) | Q56, Q59, Q60, Q67 |
| Auth | `@ejust.edu.eg` accounts only; no SSO; **account registration runs inside the system, never from SIS**; students bind to their academic record by student ID at sign-up; staff Admin-created | Q68, round-4 correction |
| AI | Students only; 6 capabilities; full self-data via tools; drafts never send; human final word; proactive = 3 in-app triggers | Q43, Q44, Q45, Q46, Q47, Q64 |
| Petitions | **None, in any form** | Q64, Q65 |
| Career recommender | Dropped | Q64 |
| Platform | Laravel + React; EN/AR+RTL; dark/light; responsive web; Figma last, after this doc | Q49, Q51, Q52 |

---

*End of contract. Design work (`03-DESIGN-PLAN.md`) and build work (`02-PROJECT-PLAN.md`) reference
this document by section number.*
