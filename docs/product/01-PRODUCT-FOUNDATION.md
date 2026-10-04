# Advisor — Product Design Source of Truth

> **Status**: v2.0 — 2026-10-04. Amends v1.0 (grilling rounds 1–4, Decisions Q1–Q68) with the agreed
> product/UX/UI implementation specification of 2026-10-04. v2 changes: the unified two-directional
> meeting request model with confirmation, the role information architecture and navigation system,
> the admin operational scope, the dean advisor view, the VP dean-identity rule, credits on plan
> surfaces, categorized notifications, and the product name (Advisor, never "Advaisor").
> This document is the **contract**. Nothing gets designed or built that contradicts it.
> If reality contradicts it, the document is amended first — never silently.
>
> Companion documents: `02-PROJECT-PLAN.md` (how we build it) · `03-DESIGN-PLAN.md` (how we design it)
> · `../design.md` (the canonical UI/UX implementation contract).

---

## 0. The One-Paragraph Product

Advisor is the university's **AI academic advisor platform**. A student understands their academic
situation, builds one official course-registration plan per semester — by hand or with the AI advisor
editing that same plan in place — the platform validates it against deterministic academic rules, the
assigned advisor approves it or returns it with a mandatory written reason, and the student registers
the approved plan manually in the SIS. The SIS remains the authoritative system for registration and
registration-related data; the platform consumes SIS data and never writes to it. The AI Advisor
assists with guidance and planning; it never overrides academic rules or silently submits registration
actions. The appropriate human authority owns every final decision. Leadership sees the health of
advising at a glance, at the right level of aggregation for their role.

## 1. Product Vision

> **Every student always knows where they stand academically, what to do next, and who can help.
> Advisors spend time only where a human is actually needed. Department, faculty, and university
> leadership see the health of advising at a glance — without asking anyone.**

## 2. Product Principles

1. **Calm intelligence.** Structured information, human-centered guidance. Professional, precise,
   trustworthy. No dashboard card walls, no decoration without a job, no AI gimmicks.
2. **Rules are rules.** A plan that violates an academic rule cannot be submitted. No exceptions, no
   overrides, no petitions (Q64/Q65). Exceptions live in the physical world: the advisor's office.
3. **Humans own decisions.** AI recommends and drafts; the student sends; the advisor approves. The AI
   never sends, never approves, never writes academic state. Nothing consequential happens without an
   explicit human confirmation.
4. **The plan is the product.** Progress, record, advisor, and AI all exist to move the student
   forward: their plan from Draft to Approved, and their questions to answers.
5. **In-app only.** No email, no SMS, no WhatsApp, no push. The notification center is the entire
   delivery channel. There is no free-form person-to-person messaging; structured communication
   happens through plan comments and meeting requests.
6. **No labels.** No student is ever flagged "at risk" or "probation" anywhere in the UI (Q57). Rule
   messages speak about constraints, never about the person.
7. **Read-only governance.** Dean and VP observe; they never approve, return, or message students.
8. **SIS is the ledger.** Identity, catalog, history, CGPA, window dates, registration truth — all
   from SIS. Advisor never becomes a system of record for academic data (Q59, Q67).
9. **Bilingual, themed, responsive** — EN/AR with full RTL, dark/light, and a genuinely mobile
   experience: top bar, bottom navigation, and sheets on phones.

## 3. Product Scope

**In scope (v2)**

- **Account registration & auth, in-system**: sign-up happens inside the product itself — never
  provisioned from SIS — and accepts `@ejust.edu.eg` addresses only; students bind their account to
  their academic record by student ID at sign-up; staff accounts are Admin-created (Q68)
- Academic plan lifecycle: Draft → Submitted → Under Review → Returned → Approved (locked) →
  Closed, with Expired, Withdrawn, and the discarded terminal (§7)
- Deterministic plan validation (prerequisites, credit window, standing cap, repeat policy, summer cap)
- Advisor review: Approve / Return with mandatory reason / Request meeting
- **Unified meeting model (v2)**: availability windows, meeting requests in **both directions**, slot
  proposal and explicit confirmation, the full lifecycle in §10
- Student academic record: CGPA, credits earned and remaining, prerequisite map, course history,
  current enrollment (Q58, amended: credits are visible)
- **My Advisor page**: the assigned advisor as a first-class surface — public profile, office hours,
  availability, meetings
- AI advisor for students only: the six capabilities (§12), structured responses, plan proposals that
  require explicit review, and clear states
- In-app categorized notification center (§11)
- Governance dashboards: advisor queue and review workspace, dean (faculty/department aggregates),
  VP (university aggregates), all read-only except the advisor's review actions
- **Admin operational scope (v2)**: overview, users (students and staff), advisor assignments,
  courses, programs, academic rules, registration windows, notification configuration, AI
  configuration (§5, Admin)
- Permission-aware command palette (⌘K / Ctrl+K), breadcrumbs, and a shared page-header system
- CSV exports from governance tables
- Verification of registration against SIS

**Out of scope (v2 — and mostly forever)**

- **Course registration** (enrolling in sections), add/drop, schedule building — the SIS owns these
  (Q31, Q37). *Account registration (sign-up) is the opposite: in-system and in scope — see glossary.*
- GPA simulator, plan simulator, what-if plans (Q36)
- Petitions in any form (Q64/Q65)
- Career-path recommender (Q64)
- Student state labels / risk flags / early-warning anything (Q57)
- Attendance, financial, scholarship data
- Email / SMS / WhatsApp / push; free-form person-to-person messaging
- VP visibility of advisor caseloads, individual students, or dean identity beside faculty statistics
- Dean visibility of VP governance data or other faculties
- Timetable/calendar management (Q55); academic calendar authoring (window dates come from SIS, Q67)
- Staff-facing AI (Q44); predictions (Q64)
- Organization management, SIS synchronization management, audit-log management, support center,
  system health center, and broad infrastructure operations (future Admin scope, not v2)

## 4. University Operating Model

```text
University  (VPs see everything, read-only, aggregates only)
   ↓
Faculty     (aggregation layer — nobody "is" a faculty role)
   ↓
Department  (deans and advisors are attached here)
   ↓
Advisor     (assigned a caseload of students, by Admin)
   ↓
Student     (belongs to exactly one department, has exactly one advisor)
```

- A dean sees **only their own area**: their faculty/department advising operations. Sibling areas
  outside their scope are invisible.
- Dean and advisor can never be the same human (Q41).
- Department and faculty are data, not roles (Q41).
- The VP drill-down hierarchy is **University → Faculty → Department** and never continues into
  individual advisors or students.
- **The academic clock**: the only time structure the product understands is the **registration
  window** (open date → close date), provided by SIS (Q67). Before it opens and after it closes, plan
  submission is disabled platform-wide (Q31). Deadline math (notifications, aging) derives from the
  close date.

## 5. Role Definitions

| Role | One-line job | Authority |
|---|---|---|
| **Student** | Understand where they stand, build one official plan, respond to advisor feedback, register in SIS | Owns their plan; cannot send AI outputs anywhere without approving them |
| **Advisor** | Turn the queue into decisions; be available when needed | Approve / Return (mandatory reason) / Request meeting. **Never edits a plan** (Q33) |
| **Dean** | Know whether advising in their area is functioning, and where the team needs attention | Read-only; sees advisors and advisor-level aggregates for their area; no student-level personal details |
| **VP** | Compare faculties and departments at a glance | Read-only, university-wide, aggregates only. Never individual students, advisors, caseloads, or dean identity beside faculty statistics |
| **Admin** | Keep the machine running | Operational control plane: users, students, staff, advisor assignments, courses, programs, academic rules, registration windows, notification configuration, AI configuration. Sees no analytics (Q55) |

**Critical VP rule (v2):** the VP must never see a dean identity or name associated with faculty
statistics. Faculty scorecards show aggregates only. Interfaces of the form "Faculty of X — Dean:
John Doe — KPI" are forbidden.

**Dean view (v2):** advisors are visible as operational units — grouping, workload, queue size,
decision times, activity, aggregate outcomes. Individual student profiles, student names beyond what
an aggregate requires, and other faculties are not visible.

### 5.1 Advisor responsibilities (exact)

1. Review submitted plans in the queue; Approve or Return.
2. Write a **mandatory reason comment** on every Return (Q32; comments are advisor-authored).
3. Maintain availability: recurring office-hour windows (§10), which feed meeting scheduling.
4. Work meeting requests in both directions (§10): approve with a confirmed slot, propose a different
   time, delay, or decline a student's request; invite a student to a meeting.
5. Monitor their caseload list, plan statuses, and meeting commitments.
6. That is all — no editing plans, no notes on students, no free-form messaging (Q33).

### 5.2 What the advisor does NOT do

Does not edit plans, does not approve rule-violating plans (hard block, Q65-A), does not email or
free-form message, does not see risk flags (there are none), does not manage anything, does not see
other advisors' caseloads or dean/VP governance data.

## 6. Ubiquitous Language (glossary)

| Term | Meaning |
|---|---|
| **Plan** | The single official course-registration plan a student builds per semester. The core object. |
| **Plan line** | One row: `course + group + section`. Groups/sections are chosen from SIS-sourced options (Q59, Q60). |
| **Validation** | Deterministic rule check on every plan line and on the plan total. Hard-blocks submission. |
| **Return** | Advisor rejects a plan by writing the mandatory comment; state becomes Returned. |
| **Comment** | Advisor-authored text on a plan. A comment on a Returned plan is the reason. Students write free text only in plan fields, AI chat, and meeting-request notes. |
| **Seen** | Student acknowledgment button on an advisor comment. Pressing it unlocks the Returned plan for editing/resubmission (Q32). |
| **Availability window** | A recurring weekly `day / from / to` office-hour slot the advisor publishes (§10). |
| **Meeting request** | The single request object behind both directions (§10): requester, recipient, direction, reason, note, proposed slots, selected slot, status, timestamps. |
| **Meeting slot** | A concrete dated start/end interval derived from availability; the unit a meeting request proposes and confirms. |
| **Registration window** | SIS-provided open/close dates; the platform's only clock (Q67). |
| **Verification** | Server check against SIS that the student actually registered the approved plan. |
| **Caseload** | The set of students assigned to one advisor, created by Admin (Q59.9). |
| **Course analytics** | Per-course average grade + fail percentage, from SIS, exposed to the AI only (Q59.11). |
| **Account registration (sign-up)** | Creating a user account **inside Advisor**. In-system, `@ejust.edu.eg` addresses only, never provisioned from SIS (Q68). |
| **Course registration** | Enrolling in sections. Happens **in the SIS only** — out of product scope; the platform only verifies afterwards that it happened. |
| **Command palette** | The permission-aware ⌘K / Ctrl+K search and command surface (design.md). |

## 7. The Core Object: Academic Plan

### 7.1 Lifecycle state machine (locked, Q32 + round-3; v1.1 amendment holds)

Eight settled lifecycle states — `draft, submitted, under_review, returned, approved, expired,
closed, withdrawn` — plus the contract's terminal record value `discarded`, an operation on a draft
or returned plan rather than a stage a student waits in.

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
        ┌────────────────┐   window ends / term closes    ┌────────────────┐
        │ APPROVED 🔒    │ ─────────────────────────────► │    CLOSED      │
        └────────────────┘                                └────────────────┘
```

### 7.2 Transition table

| # | From → To | Actor | Guard | Side effects |
|---|---|---|---|---|
| 1 | — → Draft | Student | Registration window open | — |
| 2 | Draft → Submitted | Student | **All lines valid** (hard block, Q65-A); window open | Advisor notified |
| 3 | Submitted → Under Review | Advisor | Assigned advisor opens it | — |
| 4 | Under Review → Returned | Advisor | **Comment mandatory**; auto-reject on comment (Q33) | Student notified; plan locked |
| 5 | Returned → Draft | Student | Presses **"Seen"** (Q32) | Plan editable again |
| 6 | Under Review → Approved | Advisor | Server re-validates all lines | Student notified; plan immutable |
| 7 | Under Review → Under Review | Advisor/Student | Meeting request raised | Badge only; **state unchanged** |
| 8 | any of Submitted/Under Review/Returned → Expired | System | Window closes | Student notified |
| 9 | Expired / Approved / Closed transitions | System | Window ends | Terminal states settle |
| 10 | Draft → Withdrawn | Student | — | Terminal for the semester |
| 11 | Draft/Returned → Discarded | Student | — | Terminal record; plan replaceable |

Hard invariants (Q33, round-2 bullets): the plan is **immutable by the student** from Submitted until
"Seen"-unlocked; the advisor **never** edits; approval requires a fully valid plan; every Return
carries at least one advisor comment.

### 7.3 Validation rules behind V1–V6

The backend rule engine owns these checks; the UI renders their results as server messages, never as
rule IDs and never computed client-side (never as labels, see No Labels): `REG-001` credit load 12–18,
`PROB-001` standing limit (CGPA below 2.00 caps load at 12), `REG-002` attempted-final prerequisites,
`REPEAT-001`/`REPEAT-002` repeat rules, `SUMM-001` summer cap 6 credits, `PROG-001` program rules.
`GRAD-001` is display-only (remaining credit hours). Validation copy states constraint + reason + path
forward: "CS402 cannot be added because CS301 is required first", never "Prerequisite validation
failed".

**Credits (v2 amendment):** the SIS catalog carries per-course credits (§9 table, row 2), and plan
surfaces show them: credits earned, credits remaining, current plan total, and per-line credits. The
v1 decision to hide credits is reversed. The plan builder shows the credit impact of each change.

## 8. Permission Matrix

| Action | Student | Advisor | Dean | VP | Admin |
|---|---|---|---|---|---|
| Create/edit/submit own plan | ✅ (state-gated) | — | — | — | — |
| See own plan + comments | ✅ | — | — | — | — |
| Open plan from queue (own caseload) | — | ✅ | — | — | — |
| Approve / Return + comment | — | ✅ | — | — | — |
| Request meeting (with preferred times + note) | ✅ → own advisor | — | — | — | — |
| Invite student to meeting | — | ✅ own caseload | — | — | — |
| Approve / propose time / delay / decline meeting request | — | ✅ (requests from own caseload) | — | — | — |
| Accept slot / decline / cancel meeting request | ✅ (own meetings) | ✅ (own invites) | — | — | — |
| Publish/edit availability | — | ✅ | — | — | — |
| See advisor public profile + office hours | ✅ own advisor | — | — | — | — |
| Advisee list + profiles | — | ✅ own caseload | — | — | — |
| Advisor aggregates (workload, queue size, decision times) | — | — | ✅ own area | — | — |
| Faculty/university aggregates | — | — | — | ✅ | — |
| Users, assignments, courses, programs, rules, windows, notifications config, AI config | — | — | — | — | ✅ |
| AI advisor | ✅ | — | — | — | — |
| Anything student-facing about grades | own CGPA/history only (Q58) | via caseload profiles | aggregates only | ❌ (aggregates only) | ❌ |

Route-level enforcement backs every row: unauthorized navigation renders the permission-denied state;
unauthorized data never reaches the client (the API scopes by role; the command palette and search
respect the same scopes).

## 9. SIS Integration Contract

Pull-based. Platform never writes to SIS. Cadence: nightly batch for catalog/history/CGPA/analytics +
on-demand verification checks during the window.

| # | Data | Source | Consumer |
|---|---|---|---|
| 1 | Student identity: name, ID, program, department, faculty, level | SIS | All roles (scoped) |
| 2 | Course catalog: code, title, **credits**, prerequisites, level, type | SIS | Plan builder, AI, prereq map, plan surfaces |
| 3 | Groups/sections per course (valid options; no meeting times) | SIS | Plan line dropdowns (Q60) |
| 4 | Course history: passed/failed/attempts | SIS | Validation V3/V4, record, AI |
| 5 | Current enrollments | SIS | Record, AI context |
| 6 | CGPA | SIS | Record, V2, AI |
| 7 | Remaining credit hours / graduation requirements | SIS (or derived from 2+4) | Record, AI |
| 8 | **Registration status** per student per course | SIS | Verification |
| 9 | **Registration window dates** | **SIS — sole provider** (Q67) | Academic clock, Admin registration windows view (read-only mirror) |
| 10 | Course analytics: avg grade + fail % | SIS | **AI tool-calls only** (Q59.11) |
| 11 | Account ↔ student-record binding | **In-system** — student ID entered at sign-up; Admin re-links on mismatch | Auth, plan ownership, caseload routing |
| 12 | Rules (credit caps, thresholds) | SIS-first; **Admin fallback config** (Q56) | Validation engine |
| 13 | Advisor ↔ student assignments | **Admin creates** (Q59.9) | Routing, scoping |
| 14 | Programs: structure, requirements | SIS | Plan context, Admin programs view, AI |
| 15 | **SIS sync freshness** (last synced at, per dataset) | SIS sync | Stale-data surfaces (§15) |

Data freshness is a first-class UI concern: surfaces that consume SIS data state how fresh they are,
and never silently present stale data as current (§15).

## 10. Meetings and Office Hours Model (v2 — replaces the v1 Proposed-to-Done model)

One model serves both directions. A **meeting request** is created by a student (to their advisor) or
by an advisor (to a caseload student) and converges on one **confirmed slot** or a terminal outcome.

### 10.1 Meeting request lifecycle

```text
Draft → Requested → Pending → Proposed → Awaiting Response → Confirmed → Completed
                         ↘ Declined   Cancelled   Expired   Conflict (alternate states)
```

| State | Meaning |
|---|---|
| Requested | The requester sent the request; the recipient has not acted |
| Pending | The recipient must choose a slot (advisor approving a student request) |
| Proposed | A concrete slot (or set) has been proposed and waits for the other side |
| Awaiting Response | The recipient must accept, pick, or decline a proposed slot |
| Confirmed | Both sides hold one agreed slot |
| Completed | The meeting happened; the advisor marks it done |
| Declined / Cancelled | A side ended it (cancellation carries a reason) |
| Expired | The proposed window passed without response |
| Conflict | The chosen slot collides with an existing commitment |

### 10.2 Student → advisor flow

The student opens **My Advisor** and requests a meeting: a **reason** (categorized), a preferred
date/time where applicable, and an **optional note**. The advisor receives it as a pending request and
acts: **approve** (choosing a slot from their availability — existing windows, the global defaults, or
a newly added window — which becomes the confirmed slot), **propose a different time**, **delay**, or
**decline**. The student sees the outcome in notifications and on My Advisor, and can respond to
proposals (accept, pick from alternatives, decline).

### 10.3 Advisor → student flow

The advisor invites a caseload student: reason, note, slot source (their availability or free slots),
and proposed slots. The student receives the request, accepts a slot (or proposes another time where
supported), or declines. Both parties see the confirmation.

### 10.4 Availability

- **Recurring availability**: up to 5 `day / from / to` office-hour windows per advisor (global
  defaults exist and are pre-offered for reuse, Q38).
- **Meeting duration**: a per-product slot length (default 30 minutes) with optional buffer; slots are
  generated inside availability windows and exclude already-booked meetings.
- **Conflict detection**: a slot that collides with an existing confirmed meeting or another
  commitment is marked as a conflict and cannot be confirmed.
- The UI always shows what is generally available, what is available for this specific meeting, why a
  slot is unavailable, and whether a slot is tentative or confirmed.
- Meetings never change plan state; an Under Review plan shows a "meeting requested" badge (Q61-b).

## 11. Notification Architecture (in-app only)

Delivery: notification center + unread badge. Nothing leaves the app. Ever.

**Categories (v2):** action required · informational · resolved · meeting · academic plan · advisor ·
AI · administrative. Every notification carries: icon, title, concise explanation, timestamp, an
action where one exists, and read/unread state, and it deep-links into the correct workflow.

| Trigger | Recipient | Category |
|---|---|---|
| Registration window opened | All students | Action required |
| Deadline approaching (3 days before close, no approved plan) | Affected students | Action required |
| Plan returned with comment | Student | Academic plan / action required |
| Plan approved | Student | Academic plan / resolved |
| Registration verified / failed | Student (+ advisor on failure) | Academic plan |
| Meeting request received | Recipient (advisor or student) | Meeting / action required |
| Meeting slot proposed / rescheduled | Other party | Meeting / action required |
| Meeting confirmed | Both parties | Meeting |
| Meeting declined / cancelled / expired | Other party | Meeting |
| Advisor changed / caseload changes | Affected users | Advisor / administrative |
| Queue item aging (3+ days undecided) | Advisor (dashboard badge) | Action required |
| AI quota exhausted / AI unavailable | Student | AI |

## 12. AI Model

**Audience: students only** (Q44). Six capabilities (Q64):

1. Explain university and registration rules
2. Explain degree requirements
3. Recommend courses
4. **Draft a plan** → the AI edits the student's one plan in place; a submit suggestion card offers
   the handoff — the student reviews, edits, and **only the student can submit** (Q46; nothing is
   submitted without explicit confirmation, PR-07)
5. Explain why a plan line is invalid (reads validation results)
6. Explain the student's own state: CGPA, remaining credits, plan status, advisor comments

**Response types (v2):** the AI renders structured information where it helps decisions — course
cards, prerequisite explanations, plan proposals (courses, credit count, reasoning, prerequisites,
warnings, conflicts, assumptions — always with "nothing has been submitted yet"), progress summaries,
warnings, comparisons, and next-action suggestions. Plain text is never the only rendering.

**States (v2):** idle, thinking, streaming, executing a tool, rendering result, success, partial
result, failed, retrying, cancelled, unavailable, rate limited. Tool execution is understandable
without exposing internals.

**Data access**: everything about *this* student via tool-calls — identity, catalog, history, CGPA,
remaining requirements, plan + comments, course analytics (Q59.11). Zero access to other students.

**Constitution (ratified Q45 + round-2):** AI output is advisory; the Approved Plan is the system of
record; the human decision always wins; the AI cannot send, submit, approve, or modify anything
without an explicit human confirmation step; every answer is grounded in tool results or labeled as
general explanation. Deterministic engine computes, LLM converses, LLM has zero write power.

## 13. Governance & Reporting Model

**Core advising metrics** (locked Q40, used at every governance level):

| Metric | Definition |
|---|---|
| Completion % | Caseload with Approved plans ÷ total caseload (before window close) |
| Median decision time | Submitted → decision (Approve or Return) |
| Aging | Queue items undecided ≥ the Admin-configured threshold (count; UI reads the server flag and never shows the threshold value) |

**Dean (own area)**: operational health overview (funnel, completion, median decision time, aging,
bottlenecks) · **advisor view**: grouping, workload, queue size, decision times, activity, aggregate
outcomes · trends · exports. No student-level personal details; no student profiles.

**VP (university)**: university overview · faculty scorecards on the same metrics · trends over time ·
drill **University → Faculty → Department** · comparisons · exports. **No dean identity beside
faculty statistics. No individual students or advisors anywhere** (Q63, v2 critical rule).

Charts exist only to answer a specific question (Is performance improving? Where is the bottleneck?
Which faculty differs? How is workload distributed? How old are unresolved cases?). Every chart has a
legend, a text alternative, and labels. No chart walls, no decorative analytics.

## 14. Information Architecture & Page Inventory

Shared shell: persistent role-scoped left rail (desktop) that collapses on tablet, top app bar and
**bottom navigation** on mobile, topbar with language toggle, theme toggle, notification bell, and
account menu. AI chat lives **only** in the student navigation (PR-08). The **command palette**
(⌘K / Ctrl+K) is permission-aware on every role. Complex pages use breadcrumbs
(`Students / Ahmed Hassan / Academic Plan`). Every major page has a title, a concise description, and
at most one primary action.

### Student — 7 areas
| # | Area | Route(s) | Purpose / key content |
|---|---|---|---|
| S1 | **Home** (landing) | `/app` | Where am I, what needs my attention, next actions, plan health, advisor card, upcoming meeting, notifications digest, AI entry |
| S2 | **My Plan** | `/app/plan` | Plan detail: lines, credits, state, advisor comment + Seen, meeting badge |
| S3 | **Plan Builder** | `/app/builder` | Catalog picker, plan lines, live validation panel, credit impact, submit gate (internal route under My Plan mentally) |
| S4 | **Academic Record** | `/app/record` | CGPA, credits earned/remaining, current enrollment, course history, prerequisite map |
| S5 | **AI Advisor** | `/app/chat`, `/app/chat/:conversationId` | The 6 capabilities; structured responses; submit handoff |
| S6 | **My Advisor** | `/app/advisor` | Advisor public profile, office hours, availability, meetings, request meeting |
| S7 | **Notifications** | `/app/notifications` | Categorized center |
| S8 | **Account** | `/app/account` | Profile, sign-out; secondary |

Mobile bottom nav: **Home · Plan · AI · Advisor · More** (More: Academic Record, Notifications, Account).

### Advisor — 4 areas
| # | Area | Route(s) | Purpose |
|---|---|---|---|
| A1 | **Queue** (landing) | `/advisor` | Decision workspace: filters, ReviewDrawer workspace, approve/return/request meeting |
| A2 | **Students** | `/advisor/students` | Caseload with search, filters, status; student workspace |
| A3 | **Meetings** | `/advisor/meetings` | Requests in both directions, propose/confirm, commitments |
| A4 | **Office Hours** | `/advisor/hours` | Availability editor (secondary, under More) |
| A5 | **Notifications** | `/advisor/notifications` | — |
| A6 | **Profile** | `/advisor/profile` | Advisor profile (secondary, under More) |

Mobile bottom nav: **Queue · Students · Meetings · More**.

### Dean — 4 areas
| # | Area | Route(s) | Purpose |
|---|---|---|---|
| D1 | **Overview** (landing) | `/dean` | Operational health: funnel, completion, decision time, aging, bottlenecks |
| D2 | **Advisors** | `/dean/advisors` | Aggregate advisor workload, queue size, decision times, activity |
| D3 | **Analytics** | `/dean/analytics` | Trends and comparisons over time |
| D4 | **Notifications** | `/dean/notifications` | — |

Mobile bottom nav: **Overview · Advisors · Analytics · More**.

### VP — 4 areas
| # | Area | Route(s) | Purpose |
|---|---|---|---|
| V1 | **Overview** (landing) | `/vp` | University overview; faculty scorecard entry |
| V2 | **Faculties** | `/vp/faculties`, `/vp/drilldown` | Faculty scorecards; drill University → Faculty → Department |
| V3 | **Trends** | `/vp/trends` | Trends and comparisons over time |
| V4 | **Notifications** | `/vp/notifications` | — |

Mobile bottom nav: **Overview · Faculties · Trends · More**.

### Admin — 9 areas
| # | Area | Route(s) | Purpose |
|---|---|---|---|
| M0 | **Overview** (landing) | `/admin` | Operational task overview |
| M1 | **Users** | `/admin/users` | Students and staff: search, role/account info, activate/deactivate, binding repair |
| M2 | **Assignments** | `/admin/assignments` | Advisor ↔ student assignment, import, changes, validation |
| M3 | **Courses** | `/admin/courses` | Course metadata management |
| M4 | **Programs** | `/admin/programs` | Program structures and academic data |
| M5 | **Rules** | `/admin/rules` | Academic rules: prerequisites, eligibility, constraints |
| M6 | **Registration Windows** | `/admin/registration-windows` | Window state and academic-period metadata (SIS mirror; edit only where the contract allows) |
| M7 | **Notifications** | `/admin/notifications` | Notification configuration |
| M8 | **AI Configuration** | `/admin/ai-configuration` | AI product configuration appropriate to university administrators |

*Operations* groups M2–M8 in navigation. Mobile bottom nav: **Overview · Users · Operations · More**.
No organization management, SIS sync management, audit logs, support center, or system health (§3).

### Shared
| # | Screen |
|---|---|
| X1 | **Auth** — login + account registration (sign-up): in-system, `@ejust.edu.eg` only, bound to the academic record by student ID (Q68); forgot password; email verification; staff accounts are Admin-created |

**Total: ~24 pages, plus drawers/dialogs** (review workspace drawer, comment thread, meeting request
dialogs, slot pickers, course picker, Seen-confirm, account editor, bulk-assign, rule editor, course
and program editors, window editor, export, confirm dialogs) **and the global state banners** (§15).

## 15. State & Outcome System

**Every screen must define**: loading · empty · error · permission denied · stale SIS ("data as of …,
retry") · window closed — plus, where relevant: partial data, saving, saved, updating, offline,
conflict, locked, expired, not found, rate limited, maintenance, session expired. Vague messages
("Something went wrong") are banned where a useful explanation is possible. Every error states what
failed, whether anything was saved, whether it is temporary, and what to do; every empty state names
what is empty, whether it is normal, and the next step.

**Plan state × surface matrix** (excerpt):

| Plan state | Student sees | Advisor queue row | Dean funnel |
|---|---|---|---|
| Draft | Editable, "not submitted yet" | — | — |
| Submitted | "Waiting for {advisor}" | New item | Submitted bucket |
| Under Review | Same + meeting badge if requested | Open item | In-review bucket |
| Returned 🔒 | Comment + **Seen** CTA | Returned (awaiting student) | Returned bucket |
| Approved 🔒 | Locked plan + SIS checklist | Approved | Approved bucket |
| Expired / Closed / Withdrawn | Terminal notice | Grayed | Terminal bucket |

**Meeting status × surface matrix** (v2): each role's meetings surface renders the §10.1 states with
icon + label + color (never color alone); conflict and expiry are explicit states, not surprises.

**Edge states**: student with 0 remaining credits ("nothing to register"); final-semester underload;
student with no advisor assigned yet (blocking banner, disabled builder); SIS unreachable during
window; stale SIS data with last-synced timestamps per dataset; offline; session expired.

## 16. Journeys (condensed)

**J1 — The happy loop**: Window opens → student notified → Home CTA → Builder (optionally with the AI
editing the plan in place) → lines valid → Submit → advisor approves in Queue → student notified →
registers in SIS → platform verifies → Closed.

**J2 — The return loop**: Advisor returns with mandatory reason → student notified → presses **Seen**
→ plan unlocks → edits → resubmits → loop until approved or window ends (Expired).

**J3 — The meeting loop (v2)**: Student requests a meeting from My Advisor (reason, preferred time,
note) → advisor approves with a slot from availability (or proposes another time / delays / declines)
→ both see the confirmation → the meeting happens → advisor marks it completed. The inverse direction
starts with an advisor invite and the student accepting a slot.

**J4 — Governance**: Admin seeds accounts/assignments/courses/windows → pipeline runs → Dean opens
Overview Monday morning: completion %, aging, funnel, bottlenecks, advisor workload → VP opens
Overview: faculties compared, trends over time.

## 17. Cross-Cutting Requirements

- **Bilingual EN/AR, full RTL**: logical CSS properties, mirrored iconography, Arabic-first typography
  in AR locale; typed EN/AR dictionaries; bidi isolation for course codes inside Arabic text.
- **Dark/light theming** via tokens; intentionally designed dark mode, never a bare inversion.
- **Responsive with intent**: desktop sidebar; tablet compact navigation; mobile top bar + bottom
  navigation + sheets; tables become stacked rows or cards on small screens.
- **Accessibility**: WCAG 2.1 AA target — contrast in both themes and both languages, keyboard
  navigation for the builder, queue, command palette, and scheduling, screen-reader labels on state
  chips, visible focus, 44px touch targets on touch viewports, reduced-motion support, no color-only
  status.
- **Command palette** on every role, permission-aware, fully keyboard operable.
- **Audit**: server-side, tamper-evident; every plan transition, decision, meeting state change, and
  AI call is recorded server-side.

## 18. Success Metrics

1. ≥ 85% of students with an **Approved** plan before window close (per area — the dean metric).
2. Median advisor decision time ≤ 48h during the window.
3. Verification pass rate ≥ 90% (approved plans actually registered in SIS).
4. AI chat adoption: ≥ 60% of active students use it during the window.
5. Routine-question load on advisors visibly drops (meeting request volume vs. baseline).

## 19. Open Questions (tracked, non-blocking)

1. **SIS reality check**: do the promised endpoints actually expose registration status, window dates,
   per-course sections, program structures, and sync freshness? Discovery task with university IT.
2. **Final-semester underload**: V1's 12-credit minimum traps a student with <12 credits left.
   Confirm: hard minimum always, or final-semester allowance.
3. **Sync cadence**: nightly batch + on-demand verification is the recommendation; confirm with SIS
   admins (rate limits, freshness guarantees).
4. **First admin account** seeding procedure (engineering detail).
5. **AI concurrency budget** at registration-week peak (~480–640 concurrent users).
6. **Meeting duration policy**: fixed 30 minutes product-wide vs. per-advisor duration (v2 default:
   product-wide 30 minutes; revisit with the university).

## 20. Decisions Log

### v1 (condensed — grilling rounds 1–4, Q1–Q68)

| Topic | Decision | Refs |
|---|---|---|
| Identity | AI academic advisor for plan-making; SIS owns registration | A1, A18 |
| Customer | University (E-JUST); one university; ~7 faculties, 6–8K students | A2, A26 |
| Roles | Student, Advisor, Dean, VP, **Admin**; no dual-hatting; no program layer as a role | Q41, Q54, Q55 |
| Core loop | Plan lifecycle (§7); hard-block validation; advisor never edits; mandatory reason on Return; Seen unlocks | Q32, Q33, Q64, Q65 |
| Registration truth | Platform verifies against SIS (not self-reported) | Q34 |
| Escalation | Reminders + dean-visible aging; never auto-approve | Q35 |
| Simulators | None | Q36 |
| Communication | In-app notifications only; no free-form person-to-person messaging; no email/push ever | Q22, Q39, Q48, Q62 |
| Governance | Dean read-only (own area), VP read-only (aggregates); metrics locked | Q39, Q40, Q63 |
| Risk model | **No labels, no flags anywhere**; validation still hard-blocks; AI explains conversationally | Q57 |
| SIS contract | §9 table; window dates SIS-only; rules SIS-first/admin-fallback; assignments Admin-made | Q56, Q59, Q60, Q67 |
| Auth | `@ejust.edu.eg` accounts only; no SSO; account registration in-system; students bind by student ID; staff Admin-created | Q68 |
| AI | Students only; 6 capabilities; full self-data via tools; drafts never send; human final word | Q43–Q47, Q64 |
| Petitions | **None, in any form** | Q64, Q65 |
| Platform | React SPA; EN/AR+RTL; dark/light; responsive web | Q49, Q51, Q52 |

### v2 amendments (2026-10-04 — the agreed product/UX/UI implementation specification)

| Topic | Decision | Amends |
|---|---|---|
| Product name | **Advisor** everywhere user-visible and in all documentation; "Advaisor" is retired | v1 naming |
| Meetings | Unified two-directional meeting request model with slot proposal and explicit confirmation (§10); the v1 informational Proposed-to-Done visits model is retired | §10, Q61 |
| Availability | Recurring windows + meeting duration + conflict detection; slots generated from availability for confirmation flows | Q38 |
| Student voice | Students may write a note on a meeting request; otherwise free text stays limited to plan fields and AI chat | Q66 (partial) |
| Credits | Credits visible on plan and record surfaces (catalog carries them) | v1 "no credits" display rule |
| IA | Role-scoped navigation per §14, including mobile bottom navigation and More areas | §14 |
| Navigation extras | Permission-aware command palette; breadcrumbs; shared page-header system | §14, §17 |
| Dean | Advisors visible as aggregates; no student profiles | §13, v1.1 removal |
| VP | Trends over time added; dean identity beside faculty statistics explicitly forbidden; hierarchy stops at Department | §13 |
| Admin | Operational scope fixed: users, assignments, courses, programs, rules, registration windows, notifications config, AI configuration + Overview; no infra scope | §5, §14 |
| Notifications | Categorized (§11); meeting lifecycle triggers added | §11 |
| AI UX | Structured response types and explicit AI states (§12); submit confirmation unchanged | §12 |

---

*End of contract. Design work (`../design.md`) and build work (`02-PROJECT-PLAN.md`) reference this
document by section number.*
