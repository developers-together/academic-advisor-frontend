# Advisor design system

> **Current visual contract:** section 28, 2026-10-09, replaces conflicting historical layout and radius rules.
> **Status:** v2.0 foundation, 2026-10-04. This document is the canonical UI/UX implementation contract for the
> Advisor frontend. It restructures v1.1 into the 25-section contract and implements the agreed v2
> product specification: role information architecture, mobile navigation, the permission-aware
> command palette, breadcrumbs and page headers, the unified meeting and availability UX, per-role UX
> models, and the Admin operational scope.
> **Basis:** docs/product/01-PRODUCT-FOUNDATION.md v2.0, 03-DESIGN-PLAN.md, and the v2 specification.
> **Audience:** AI agents and engineers building this frontend. Read sections 1, 2, and 5 before
> writing any UI code.
> **Maintenance:** rules in this file have IDs (`DS-*`, `PR-*`, `DP-*`). Change tokens or components
> only through the governance process in section 24.

---

## 1. Purpose and design philosophy

### 1.1 What Advisor is

Advisor is the university's AI academic advisor platform (foundation §0). A student understands their
academic situation, builds one official course-registration plan per semester by hand or with the AI
advisor editing that same plan in place, the advisor approves it or returns it with a mandatory
written reason, and the student registers the approved plan manually in the SIS. The platform also
carries the meeting relationship between student and advisor, categorized notifications, and
governance analytics for deans and the VP. The AI assists with guidance and planning; it never
overrides academic rules or silently submits registration actions; the appropriate human authority
owns every final decision.

Customer: E-JUST, one university, ~7 faculties, 6–8K students.

**The product name is Advisor.** Never "Advaisor". Every user-visible string, document, and label
uses Advisor. Internal storage keys (`advaisor.*`) keep their names for state continuity and are
listed in section 25.

### 1.2 Core product principle

> Calm intelligence + structured information + human-centered academic guidance.

The interface feels professional, calm, intelligent, academic, precise, trustworthy, modern,
lightweight, responsive, and human. Banned: generic university portal aesthetics, giant dashboard
card walls, excessive gradients, glassmorphism, decorative animation, unnecessary charts,
spreadsheet-dense interfaces everywhere, childish educational styling, overly colorful status systems,
AI gimmicks, fake complexity, unnecessary page duplication. Quality references (Linear, Vercel,
Stripe, Atlassian, Material 3, Apple HIG, Google Calendar, Calendly, ChatGPT, Claude, Perplexity) are
quality bars, never designs to copy.

### 1.3 The five roles

| Role    | Job                                                                                        | Authority                                                                                                                                               | Design consequence                               |
| ------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Student | Understand where they stand; build one official plan; respond to feedback; register in SIS | Owns their plan; nothing is sent without their approval                                                                                                 | Phone-first, spacious, AI chat in nav            |
| Advisor | Turn the queue into decisions; be available when needed                                    | Approve, Return (mandatory reason), Request meeting. Never edits a plan (Q33)                                                                           | Desktop-first, dense queue, attention management |
| Dean    | Know whether advising in their area functions, and where the team needs attention          | Read-only; advisors and aggregates for their own area; no student personal details                                                                      | Aggregate screens only, no student PII surface   |
| VP      | Compare faculties and departments at a glance                                              | Read-only, university-wide, aggregates only; never students, advisors, or dean identity beside faculty stats                                            | Scorecard + drill-down + trends only             |
| Admin   | Keep the machine running                                                                   | Operational control plane: users, assignments, courses, programs, rules, registration windows, notifications config, AI config. Sees no analytics (Q55) | Forms and tables, task-oriented, zero charts     |

"Faculty" is not a role: it is an aggregation layer. Department and faculty are data. Dean and advisor
can never be the same human.

### 1.4 Product rules

These rules come from the foundation contract. They override any design preference.

| ID    | Rule                                                                                                                                                                                                                          | Source           |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| PR-01 | No labels, no flags: no student is ever shown as "at risk" or "probation" anywhere in the UI. Rule messages speak about constraints, never about the person.                                                                  | Q57              |
| PR-02 | No simulators: no GPA simulator, no plan simulator, no what-if plans.                                                                                                                                                         | Q36              |
| PR-03 | Dean is scoped to their own area; areas outside it are invisible.                                                                                                                                                             | Q54              |
| PR-04 | No petitions in any form; advisors cannot approve rule-violating plans.                                                                                                                                                       | Q64, Q65         |
| PR-05 | In-app only: no email, SMS, WhatsApp, push. The notification center is the entire delivery. No free-form person-to-person messaging; structured communication lives in plan comments and meeting requests.                    | Q22, Q39, Q48    |
| PR-06 | Plan comments are advisor-authored. Students write free text only in plan fields, AI chat, and meeting-request notes.                                                                                                         | Q66 as amended   |
| PR-07 | Humans own decisions: AI never sends, approves, or changes academic state. Drafts never auto-send. Nothing consequential happens without explicit confirmation.                                                               | Q33, Q45, Q46    |
| PR-08 | AI is students-only, with exactly 6 capabilities: explain rules, explain degree requirements, recommend courses, draft a plan, explain why a line is invalid, explain the student's own state. Zero access to other students. | Q44, Q64         |
| PR-09 | SIS is the ledger: the platform never writes to SIS. CGPA arrives from SIS and is never computed in-app.                                                                                                                      | Q59, Q67         |
| PR-10 | No staff-facing AI and no predictions.                                                                                                                                                                                        | Q44, Q64         |
| PR-11 | No career-path recommender.                                                                                                                                                                                                   | Q64              |
| PR-12 | Hard block: plans violating validation rules V1–V6 cannot be submitted.                                                                                                                                                       | Q65              |
| PR-13 | Scoreboard metrics are locked: completion %, median decision time, aging (the UI reads the server's `is_aging` flag and never shows the threshold value).                                                                     | Q40              |
| PR-14 | Student record is minimal: CGPA, credits (earned/remaining), prereq map, history. No transcript, no grade pages.                                                                                                              | Q31, Q58         |
| PR-15 | VP surfaces never show dean identity beside faculty statistics, and never continue below Department.                                                                                                                          | v2 critical rule |
| PR-16 | Data freshness is never faked: stale SIS data is labeled with its as-of time and a retry.                                                                                                                                     | v2               |
| PR-17 | Destructive actions show impact, confirm, execute, show result, and offer undo where safe. Harmless actions never get confirmation dialogs.                                                                                   | v2               |
| PR-18 | Admin scope is fixed (foundation §5); Admin never grows an "everything settings" area.                                                                                                                                        | v2               |

### 1.5 Validation rules behind V1–V6

The backend rule engine owns these checks; the UI renders their results as server messages (section
7.4), never as rule IDs and never computed client-side (never as labels, see PR-01): `REG-001` credit
load 12–18, `PROB-001` standing limit (CGPA below 2.00 caps load at 12), `REG-002` attempted-final
prerequisites, `REPEAT-001`/`REPEAT-002` repeat rules, `SUMM-001` summer cap 6 credits, `PROG-001`
program rules. `GRAD-001` is display-only. Credits are visible on plan surfaces (foundation §7.3 v2
amendment).

## 2. Product UX model

Each role's experience composes around one question and one page pattern.

| Role    | The question                                                                            | Page composition                                             |
| ------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Student | "Where am I academically, what should I do next, and who can help me?"                  | Context → current state → next actions → supporting detail   |
| Advisor | "Who needs my attention, what decision do I need to make, and what should happen next?" | Attention queue → selected case → decision workspace         |
| Dean    | "How is advising functioning in my area, and where does my team need attention?"        | Operational health → bottlenecks → advisor workload → trends |
| VP      | "How do faculties compare, and which direction are they moving?"                        | Aggregate performance → comparison → trends → drilldown      |
| Admin   | "What operational task am I here to do?"                                                | Task → search/filter → edit → validation → confirmation      |

**DP-00 (MUST):** every important interaction answers five questions: Where am I? What is happening?
Why is it happening? What can I do? What happens next? Applied to plan, review, meetings, AI,
notifications, admin workflows, errors, stale data, and permissions.

### 2.1 The five principles (carried from v1.1)

| ID    | Principle                                                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| DP-01 | This product is an **Operate** surface: scanability, consistency, and the real usage scene outrank expression. Brand lives in precise details. |
| DP-02 | Reduction filter: if an element can be removed without losing meaning, remove it.                                                              |
| DP-03 | Hierarchy drives everything: one primary action per screen, unmissable.                                                                        |
| DP-04 | Material honesty: buttons communicate affordance through color, spacing, and typography, not shadows. Cards use borders and background.        |
| DP-05 | Consistency is non-negotiable: identical elements look and behave identically everywhere.                                                      |
| DP-06 | Premium is calm and quiet: no noise, no decoration without a job, motion that feels like physics.                                              |
| DP-07 | Set body text first.                                                                                                                           |
| DP-08 | Whitespace is a feature.                                                                                                                       |
| DP-09 | Design the states, not the happy path.                                                                                                         |
| DP-10 | Accessibility and recoverability are fixed boundaries.                                                                                         |
| DP-11 | Alignment is precision: every element sits on the grid.                                                                                        |
| DP-12 | Boring copy beats cute copy: clear and institutional wins over clever.                                                                         |

## 3. Roles and permissions

Permission is enforced at every layer, not by hiding UI:

- **Route level**: role-scoped route trees; unauthorized routes render the permission-denied state
  (section 7.3), never a blank page or an error aesthetic.
- **Data level**: every query and fetcher is scoped by role; the API never returns out-of-scope data,
  and the client never requests it.
- **Navigation level**: nav items, command palette entries, search results, and notification actions
  are built from the same role-scoped route table.
- **Action level**: mutations check role and state; server verdicts are the authority; the UI renders
  them.

**DS-P-01 (MUST):** one route table with role metadata drives navigation, the palette, breadcrumbs,
and guards. No second hand-maintained list of pages.
**DS-P-02 (MUST):** search and the command palette expose only accessible pages and records (section
5.4). Testing proves a role cannot reach, fetch, search, or trigger anything outside its scope.

## 4. Information architecture

Navigation areas per role (foundation §14). Internal routes may stay more granular; the user-facing
model stays the areas below.

### 4.1 Student

Primary navigation: **Home · My Plan · Academic Record · AI Advisor · My Advisor · Notifications ·
Account**. Mobile bottom nav: **Home · Plan · AI · Advisor · More** (More sheet: Academic Record,
Notifications, Account, language, theme, sign out).

| Area            | Route                                    | Notes                                          |
| --------------- | ---------------------------------------- | ---------------------------------------------- |
| Home            | `/app`                                   | Landing                                        |
| My Plan         | `/app/plan`                              | Plan detail; Builder is its working mode       |
| Plan Builder    | `/app/builder`                           | Internal route under My Plan                   |
| Academic Record | `/app/record`                            | CGPA, credits, enrollment, history, prereq map |
| AI Advisor      | `/app/chat`, `/app/chat/:conversationId` |                                                |
| My Advisor      | `/app/advisor`                           | Advisor profile, office hours, meetings        |
| Notifications   | `/app/notifications`                     |                                                |
| Account         | `/app/account`                           | Profile, sign out                              |

### 4.2 Advisor

Primary navigation: **Queue · Students · Meetings · More** (More: Office Hours, Profile,
Notifications). Mobile bottom nav: **Queue · Students · Meetings · More**.

| Area          | Route                    | Notes                       |
| ------------- | ------------------------ | --------------------------- |
| Queue         | `/advisor`               | Landing, decision workspace |
| Students      | `/advisor/students`      | Caseload                    |
| Meetings      | `/advisor/meetings`      | Both directions             |
| Office Hours  | `/advisor/hours`         | Under More                  |
| Profile       | `/advisor/profile`       | Under More                  |
| Notifications | `/advisor/notifications` | Under More                  |

### 4.3 Dean

Primary navigation: **Overview · Advisors · Analytics · More** (More: Notifications). Mobile bottom
nav: **Overview · Advisors · Analytics · More**.

| Area          | Route                 |
| ------------- | --------------------- |
| Overview      | `/dean`               |
| Advisors      | `/dean/advisors`      |
| Analytics     | `/dean/analytics`     |
| Notifications | `/dean/notifications` |

### 4.4 VP

Primary navigation: **Overview · Faculties · Trends · More** (More: Notifications). Mobile bottom
nav: **Overview · Faculties · Trends · More**.

| Area          | Route                                      |
| ------------- | ------------------------------------------ |
| Overview      | `/vp`                                      |
| Faculties     | `/vp/faculties`; drilldown `/vp/drilldown` |
| Trends        | `/vp/trends`                               |
| Notifications | `/vp/notifications`                        |

### 4.5 Admin

Primary navigation: **Overview · Users · Operations · More** (More: Notifications). **Operations** is
a section landing that groups: Assignments · Courses · Programs · Rules · Registration Windows ·
Notifications · AI Configuration. Mobile bottom nav: **Overview · Users · Operations · More**.

| Area                 | Route                                 |
| -------------------- | ------------------------------------- |
| Overview             | `/admin`                              |
| Users                | `/admin/users`                        |
| Operations           | `/admin/operations` (section landing) |
| Assignments          | `/admin/assignments`                  |
| Courses              | `/admin/courses`                      |
| Programs             | `/admin/programs`                     |
| Rules                | `/admin/rules`                        |
| Registration Windows | `/admin/registration-windows`         |
| Notifications        | `/admin/notifications`                |
| AI Configuration     | `/admin/ai-configuration`             |

**DS-IA-01 (MUST):** legacy routes (`/admin/students`, `/app/profile`) redirect to their new areas so
deep links and tests survive.
**DS-IA-02 (MUST):** the "More" pattern holds the secondary areas on both desktop (nav group) and
mobile (sheet). No role shows more than five bottom-nav items.

## 5. Navigation

### 5.1 Desktop

Persistent left sidebar: product identity, role-specific navigation, active route, notification
indicator, user/account area, collapse capability. Same shell as v1.1 (`w-14` collapsed / `w-56`
expanded at `lg+`), now driven by the section 4 role tables, with "More" rendered as a nav group.

### 5.2 Tablet

The sidebar runs collapsed (icons). Content columns adapt. No separate tablet layout.

### 5.3 Mobile

Mobile is not a shrunken desktop. Pattern set:

- **Top app bar**: product identity, page context, notification bell, account entry.
- **Bottom navigation**: five slots maximum per role (section 4), active state mirrored from the
  route table, 44px+ targets, labels always visible.
- **Sheets/drawers** for secondary actions and the More area.
- **Full-screen dialogs** for complex workflows (scheduling, plan editing on touch).
- Tables transform into stacked rows or cards; horizontal overflow of whole tables is banned
  (section 20).

**DS-N-01 (MUST):** the bottom nav renders only below `md`; the sidebar renders only at `md+`. One
route table drives both.
**DS-N-02 (MUST):** bottom nav items show icon + label, `aria-current="page"` on the active item, and
44px minimum targets.
**DS-N-03 (MUST):** the More sheet is a Radix dialog styled as a bottom sheet, focus-trapped, with
the same entries as the desktop More group.

### 5.4 Command palette

Global `⌘K` (macOS) / `Ctrl+K` (elsewhere), plus a visible entry point in the topbar.

- **Permission-aware**: built from the role-scoped route table plus role-scoped record searches and
  commands. A role only ever sees accessible pages, records, and actions.
- **Content**: page navigation for the current role; record search where an endpoint exists (assigned
  students for advisor, own plan/courses for student, users/courses/programs for admin); commands
  (Open My Plan, Ask AI, Set availability, Open queue, Open registration windows); recent
  conversations for the student.
- **Behavior**: type-to-filter, arrow navigation, Enter executes, Esc closes, focus returns to the
  trigger, `aria` combobox/listbox semantics, sections with headings, no mouse-only information.
- **DS-N-04 (MUST):** the palette is hand-built on the existing Radix dialog + list primitives. No
  new dependency. It reuses the same keyboard contract as the combobox.
- **DS-N-05 (MUST):** palette entries declare their permission scope in the same route table the
  guards use. Adding a page adds its palette entry; there is no second list.

### 5.5 Breadcrumbs and page headers

- **Breadcrumbs** on complex pages (below the top level): `Students / Ahmed Hassan / Academic Plan`.
  Collapsed to `…` between root and current on mobile. `aria-label="Breadcrumb"`, current page is
  `aria-current="page"`, separators are decorative.
- **Page header**: breadcrumb, page title, concise description, one primary action (right-aligned in
  LTR), secondary actions where needed. Never overloaded with buttons (DP-03).
- **DS-N-06 (MUST):** one `PageHeader` component renders this pattern everywhere; `ContentLayout`
  composes it. Every major page uses it.

## 6. Visual design system

### 6.1 Token architecture

Two layers, one direction of reference:

1. **Primitive tokens**: the raw scales (crimson ramp, slate ramp, plan-state palette). Defined once
   in `@theme` (Appendix B).
2. **Semantic tokens**: the shadcn channels (`--background`, `--primary`, `--state-*`, `--success`,
   ...) that flip between `:root` and `.dark`.

**DS-C-01 (MUST):** components reference semantic utilities only (`bg-primary`,
`text-state-draft-foreground`, `border-border`). Raw values are banned in `className` and style
objects.
**DS-C-02 (MUST):** the same color means the same thing everywhere. Never reuse a status color for
decoration.
**DS-C-03 (MUST):** dark mode is a token flip, never per-class `dark:` improvisation on a new color.

### 6.2 Brand color

E-JUST crimson is the brand anchor (Appendix B carries the full ramp). `crimson-700` is the light-mode
primary, `crimson-600` the dark-mode primary, hover/active step darker.

**DS-C-04 (MUST):** primary buttons: `crimson-700` light / `crimson-600` dark, hover one step darker,
active one more. White foreground in both themes.
**DS-C-05 (MUST):** one focus ring token: `--ring` = crimson-500 (light) / crimson-400 (dark).
**DS-C-06:** gold `#D4AF37` is reserved for the university logo lockup and ceremonial identity
moments. Never for functional UI.

### 6.3 Neutrals and semantic status

Neutrals stay on the slate-based shadcn channels. Semantic status channels: `--success`, `--warning`,
`--info`, `--destructive` (Appendix B).

**DS-C-07 (MUST):** status renders as tint (bg-50/100 + fg-700/800 + border-200/300) for chips,
badges, and banners, and as solid only for buttons and badges with the verified pairs in Appendix B.
**DS-C-08 (MUST):** never encode meaning in color alone. Status always pairs color with an icon, a
dot, or text.

### 6.4 Unified status system (v2)

Status semantics are consistent across all roles. Every status renders **icon + label + color**; the
`StatusChip` family maps every product status onto one of the four semantic channels or the plan-state
palette.

| Domain  | Statuses                                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------------- |
| Plan    | draft · submitted · under review · returned · approved · expired · closed · withdrawn · discarded                      |
| Meeting | requested · pending · proposed · awaiting response · confirmed · completed · declined · cancelled · expired · conflict |
| Account | active · suspended · binding pending · binding failed                                                                  |
| Data    | saving · saved · updating · stale · offline · error                                                                    |

**DS-C-09 (MUST):** meeting and account statuses use the semantic channels: requested/pending/proposed
= info, awaiting response = warning, confirmed/completed/saved = success, declined/cancelled/expired/
conflict/error = destructive, closed/withdrawn = neutral. Icons are fixed per status.
**DS-C-10 (MUST):** plan-state colors appear only on plan surfaces (PlanStateChip, plan banners,
progress visuals); meeting colors only on meeting surfaces. No cross-domain reuse.

### 6.5 Plan-state colors

Unchanged from v1.1 (Appendix B). Expired renders with the `state-failed` pair plus a dashed border;
withdrawn and discarded render `state-closed`.

### 6.6 Data visualization

Heatmap quartiles and categorical series unchanged (Appendix B). Charts exist only to answer a
specific question (Is performance improving? Where is the bottleneck? Which faculty differs? How is
workload distributed? How old are unresolved cases?).

**DS-C-11 (MUST):** every chart has a legend, tooltips, and a text alternative (table or summary).
All charts are hand-rolled SVG or an approved lib; no 3D, no gauges.
**DS-C-12 (MUST):** chart and table numbers use `tabular-nums`.
**DS-C-13 (MUST):** no chart wall: a governance page carries at most one chart plus its supporting
tables; every chart names the question it answers in its title or caption.

### 6.7 Typography

Inter (EN) + Cairo (AR), loaded as in v1.1. Scale: Tailwind defaults plus `text-2xs`.

| Class                | Size          | Use                                        |
| -------------------- | ------------- | ------------------------------------------ |
| `text-2xs`           | 11px, lh 1.45 | Dense staff tables, meta labels only       |
| `text-xs`            | 12px          | Captions, table meta, helper text          |
| `text-sm`            | 14px          | Default UI text, labels, buttons           |
| `text-base`          | 16px          | Body text, form inputs (prevents iOS zoom) |
| `text-lg`–`text-2xl` | 18–24px       | Page titles, card titles                   |
| `text-3xl`+          | 30px+         | Display numbers, empty-state titles        |

Type hierarchy roles (v2): display/title (`text-3xl font-bold`), page title (`text-2xl font-semibold`),
section title (`text-lg font-semibold`), body (`text-base`), secondary body (`text-sm
text-muted-foreground`), metadata (`text-xs text-muted-foreground`), caption (`text-2xs
text-muted-foreground uppercase tracking-wide` for eyebrows).

**DS-T-01–DS-T-09** carry over unchanged from v1.1: self-hosted fonts with swap; Cairo under RTL;
Latin numerals in both locales; no arbitrary font sizes; line-height rules; `max-w-prose` measure;
weight scale 400/500/600/700; uppercase micro-labels; emphasis via weight or color, never underline.

### 6.8 Spacing, sizing, density

Base unit 4px. Two densities on one token set (v1.1 table holds): student surfaces spacious and
phone-first, staff surfaces compact and desktop-first.

**DS-S-01 (MUST):** every interactive element reaches 44×44px on touch viewports; the 36px staff
controls only behind `pointer: fine` and `lg`.
**DS-S-02 (MUST):** spacing comes from the scale. No arbitrary values.
**DS-S-03:** prefer wrapper `gap` over child margins.
**DS-S-04:** student surfaces pass at 390px; staff surfaces at 1440px with a readable fallback to
360px.

### 6.9 Radius, elevation, z-index

One radius system (`rounded-md` controls, `rounded-lg` surfaces, `rounded-full` pills). Pills are for
true statuses and categories, not every element. Elevation: material honesty — `shadow-sm` popovers,
`shadow-lg` dialogs/drawers, `shadow-xs` sticky headers, nothing else. Z-scale: sticky 10, dropdown
30, overlay 40, modal 50, toast 60. (Rules DS-R-01–03, DS-Z-01 carry over.)

### 6.10 Icons

**DS-I-01 (MUST):** lucide-react is the only icon family. One style, `strokeWidth` 2, sizes 16/20/24.
No emoji as icons or decoration. Decorative icons get `aria-hidden`.
**DS-I-02 (MUST):** directional icons mirror under RTL.

## 7. State system

### 7.1 Interaction states

Every interactive element implements the full cycle (v1.1 table holds): hover, focus-visible, active,
disabled, loading, readonly, selected. Loading feedback within 100ms; skeletons for 300ms+.

### 7.2 Plan lifecycle states

The machine and visual contract are unchanged (foundation §7.1; v1.1 rules DS-ST-04–07 hold):
PlanStateChip everywhere a plan state renders, lock icons on locked states, polite announcements,
state × surface matrix.

### 7.3 Screen and data states

**DS-ST-08 (MUST):** every screen defines its states or documents N/A. The full matrix (v2):

| State                     | Pattern                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| loading                   | Skeleton matching the final layout shape. No full-page spinners for area loads                                                                                                 |
| empty                     | EmptyState: icon, title, body, one action when an action exists. Names what is empty, whether it is normal, and the next step                                                  |
| partial                   | Content renders; the missing slice shows a scoped skeleton or inline notice                                                                                                    |
| saving / saved / updating | Button state + polite live region; the plan and meeting editors show all three                                                                                                 |
| error                     | Inline under fields; page errors as destructive Banner with Retry; transient as toast. States what failed, whether anything was saved, whether it is temporary, and what to do |
| permission denied         | Calm panel with role reminder and a way back; route-scoped nav prevents most cases                                                                                             |
| stale SIS                 | RecordFreshness line above the record with as-of time + retry; content stays visible. The SIS integration removed per-dataset staleness flags; refresh is lazy                 |
| offline                   | Banner: reads are cached, writes queue or disable with explanation                                                                                                             |
| conflict                  | Explicit conflict banner with the two versions and resolution actions (meeting slots, plan edits)                                                                              |
| window closed             | WindowClosedBanner replaces the submit CTA area; builder stays readable                                                                                                        |
| locked / expired          | Lock affordance + explanation of who can unlock and when                                                                                                                       |
| not found                 | Calm not-found panel with role-aware way back                                                                                                                                  |
| rate limited              | Calm banner with the wait; AI surfaces show quota state                                                                                                                        |
| maintenance               | Full-page calm notice; no error aesthetic                                                                                                                                      |
| session expired           | Redirect to login with `reason=expired` and a return path                                                                                                                      |

### 7.4 Validation and the hard block

Unchanged from v1.1 (DS-ST-09–12): the server validates; the UI renders its results grouped by line;
the hard block sits at the submit gate; copy passes the no-label test; the panel is polite live and
focuses the message on desktop.

## 8. Component system

### 8.1 Conventions

Unchanged (v1.1 5.1): primitives in `src/components/ui/<name>/` with story + test (plop); domain
components in `src/features/<domain>/components/`; Radix + CVA + `cn()`; `forwardRef` + `displayName`;
DS-CP-01 design-it-twice; DS-CP-02 reuse check; DS-CP-03 story + test; DS-CP-04 composition over
props.

### 8.2 Inventory

Primitives: button, dialog, drawer (+ sheet), dropdown, form, table + pagination, spinner,
notifications (toasts), link, md-preview, badge, chip, card, kpi-card, tabs, tooltip, banner, skeleton,
empty-state, avatar, confirm-dialog, breadcrumb, page-header, command-palette, bottom-nav, sheet.

Domain: plan-state-chip, plan-card, plan-line, validation-panel, comment-thread, seen-button,
submit-suggestion-card, prereq-map, status-chip (meeting/account/data), meeting-request-card,
slot-picker, availability-editor, queue-table, review-drawer (review workspace), caseload-table,
advisor-workload-table, scoreboard-table, funnel-chart, trend-chart, faculty-scorecard, drilldown-table,
notification-center, record-freshness, window-closed-banner, advisor-card, course-card (AI).

**DS-CP-05 (MUST):** new components enter through section 24 governance: reuse check, spec added to
this section, story + test, then build. Never build a second variation of an existing component.

### 8.3 New primitive specs (v2)

**Breadcrumb** — `nav aria-label="Breadcrumb"`; ordered list; separators `ChevronRight` mirrored in
RTL, `aria-hidden`; last item `aria-current="page"`; collapse prop for long trails.

**PageHeader** — anatomy: breadcrumbs (optional), title (`text-2xl font-semibold`), description
(`text-sm text-muted-foreground`), actions slot (one primary + secondaries). Sticky optional on long
pages (`shadow-xs`).

**CommandPalette** — Radix dialog centered top (`top-[20%]`), input with search icon, grouped list,
footer hints (↑↓ navigate, ↵ select, esc close). Group headings `text-2xs uppercase`. Item: icon +
label + optional meta + optional kbd shortcut. Empty: "No results for {query}". Role-scoped entries
only.

**BottomNav** — `nav` fixed bottom, `bg-card border-t`, 5 slots, icon over `text-2xs` label, active =
primary color + `aria-current="page"`, safe-area padding (`env(safe-area-inset-bottom)`), hidden at
`md+`.

**Sheet** — Radix dialog with bottom/side placement variants; bottom sheet on mobile (drag-handle
affordance optional, rounded top corners), used for More, filters, and secondary actions.

**StatusChip** — semantic status renderer: `domain: 'meeting' | 'account' | 'data'`, `status` union;
icon + label; tint pair from 6.4; `sr-only` full text ("Meeting status: Confirmed"). One component,
no per-feature one-offs.

### 8.4 Domain component specs (v2 changes and additions)

Carried from v1.1 with their specs: PlanStateChip, PlanCard, PlanLine (now with per-line credits),
ValidationPanel, CommentThread, SeenButton, SubmitSuggestionCard, PrereqMap, RecordFreshness,
WindowClosedBanner, QueueTable, NotificationCenter.

New and changed:

**MeetingRequestCard** — one card per meeting request in either direction: other party (name, id),
direction line, reason + note, StatusChip (meeting), proposed/selected slots via SlotViewer,
timestamps. Actions depend on state, direction, and viewer: advisor on requested → Approve (opens
slot picking), Propose time, Delay, Decline; student on proposed → Accept slot / pick alternative /
Decline; either side on confirmed → Cancel (confirm dialog, reason), advisor → Mark completed;
initiator on requested → Cancel. Conflict renders an explicit conflict line.

**SlotPicker** — pick one slot for confirming a meeting: generated from availability for the chosen
date range, shows existing bookings as unavailable with the reason, keyboard operable (radiogroup
semantics per day), 44px targets, tentative/confirmed distinction visible.

**AvailabilityEditor** — evolves SlotEditor: recurring weekly rows (day/from/to, max 5), live overlap
validation, clear-all confirm, global-defaults reuse banner (v1.1 behavior), plus an optional
date-specific exceptions list (blocked dates). Editing explains what generates from it ("Students see
these as bookable times").

**ReviewDrawer → Review workspace** — same drawer shell and modal behavior (focus trap, ESC, focus
return), structured into nine sections in order: (1) student summary, (2) academic summary, (3)
current status, (4) plan/courses, (5) validation results, (6) warnings, (7) comments, (8) meeting
information, (9) decision area. Primary actions Approve / Return / Request meeting are visually
obvious (Approve = primary button; Return requires written reason; Request meeting opens the meeting
flow). Sections collapse on mobile heights.

**CaseloadTable** — advisor students table: search, filters (academic status, review status, meeting
status, attention), sort, columns: student, plan state, review status, meeting status, last
interaction, attention flag. Row click opens the student workspace (drawer). Transforms to stacked
cards on mobile.

**AdvisorWorkloadTable** — dean's per-advisor aggregates: grouping, caseload size, queue size,
decision times, activity, aggregate outcomes. Tabular-nums, sort, CSV export. No student rows.

**TrendChart** — line/bar series over terms for dean analytics and VP trends: completion %, median
decision time, aging. Legend + tooltips + text alternative; the question the chart answers is its
title.

**AdvisorCard** — student-facing advisor identity: name, public title, department/faculty, office,
office hours, availability summary, contact channel the product permits (in-app only), link to
meetings. Never exposes internal advisor data.

**CourseCard (AI)** — structured AI response card: code (bidi-isolated), title, credits, status line,
why-it-matters line, and one action (add to plan / view details) when permitted.

## 9. Student UX

Mental model: "Where am I academically, what should I do next, and who can help me?"

- **Home (S1)** answers immediately: academic progress (CGPA, credits), current term, plan state and
  health, next recommended actions (submit, see feedback, respond to a meeting proposal), advisor
  card, upcoming meeting, important notifications, AI entry point. Not a KPI card wall: one column of
  meaning, ordered by what needs the student first.
- **My Plan (S2)**: the plan document with lines, credits, state chip, comments + Seen, meeting badge,
  and the state-specific CTA. All plan states per section 7.2.
- **Plan Builder (S3)**: guided decision-making. Add/remove/move courses, inspect prerequisites and
  credit impact, understand why a course is or is not appropriate ("CS402 requires CS301 first"),
  validate, save, submit where the window allows. Validation copy is understandable (section 7.4).
- **Academic Record (S4)**: CGPA, cumulative + earned credits, remaining credits, current enrollment,
  course history, prerequisite map. Charts sparingly; information that supports decisions.
- **AI Advisor (S5)**: section 14.
- **My Advisor (S6)**: advisor card, office hours, availability, upcoming + past meetings, request
  meeting (reason, preferred time, optional note), respond to proposals. The advisor is a
  first-class destination, not a profile card.
- **Notifications (S7)** and **Account (S8)** per their sections.

## 10. Advisor UX

Mental model: "Who needs my attention, what decision do I need to make, and what should happen next?"

- **Queue (A1)**: a decision workspace, not just a table. Filters: All · New · Under Review ·
  Returned · Aging. Sort: urgent, aging, newest, last updated, academic risk where applicable. Rows
  show enough to triage without exposing unnecessary student data. Row click opens the review
  workspace.
- **Review workspace (A1/A2)**: the nine-section drawer (section 8.4) with Approve / Return / Request
  meeting as first-class actions.
- **Students (A2)**: caseload with search, filters (academic status, review status, meeting status,
  last interaction, attention), and a contextual student workspace on open.
- **Meetings (A3)**: both directions in one list (section 15); approve/propose/delay/decline student
  requests; invite students; today's commitments visible first.
- **Office Hours (A4)**: availability editor (section 8.4).
- **Profile (A6)** / **Notifications (A5)** under More.

## 11. Dean UX

Mental model: "How is advising functioning in my area, and where does my team need attention?"

- **Overview (D1)**: operational health — completion, median decision time, aging, the plan funnel,
  and the biggest bottleneck, named. One chart (DS-C-13) plus supporting tables.
- **Advisors (D2)**: aggregate advisor view — grouping, workload, queue size, decision times,
  activity, outcomes. No student-level details (PR-03, PR-14).
- **Analytics (D3)**: trends over terms; comparisons across the dean's departments; every chart
  answers a named question.
- Scope: own area only; no VP data; no other faculties.

## 12. VP UX

Mental model: "How do faculties compare, and which direction are they moving?"

- **Overview (V1)**: university aggregate performance and the faculty scorecard entry.
- **Faculties (V2)**: faculty scorecards; drilldown University → Faculty → Department. It stops
  there (PR-15). **Never a dean name beside faculty statistics.**
- **Trends (V3)**: completion, decision time, aging over terms; faculty comparisons.
- Aggregates emphasize trends and comparisons, never operational detail; no advisor or student data.

## 13. Admin UX

Mental model: "What operational task am I here to do?" Composition: task → search/filter → edit →
validation → confirmation.

- **Overview (M0)**: the operational state of the machine: counts that route to tasks (users,
  pending bindings, assignments, rules, windows), not analytics.
- **Users (M1)**: students and staff; search, role/account information, activation/deactivation,
  binding repair, staff creation, password reset.
- **Operations** groups: **Assignments** (M2: advisor↔student, import, changes, validation),
  **Courses** (M3: metadata CRUD), **Programs** (M4: structure CRUD), **Rules** (M5: prerequisite and
  eligibility rules editor), **Registration Windows** (M6: window state and period metadata),
  **Notifications** (M7: configuration), **AI Configuration** (M8: AI product configuration — no
  infrastructure settings), **Academics** (M9: registrar imports for statistics, active courses,
  credit allowances, and curricula; the current-term form; the SIS mirror revoke).
- The Academics screen follows the SIS integration contract (backend ticket/acad-42g): every import
  answers an imported/skipped/rejected report; rejected-row lists scroll and cap at 20 rows with a
  "N more" note, because registrar files with hundreds of bad rows are a normal case.
- Destructive actions follow PR-17. Scope stays fixed (PR-18): no org management, audit logs,
  support center, system health. SIS data administration moved into admin scope with the SIS
  integration; the SIS itself stays read-only (PR-16).

## 14. AI UX

The AI is an integrated academic assistant, not a chat client clone. It supports: context, user
intent, thinking/loading, tool/action execution, streaming response, structured academic result, next
action.

- **Entry experience**: helpful starting points grounded in the student's real context ("What should
  I register next semester?", "Can I take CS402?", "How many credits do I have left?", "Explain why
  this course is blocked", "Help me plan next semester", "What should I discuss with my advisor?").
- **Response types**: course cards, prerequisite explanations, plan proposals (courses, credits,
  reasoning, prerequisites, warnings, conflicts, assumptions), progress summaries, warnings,
  comparisons, meeting suggestions, action suggestions. Never plain-text-only (section 8.4).
- **Plan proposal**: always shows "Nothing has been submitted yet" and requires explicit review and
  confirmation before anything happens (PR-07). The submit handoff stays the SubmitSuggestionCard →
  confirm → arm flow.
- **States** (rendered in the transcript): idle, thinking, streaming, executing tool, rendering
  result, success, partial result, failed, retrying, cancelled, unavailable, rate limited. Tool
  execution shows what happened in user language; internals stay hidden.
- Voice per DS-W-08: helpful, concrete, rule-grounded, never labeling, predicting, or deciding.

## 15. Meeting and availability UX

One model, both directions (foundation §10). The lifecycle: Requested → Pending → Proposed → Awaiting
Response → Confirmed → Completed, with Declined / Cancelled / Expired / Conflict alternates.

- **Student starts** (My Advisor): request with reason (categorized), preferred time/date where
  applicable, optional note. Advisor acts: approve (pick a slot from availability — existing windows,
  global defaults, or newly added — the chosen slot becomes confirmed), propose a different time,
  delay, or decline. The student receives every outcome as a notification and in My Advisor, and can
  respond to proposals (accept, pick an alternative, decline).
- **Advisor starts** (Meetings): invite a caseload student with reason, note, availability source, and
  proposed slots. The student accepts a slot, picks from alternatives, proposes another time where
  supported, or declines. Both parties see the confirmation.
- **Shared abstractions**: one meeting-request type, one status machine, one card component, one slot
  vocabulary. No separate incompatible flows per direction.
- **Availability UX**: what is generally available, what is available for this meeting, why a slot is
  unavailable, and whether a slot is tentative or confirmed are always visible. Recurring windows,
  duration, buffer, and conflict detection per foundation §10.4. Inspired by mature scheduling
  products; not a calendar rebuild.
- **States**: every meeting surface renders the full status set (section 6.4) with icon + label +
  color; conflict and expiry are explicit.

## 16. Academic plan UX

- The plan shows: program, degree progress, credits earned and remaining, completed, current, and
  planned courses, prerequisites, eligibility, required/elective classification, conflicts, warnings,
  expected progression (foundation §7 + credits amendment).
- Course states: completed, current, planned, available, prerequisite blocked, failed, repeated,
  recommended, required, elective, conflicting. The UI explains **why** a course is or is not
  appropriate.
- Readable course rows/cards over dense academic tables; the builder keeps the line model.
- Builder interactions: add, remove, move, inspect, understand prerequisites and credit impact,
  detect conflicts, compare alternatives, validate, save draft, submit for review where applicable.
  Validation is understandable ("CS402 cannot be added because CS301 is required first").

## 17. Notification UX

Categorized (foundation §11): action required, informational, resolved, meeting, academic plan,
advisor, AI, administrative. Every item: icon by category/trigger, title, concise explanation,
timestamp, action where one exists, read/unread state, and a deep link into the correct workflow.
Unread count badge on the bell. Mark-read on open; mark-all control. The center renders the triggers
the contract defines; it never invents channels (PR-05).

## 18. Interaction design

- One primary action per screen (DP-03).
- Drawer for contextual detail, review, quick editing; modal for focused confirmation and
  consequential decisions; full-screen mobile flow for complex editing, scheduling, and substantial
  review workflows. Complete workflows never hide inside tiny dialogs.
- Destructive actions: impact → confirm → execute → result → undo where safe (PR-17). Confirm dialogs
  use verb-specific confirms ("Return plan", not "OK"); focus starts on cancel.
- Forms: clear labels, required/optional distinction, inline validation, preserved input after
  recoverable failures, meaningful errors, disabled/loading states, success confirmation, autosave
  where useful (DS-A-04 carries the wiring rules).
- Lists and tables: search, filters, sort, pagination, clear-filters, saved state where useful;
  contextual filters; mobile uses filter sheets, not squeezed desktop bars (section 20).
- Tables: semantic headers, keyboard navigation where appropriate, sorting, filtering, loading, empty,
  error states, row actions (few), responsive transformation (DS-TB rules from v1.1 section 5.3).

## 19. Motion design

Motion explains change, never decorates. Tokens (v1.1 3.10): fast 150ms, base 200ms, slow 300ms,
modal 400ms; entrances `ease-out-expo`, exits faster (0.6x); micro interactions 50–150ms, component
transitions 150–300ms, page transitions 250–450ms. Animate only transform and opacity; respect
`prefers-reduced-motion`; canonical keyframes `fade-in`, `chip-in`, `typing` (Appendix B).

Apply motion to: drawer open/close, filter state changes, plan course movement, status transitions
(chip-in), notification arrival, AI streaming, skeleton→content, meeting status changes. Nothing
else. DS-M-01–06 carry over.

## 20. Responsive design

| Viewport        | Shell                    | Content                                  |
| --------------- | ------------------------ | ---------------------------------------- |
| Desktop ≥1024   | Expanded sidebar         | Content + optional detail drawer         |
| Tablet 768–1023 | Collapsed sidebar        | Adaptive columns                         |
| Mobile <768     | Top app bar + bottom nav | Single column; sheets; full-screen flows |

- Tables become stacked rows, cards, or priority information blocks; whole-table horizontal overflow
  is banned.
- Filters collapse into a sheet on mobile.
- Drawers become full-screen sheets on mobile.
- Verification widths: student surfaces 390px and 1440px; staff surfaces 1440px, readable to 360px.
- Viewport is never pinned; zoom is never disabled (DS-A-06).

## 21. Accessibility

Target WCAG 2.1 AA (foundation §17). The v1.1 rules carry over: DS-A-01 contrast 4.5:1 / 3:1 in every
theme × language; DS-A-02 full keyboard operation for the hardest surfaces — now Plan Builder, the
advisor queue + review workspace, **the command palette**, and **scheduling interactions**; DS-A-03
SR labels on chips + chart alternatives; DS-A-04 form wiring; DS-A-05 color never alone; DS-A-06 44px
touch targets, zoom never disabled; DS-A-07 reduced motion + `prefers-color-scheme` seed; DS-A-08 page
structure (one h1, landmarks, skip link, document title + lang/dir per route); DS-A-09 aria-busy +
polite live regions, nothing important only in a toast. Dialogs and drawers: focus trap, ESC, focus
return. Arabic/RTL layouts stay accessible and structurally correct (DS-L-03–07 carry over).

## 22. Content and UX writing

Voice: concise, calm, precise, human, professional (v1.1 section 8 carries over in full: DS-W-01
through DS-W-08). Additions:

- **DS-W-09 (MUST):** every error explains what failed, whether anything was saved, whether it is
  temporary, and what to do. "Something went wrong" is banned where a useful explanation exists.
- **DS-W-10 (MUST):** every empty state names what is empty, whether that is normal, and the next
  step.
- **DS-W-11 (MUST):** the product self-describes honestly: the AI assists, it does not decide;
  registration happens in the SIS; the platform never pretends stale data is current.
- **DS-W-12 (MUST):** status copy is consistent per section 6.4; the same status uses the same label
  everywhere.

## 23. End-to-end flows

Canonical flows the implementation and tests must satisfy (foundation §16 as amended):

- **J1 Happy loop**: window opens → student Home CTA → builder (optionally AI-assisted) → valid →
  submit → advisor approves → student notified → registers in SIS → verification → closed.
- **J2 Return loop**: advisor returns with mandatory reason → student notified → Seen → edit →
  resubmit → approved or expired.
- **J3 Student meeting loop**: My Advisor → request meeting (reason, preferred time, note) → advisor
  approves with an availability slot (or proposes / delays / declines) → confirmation to both →
  meeting happens → advisor marks completed.
- **J4 Advisor meeting loop**: advisor invites caseload student with proposed slots → student accepts
  (or proposes/declines) → confirmation to both.
- **J5 Governance**: admin seeds accounts/assignments/courses/windows → dean Overview: health,
  bottlenecks, advisor workload → VP Overview: faculties compared, trends.
- **J6 Admin task loop**: find user/course/program → edit → validation → confirm → result.
- **J7 AI proposal loop**: student asks AI → structured plan proposal → "nothing has been submitted
  yet" → student reviews → explicit confirm → submit result.

## 24. UX acceptance criteria and quality gates

A page is done when all of the following hold (extends v1.1 section 9):

1. Tokens only; both themes; both directions (DS-C-01/03, DS-L-03).
2. All applicable states from section 7.3 handled or N/A.
3. One primary action; PageHeader pattern respected (DS-N-06).
4. Interactive elements complete the interaction cycle; 44px touch targets; visible focus.
5. Keyboard operable, including palette and scheduling; focus management correct.
6. Copy final in EN and AR; dictionary keys only; status labels consistent (DS-W-01/12).
7. Charts (if any) name their question and carry text alternatives (DS-C-11/13).
8. Permission matrix respected on-screen and at the data layer; palette entries scoped.
9. Mobile: bottom nav present, tables transformed, sheets used, verified at 390px.
10. `npm run verify` and `npm run lint` pass; no new a11y warnings; no weakened gates.
11. Tests cover the screen's workflows (unit/component; E2E for role journeys).
12. Bounded verification: one inspection round, batch fixes, at most one confirm round (DS-0-03).

**Governance** (v1.1 section 11 carries over): DS-G-01 no one-off styling; DS-G-02 token changes via
proposal + Appendix B + consumers in one change; DS-G-03 new components via reuse check + spec + story

- test; DS-G-04 fix inconsistencies at the token level; DS-G-05 semantic versioning of this file;
  DS-G-06 D-phase acceptance; DS-G-07 dependencies, new base folders, and new documentation files
  require explicit human approval.

**Skill routing** (v1.1 section 10 carries over): DS-AI-01 the skill gate; DS-AI-02 repo rules
outrank skills; DS-AI-03 process skills first; DS-AI-04 classify work (spike/bounded/architectural);
DS-Q-01 review priority order: accessibility → touch/interaction → performance → style →
layout/responsive → typography/color → motion → forms → navigation → charts.

## 25. Implementation mapping

| Contract                                   | Code                                                                                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route table + role metadata (sections 3–5) | `src/config/paths.ts` (extends to role-scoped entries), `src/components/layouts/app-shell.tsx` (sidebar + bottom nav + More), `src/lib/authorization.tsx` (guards)                                            |
| Command palette                            | `src/components/ui/command-palette/` (new, Radix-based, no new deps)                                                                                                                                          |
| PageHeader + breadcrumbs                   | `src/components/ui/page-header/`, `src/components/ui/breadcrumb/` (new); `ContentLayout` composes them                                                                                                        |
| Status chips (meeting/account/data)        | `src/components/ui/status-chip/` (new); plan states stay on PlanStateChip                                                                                                                                     |
| Meeting model                              | `src/features/advisor-meetings/` (unified requests, both directions), `src/features/advisor-hours/` (availability), student side in `src/features/my-advisor/` (new)                                          |
| Review workspace                           | `src/components/domain/review-drawer/` (restructured)                                                                                                                                                         |
| Student areas                              | `/app` Home (dashboard), `/app/record` (new, from profile), `/app/advisor` (new), `/app/account` (from profile)                                                                                               |
| Dean/VP                                    | `src/features/governance/` (advisor aggregates, trends)                                                                                                                                                       |
| Admin operations                           | `src/features/admin/` (users, operations landing, courses, programs, registration windows, AI config)                                                                                                         |
| Notifications                              | `src/features/notifications/` (categories)                                                                                                                                                                    |
| AI                                         | `src/features/ai-chat/` (structured renderers, states)                                                                                                                                                        |
| Mock/contract layer                        | `src/testing/mocks/` + `mock-server.ts` (new endpoints; existing scenarios preserved)                                                                                                                         |
| i18n                                       | `src/lib/i18n/locales/{en,ar}/*.json` — every new string keyed in both languages                                                                                                                              |
| Naming                                     | User-visible "Advisor"; internal storage keys stay `advaisor.*` (`advaisor.token`, `advaisor.theme`, `advaisor.language`, `advaisor.scenario`) — renaming them would drop user state for no user-visible gain |

## Appendix A: resolved contradictions

| Topic                            | Resolution                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| Em dash                          | Repo rules win: no em dashes in UI copy, labels, or agent prose. Ranges use the hyphen   |
| Serif                            | No serif. Inter + Cairo                                                                  |
| Icon library                     | lucide-react only                                                                        |
| Type scale                       | Tailwind defaults plus `text-2xs`                                                        |
| Inter as default                 | Qualifies under the public-sector/civic exception: academic institution, Operate surface |
| Pure white background            | Operate app keeps white/slate surfaces; text is never pure black; no marketing pages     |
| Emoji                            | Banned in UI copy and as icons                                                           |
| v1 Proposed-to-Done visits       | Superseded by the v2 unified meeting model (foundation §10)                              |
| v1 "no credits on plan surfaces" | Superseded: credits are visible (foundation §7.3 v2)                                     |
| v1 "no bottom-bar pattern in v1" | Superseded: bottom navigation is the mobile pattern (section 5.3)                        |
| v1 "Advaisor" naming             | Superseded: the product name is Advisor                                                  |

## Appendix B: token blocks

```css
@theme {
  /* Brand ramp (primitive) */
  --color-crimson-50: #fcf4f4;
  --color-crimson-100: #f8e5e6;
  --color-crimson-200: #f0c9cd;
  --color-crimson-300: #e3a2aa;
  --color-crimson-400: #d0727d;
  --color-crimson-500: #b24a53;
  --color-crimson-600: #9b2731;
  --color-crimson-700: #8b0000;
  --color-crimson-800: #6b0000;
  --color-crimson-900: #520000;
  --color-crimson-950: #380000;

  /* Plan states (semantic; values flip in .dark below) */
  --color-state-draft: var(--state-draft);
  --color-state-draft-foreground: var(--state-draft-foreground);
  --color-state-draft-border: var(--state-draft-border);
  --color-state-submitted: var(--state-submitted);
  --color-state-submitted-foreground: var(--state-submitted-foreground);
  --color-state-submitted-border: var(--state-submitted-border);
  --color-state-under-review: var(--state-under-review);
  --color-state-under-review-foreground: var(--state-under-review-foreground);
  --color-state-under-review-border: var(--state-under-review-border);
  --color-state-returned: var(--state-returned);
  --color-state-returned-foreground: var(--state-returned-foreground);
  --color-state-returned-border: var(--state-returned-border);
  --color-state-approved: var(--state-approved);
  --color-state-approved-foreground: var(--state-approved-foreground);
  --color-state-approved-border: var(--state-approved-border);
  --color-state-failed: var(--state-failed);
  --color-state-failed-foreground: var(--state-failed-foreground);
  --color-state-failed-border: var(--state-failed-border);
  --color-state-closed: var(--state-closed);
  --color-state-closed-foreground: var(--state-closed-foreground);
  --color-state-closed-border: var(--state-closed-border);

  /* Semantic status */
  --color-success: hsl(var(--success));
  --color-success-foreground: hsl(var(--success-foreground));
  --color-warning: hsl(var(--warning));
  --color-warning-foreground: hsl(var(--warning-foreground));
  --color-info: hsl(var(--info));
  --color-info-foreground: hsl(var(--info-foreground));

  /* Typography */
  --font-arabic:
    'Cairo', 'IBM Plex Sans Arabic', ui-sans-serif, system-ui, sans-serif;
  --text-2xs: 0.6875rem;
  --text-2xs--line-height: 1.45;

  /* Motion */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --animate-fade-in: fade-in 150ms var(--ease-out-expo);
  --animate-chip-in: chip-in 150ms var(--ease-out-expo);
  --animate-typing: typing 1.2s ease-in-out infinite;

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes chip-in {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes typing {
    0%,
    60%,
    100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-2px);
      opacity: 1;
    }
  }
}

@layer base {
  :root {
    --primary: 357.333333 78.947368% 44.705882%;
    --primary-foreground: 0 0% 100%;
    --ring: 225.443787 75.111111% 55.882353%;
    --success: 154.821429 90.322581% 24.313725%;
    --success-foreground: 0 0% 100%;
    --warning: 21.849711 91.534392% 37.058824%;
    --warning-foreground: 0 0% 100%;
    --info: 201 97.560976% 32.156863%;
    --info-foreground: 0 0% 100%;
    --destructive: 343.404255 79.661017% 34.705882%;
    --state-draft: #f0efee;
    --state-draft-foreground: #44423e;
    --state-draft-border: #c8c6c3;
    --state-submitted: #eef4ff;
    --state-submitted-foreground: #1d3aa3;
    --state-submitted-border: #bfd2fb;
    --state-under-review: #fffbeb;
    --state-under-review-foreground: #965f04;
    --state-under-review-border: #fde68a;
    --state-returned: #fff6ed;
    --state-returned-foreground: #b54708;
    --state-returned-border: #fedf89;
    --state-approved: #ecfdf3;
    --state-approved-foreground: #067647;
    --state-approved-border: #abefc6;
    --state-failed: #fff1f4;
    --state-failed-foreground: #9f1239;
    --state-failed-border: #fecdd6;
    --state-closed: #f8f8f7;
    --state-closed-foreground: #5a5752;
    --state-closed-border: #e1e0de;
  }

  .dark {
    --primary: 357.181208 91.411043% 68.039216%;
    --primary-foreground: 30 7.142857% 5.490196%;
    --ring: 220.8 86.206897% 77.254902%;
    --success: 152 82.089552% 39.411765%;
    --success-foreground: 30 7.142857% 5.490196%;
    --warning: 34.033613 93.700787% 50.196078%;
    --warning-foreground: 30 7.142857% 5.490196%;
    --info: 198.933333 91.093117% 48.431373%;
    --info-foreground: 30 7.142857% 5.490196%;
    --destructive: 348.979592 96.078431% 90%;
    --destructive-foreground: 30 7.142857% 5.490196%;
    --state-draft: #2d2b28;
    --state-draft-foreground: #f0efee;
    --state-draft-border: #5a5752;
    --state-submitted: #111b3d;
    --state-submitted-foreground: #93b3f7;
    --state-submitted-border: #2549c8;
    --state-under-review: #3a2005;
    --state-under-review-foreground: #fcd34d;
    --state-under-review-border: #965f04;
    --state-returned: #7a2e0e;
    --state-returned-foreground: #fedf89;
    --state-returned-border: #dc6803;
    --state-approved: #074d31;
    --state-approved-foreground: #abefc6;
    --state-approved-border: #079455;
    --state-failed: #881337;
    --state-failed-foreground: #fecdd6;
    --state-failed-border: #be123c;
    --state-closed: #1d1c1a;
    --state-closed-foreground: #a19e9a;
    --state-closed-border: #44423e;
  }

  [dir='rtl'] body {
    font-family: var(--font-arabic);
  }
}
```

Expired renders with `state-failed` tokens plus `border-dashed`. Withdrawn and discarded render with
`state-closed` tokens. Heatmap quartiles: data-1 `#D1FAE5`/`#065F46` (dark `#064E3B`/`#A7F3D0`),
data-2 `#ECFCCB`/`#3F6212` (dark `#365314`/`#D9F99D`), data-3 `#FEF3C7`/`#92400E` (dark
`#78350F`/`#FDE68A`), data-4 `#FECACA`/`#7F1D1D` (dark `#7F1D1D`/`#FECACA`). Categorical series:
crimson-700, blue-600 `#2563EB`, teal-600 `#0D9488`, amber-600 `#D97706`, slate-500 `#64748B`,
violet-600 `#7C3AED`.

## Appendix C: sources

- docs/product/01-PRODUCT-FOUNDATION.md v2.0: product definition, roles, lifecycle, meetings, IA
- docs/product/02-PROJECT-PLAN.md: build plan
- docs/product/03-DESIGN-PLAN.md: D-phase scope and screen production rules
- docs/product/04-SIS-DATA-REQUIREMENTS.md: data contracts behind stale-data and verification surfaces
- The agreed v2 product/UX/UI implementation specification (2026-10-04)

## 3.13 Interactive course map and progress gamification (v3)

The prerequisite map evolves into an **interactive course map** on the student record:

- Nodes are real buttons (44px targets, focus rings); the prerequisite edges render as an SVG
  layer beneath with directional arrowheads.
- Selecting or focusing a node highlights its full prerequisite chain, dims unrelated nodes, and
  opens a detail panel: code, title, status chip, its requirements as selectable chips, and the
  reason a locked course is locked ("Complete CS 201 first").
- Zoom buttons scale with transform only and respect reduced motion; the map stays keyboard
  operable end to end and ships a visually-hidden list alternative.

Gamification stays institutional (PR-01 spirit): a **degree progress ring** (completed share of
the mapped curriculum), and **milestones** computed only from real states (plan submitted,
approved, level cleared, halfway, map mastered). Earned milestones use the success tint with a
lucide medal; pending ones stay muted with the concrete next step. No points, no streaks, no
badges for invented actions, no confetti.

**DS-C-14:** interactive cards may elevate with `shadow-xs` on hover only; rest state stays flat
(material honesty, DP-04).

## 26. v5 design direction: Crimson Modern x Signal Operations (v5.0)

> Status: canonical, merged 2026-10-06 by design-director decision (ChatGPT review loop,
> verdict "MERGE"). **Precedence: where this section conflicts with section 6 or Appendix
> B, this section wins.** Everything they do not conflict with carries over unchanged.
> Rollback: git tag `design-v4-final` restores the pre-merge contract
> (`git checkout design-v4-final -- design.md`); the prototype's Theme v4/v5 toggle is
> the atomic visual-layer flag.

### 26.1 Token layer

Light: canvas `#F6F7F9`, surface `#FFFFFF`, primary crimson `#8B0000` (brand and primary
action only, never decoration, never a data series), body `#1A1D21`, secondary
interactive accent `#5A67A8` (the only accent allowed on interactive elements;
decorative accent use is banned), success `#32845A`, warning `#9A6700`, info `#2563A6`,
destructive `#C62828`, milestone surface cream `#F5F0E8` (earned moments only).

Dark: canvas `#101216`, surface `#191C22`, primary `#B24A53`, success `#34D399`,
warning `#FBBF24`, info `#38BDF8`, destructive `#F87171` (all >= 7:1 as text on
canvas). Dark parity is required for every component and state in section 7, not only
core surfaces.

Chart categorical palette (crimson excluded): `#2563EB`, `#0D9488`, `#D97706`,
`#7C3AED`, `#64748B`, `#DB2777`. Crimson renders only the university-average reference
line and "the answer" emphasis. **DS-C-15 (MUST):** every chart ships palette +
question title + text alternative + reference-line rules as one contract.

### 26.2 Two-mode radius and density

Section 28 replaces the two-mode radius rule: both roles use 14px cards.
Student surfaces keep comfortable density. Staff surfaces keep compact density.
Typography, navigation anatomy, state tokens, and card radius remain shared.
Density and the two signature elements distinguish the roles. **DS-C-16 (MUST):** explicit focus, selected, disabled,
and error tokens exist for both modes, with visible 3:1 focus indicators.

### 26.3 Signature: academic pulse strip (student)

One 3-segment band per page maximum: plan state (fixed minimum width, colored by
state), credit load (proportional to the 12-18 window), degree progress (proportional).
Segments carry persistent text labels and exact values; color never carries the value
alone (DS-C-08 holds). It replaces repeated KPI restatements (say-it-once, R-06).

### 26.4 Signature: decision rail (staff)

Fixed field order: student (name + id) -> state chip -> signal (what changed) ->
urgency (waiting vs threshold) -> ONE primary next action. Approve and Return live in
the review surface, never on the rail (DP-03). States: default, selected, aging,
blocked. Collapses to a two-column grid under 900px; RTL mirrors via logical
properties only; reduced-motion carries no additional animation.

### 26.5 Carried contract lines (from the review loop)

Form validation/error/success anatomy under both themes and RTL (section 18 anatomy
rules hold); dataviz accessibility per DS-C-15; Arabic linguistic and wrapping QA at
production content lengths (DS-L rules hold); a final cross-surface token audit with
zero legacy raw values before implementation closes.

## Changelog

- v1.0 (2026-09-30): initial version. Tokens, states, components, rules, and the skill system.
- v5.0 (2026-10-06): the v5 design direction merged as section 26, superseding section 6
  where they conflict. Crimson Modern x Signal Operations hybrid: two-mode radius,
  academic pulse strip, decision rail, AA-corrected accent and warning, formal chart
  palette, cream milestone surface, dark pairs. Rollback: tag `design-v4-final`.
- v1.1 (2026-10-01): correction pass from wayfinder ticket flags. Lifecycle reset to 8 settled states
  plus discarded; SubmitSuggestionCard; dean rail reduced; queue aging via server flag.
- v3.0 (2026-10-05): interactive course map with chain highlighting and a detail panel,
  degree progress ring, milestone system, and the hover-elevation amendment (DS-C-14).
- v2.0 (2026-10-04): the agreed product/UX/UI implementation contract. 25-section structure. Role IA,
  mobile bottom navigation, command palette, breadcrumbs and page headers, unified meeting and
  availability UX, per-role UX sections, Admin operational scope, VP dean-identity rule (PR-15),
  categorized notifications, credits on plan surfaces, Advisor naming. Product name is Advisor.

## 27. Frontend review refinement (2026-10-09)

The user keeps crimson and replaces the dated layout. These rules take precedence over conflicting navigation placement rules.

- DS-N-07: The sidebar notification bell supplies the persistent notification entry. Section 28 defines its placement. Notification routes remain accessible through direct links.
- DS-N-08: The sidebar shows product identity and role context. Section 28 replaces the topbar rule. Expanded labels wrap when necessary.
- DS-Q-02: Overview interactions open actual workflows. The admin overview provides operation search and direct links. Student plan summaries show up to three planned courses with codes, available titles, and credits.
- DS-Q-03: Student overview notifications open their related workflow and mark the notification as read. The next meeting excludes past slots and selects the earliest future slot.
- DS-C-17: Shared cards use the common radius in section 28. Dialog and drawer close controls have 44px targets. Reduced motion disables animations, transitions, and smooth scroll.
- DS-D-01: A course count is not degree credit progress. The student overview omits this derived progress measure and displays the SIS CGPA instead.

- DS-C-18: Primary action fills and primary text use separate semantic tokens. Primary text uses a lighter crimson tone in dark mode for contrast.
- DS-Q-04: The VP overview exposes real faculty comparisons through the existing interactive grid. Faculty links open the corresponding aggregate drill-down.

- DS-C-19: Light success emphasis uses HSL 163 94% 20%. This maintains text contrast on earned milestone surfaces.
- DS-C-20: Unread notification rows use a 1px crimson border on the logical start edge. The unread dot includes a screen reader label.
- DS-C-21: Staff, caseload, meeting, and dean tabs include matching content panels. Each tab uses the same value as its panel.
- DS-C-22: Governance trend figures and chart containers use a zero minimum width. Charts fit their available width and retain the accessible data table.
- DS-C-23: Tinted warning surfaces use warning text. Light warning uses HSL 40 100% 27% for text contrast. Warning foreground is reserved for solid warning fills.
- DS-C-24: Markdown uses inverted typography in dark mode. The dark utility variant follows the root dark class. Active conversation backgrounds use semantic primary tints.
- DS-C-25: Table scroll containers and chat transcripts accept keyboard focus when their content overflows. Resize and content changes update focus eligibility. Focused containers show the shared focus ring.

## 28. Reference-led workspace contract (2026-10-09)

This section records the implemented visual system and the user decisions in `PRODUCT.md`.
Product authority remains in `docs/product/`. Domain permissions and academic rules remain unchanged.
This section takes precedence over conflicting placement, shape, and chat entry rules throughout this document.
It supersedes topbars, mobile bottom navigation, the mobile More sheet, and the staff 6px card rule.
Sections 4, 5, 8, 20, 24, 25, Appendix A, and section 26 retain their other applicable rules.
Rule IDs remain stable. The definitions below replace the earlier definitions of DS-N-01 through DS-N-03.
The implementation uses `design.md` and `DESIGN.md` as the same filesystem file.

### 28.1 Overview

Advisor puts academic tasks inside one sidebar workspace.
The user retains crimson and selects rounded surfaces, a neutral canvas, and photographic authentication.
The workspace separates global controls from the page breadcrumb, title, and academic workflow.
The references guide composition and interaction. They do not change role permissions or academic functions.

| Reference           | Applied pattern                                                        |
| ------------------- | ---------------------------------------------------------------------- |
| HRPlatform 25339477 | Authentication form beside a large photograph                          |
| Untitled            | Sidebar identity, navigation, controls, and account area               |
| Cosmos              | Grouped search with prominent input and icon results                   |
| Uniswap             | Compact breadcrumb trail with the current page                         |
| Brainwave           | Notification date groups, All/Unread filters, and quiet row separation |

### 28.2 Colors

`src/index.css` owns the crimson ramp and semantic light/dark pairs.
Components use semantic tokens for surfaces, text, primary actions, primary text, borders, focus, and status.
Primary text and primary fills use separate tokens, as required by DS-C-18.
Crimson marks primary actions, active navigation, unread notifications, and the selected course path.
Status icons and labels explain the state independently of color.
Chart palette rules in DS-C-15 remain applicable.
Toasts combine a status tint, matching border, status icon, and ordinary readable text.
Do not copy reference colors over the semantic theme pairs.

### 28.3 Typography

English uses Inter Variable. Arabic uses Cairo Variable with the existing system fallbacks.
Page headings use clear weight and size differences. Secondary text uses the semantic muted foreground.
Numbers retain tabular alignment where comparison requires it.
Course codes retain bidirectional isolation inside Arabic text.
Arabic layout uses logical placement and readable RTL text.

### 28.4 Layout

The sidebar replaces the topbar and bottom navigation at every viewport width.
The page retains its breadcrumb, title, description, and workflow actions.
The sidebar owns product identity, role context, search, navigation, notifications, language, theme, and the account menu.
Role routes continue to control navigation visibility. Secondary groups remain inside the sidebar.

| Layout value                           | Implemented size |
| -------------------------------------- | ---------------- |
| Expanded sidebar                       | 260px            |
| Collapsed sidebar                      | 64px             |
| Desktop edge gap                       | 12px             |
| Mobile edge gap                        | 6px              |
| Desktop content reservation, expanded  | 284px            |
| Desktop content reservation, collapsed | 88px             |
| Mobile content reservation             | 76px             |
| Mobile breakpoint                      | Below 768px      |
| Authentication window maximum width    | 1120px           |

- DS-N-01: One role route table drives sidebar navigation at every viewport width. The shell renders no topbar or bottom navigation.
- DS-N-02: Sidebar links expose accessible labels and the active page. Expanded links show labels. Collapsed links show tooltips on hover and focus.
- DS-N-03: Mobile keeps the narrow rail. Expansion opens the shared modal Drawer with a focus trap, scroll lock, and inert main content.

Escape closes the mobile sidebar. Closure returns focus to its toggle. Route selection also closes the modal sidebar.
Desktop collapse persists in local storage. Collapsed tooltips use a portal to avoid sidebar clipping.
Authentication uses two equal columns above the mobile breakpoint.
Below that breakpoint, authentication hides the photograph and shows one form column.
Student and staff density remain distinct. Shared card corners remain identical.
Chat uses a centered conversation canvas. The History action opens the shared modal Drawer at every width.
Section 29 defines the current Home and AI Advisor surfaces.

### 28.5 Elevation & Depth

The workspace uses a neutral canvas, white or dark surfaces, thin borders, and small shadows.
The floating sidebar has a subtle shadow. Authentication uses a broad, low-opacity shadow.
Search and mobile navigation use modal overlays. Tooltips sit outside the sidebar through a portal.
The selected course node uses a crimson ring and glow.
Motion leaves node positions stable. Active prerequisite paths show flow with a 1.2-second cycle.
Reduced motion removes path animation, movement transitions, and smooth scroll.
Reduced motion disables all transitions under DS-C-17.

### 28.6 Shapes

Shared cards use 14px corners for students and staff. This replaces section 26.2's staff 6px corners.
Shared buttons and inputs use 12px corners. Authentication fields use their observed 0.85rem corners.
The sidebar uses 24px corners. The desktop authentication window uses 32px corners and clips its inset photograph separately.
The mobile authentication window uses 24px corners.
Chat panels use 24px corners. Notifications and the composer use rounded containers with clear boundaries.
Touch controls retain 44px minimum targets. Fine-pointer desktop controls may use the existing compact sizes.

### 28.7 Components

#### Authentication

`src/components/layouts/auth-layout.tsx` pairs the form with `/advisor-study.png`.
The form panel contains identity, heading, help text, fields, and language/theme controls.
The photograph uses a lower gradient for caption contrast.
Authentication retains existing validation, redirects, and account workflows.

#### Navigation, breadcrumb, and search

`src/components/layouts/app-shell.tsx` defines the shared sidebar and mobile modal behavior.
Active links use a crimson tint, stronger text, and a filled icon treatment.
`src/components/ui/breadcrumb/breadcrumb.tsx` includes the current page with `aria-current="page"`.
Long trails collapse middle ancestors behind an accessible expansion control. Separators remain decorative and mirror in RTL.
`src/components/ui/command-palette/command-palette.tsx` supplies grouped page and action results.
Sidebar search and Cmd+K/Ctrl+K open the command palette. Arrow keys navigate, Enter selects, and Escape closes.
Search filters the supplied role entries. Record search requires an existing endpoint; this redesign does not establish one.

#### Notifications and toasts

`src/features/notifications/components/notification-center.tsx` groups notifications by their localized date.
All/Unread controls filter the list. Mark all read retains its pending, disabled, and error states.
`notification-item.tsx` retains the unread border, dot, and screen reader label from DS-C-20.
Rows show a category icon, title, body, and timestamp. Selection opens the related workflow and marks unread items as read.
`src/components/ui/notifications/notification.tsx` defines tinted info, success, warning, and error toasts.
Errors remain until dismissal. Other toasts dismiss after five seconds and pause during hover or focus.
Warning and error toasts use alerts. Info and success toasts use status announcements.

#### Course map

`src/features/profile/components/course-map.tsx` lays out stable course nodes and prerequisite paths on a dotted canvas.
Hover and focus preview the prerequisite chain. A click pins selection. The detail panel explains requirements and unlocked courses.
Nodes retain readable text without opacity dimming. Completed, planned, eligible, and locked states use distinct icons and labels.
Zoom supports 80%, 100%, and 125%, with a reset control.
RTL mirrors node and path geometry and restores RTL text inside each node.
The accessible text list retains course states and prerequisites.

#### AI conversation

`src/features/ai-chat/components/chat-document.tsx` provides a writing canvas, prompt starter rows, and a conversation history Drawer.
New conversations use the internal `maintain` goal. The entry flow has no blocking goal dialog, model controls, or voice recording.
Prompt starter rows create a conversation and place editable text in the composer. They do not send a message automatically.
`src/features/ai-chat/components/composer.tsx` sends on Enter and adds a new line on Shift+Enter.
Input method composition prevents Enter from sending. Failed sends restore the draft. Quota and reply states retain their controls.
Academic tool results and the explicit submission confirmation flow remain governed by section 14 and product rules.

#### Data states

Loading, empty, permission, retry, and error states remain part of each workflow.
`src/lib/react-query.ts` allows one read retry after 500ms for ApiError network failures, 408, 429, or server errors.
Authorization errors receive no automatic retry. This read policy does not change mutation behavior.

### 28.8 Do's and Don'ts

- Do use the shared sidebar for global controls at every width.
- Do preserve English, Arabic, RTL, light/dark themes, visible focus, and reduced motion.
- Do use actual academic milestones and the existing status system.
- Do keep course nodes stable and provide focus or touch access to previews.
- Do retain existing plan, meeting, account, and permission workflows.
- Do not restore topbars, bottom navigation, or the staff 6px card mode.
- Do not introduce points, streaks, leaderboards, invented rewards, or confetti.
- Do not add model controls, voice recording, or a blocking chat goal screen.
- Do not infer production API validation or completed quality gates from this source record.

`index.html` records the visual contract, base seed `0f139a13`, and the FINISH requirement.
This section documents source evidence. The finish review and validation report provide their own results.

## 29. Home and AI Advisor focus surfaces (2026-10-09)

This section records surface candidate 6, seed `1cc81333`, from `index.html` and the implemented source.
The user confirmed next action and plan status as the Home priority.
These surfaces retain section 28's sidebar, tokens, typography, permissions, and academic workflows.
This section replaces section 28's earlier AI page composition.
The corrections below record the current source behavior on 2026-10-10.

### 29.1 Home

`src/app/routes/app/dashboard.tsx` places the plan before the AI invitation and unread updates.
`src/features/plan/components/plan-card.tsx` combines an E-JUST Red plan stage with a neutral course ledger.
The stage shows the term, actual status, status explanation, course count, and applicable next action.
Draft and discarded plans link to the builder. Submitted, under-review, and returned plans link to the plan.
Other statuses retain their explanations without an additional stage action.
The ledger shows up to three courses with isolated codes, titles, and credits.
A remaining-course count and plan link provide access to the complete plan.

The support column groups the academic record, next meeting, and advisor.
At 80rem and above, this column stays visible through sticky positioning and scrolls independently when necessary.
Advisor details use icons beside their existing labels.
The record shows CGPA or its unavailable state and a record link.
The meeting section prioritizes the earliest future confirmed meeting, then an awaiting-response request, then the empty state.
The AI invitation opens the existing chat route. Its disclaimer retains the advisor's academic authority.
Updates show up to two unread notifications. Selection marks the notification read before navigation.

### 29.2 AI Advisor

`src/features/ai-chat/components/chat-document.tsx` centers the entry surface within a maximum width of 768px.
The visible page header is absent. `ContentLayout` retains the document title and an accessible, visually hidden h1.
A centered greeting uses the student's first name when available. A translated generic greeting covers the unavailable-name state.
The E-JUST PNG logo accompanies the greeting above the wide, rounded draft composer.
Three simple starter rows follow the composer.
The entry omits the draft-review hint and constitution disclaimer. Academic authority and confirmation rules remain applicable.
The shared circular Send control creates a `maintain` conversation and transfers the trimmed message through route state.
The active transcript dispatches that first message once, then clears the route state.
Starter rows only prefill the editable draft and focus the composer.
An empty draft disables Send. Pending creation disables Send and starter selection.
The student can edit the next draft during creation or a reply.
History and New conversation sit together at the AI page's top corner opposite the sidebar.
This placement replaces the earlier sidebar-only constraint. Both controls use icons with accessible names and hover titles at every width.
New conversation returns to the welcome surface from the page action or history Drawer.
This action clears the entry draft without a server conversation request.
Creation failures show an error banner and retain the entry draft.

History opens in the shared modal Drawer at every viewport width.
The Drawer includes its title, description, close control, new-conversation action, and existing conversation list.
Selection closes the Drawer. The active conversation exposes its current state to assistive technology.
The list retains loading skeletons, empty guidance, and an error retry action.

The active transcript uses a maximum width of 768px and a separate scroll region.
The AI workspace fills 100dvh. The transcript takes the available height within its flex layout.
The shared composer stays at the bottom as a fixed-size flex child.
The transcript retains Jump to latest when the student scrolls away.
Section 28's Enter, Shift+Enter, input composition, and failed-draft restoration rules remain applicable.
Streaming retains typing feedback, stop controls, partial failures, tool events, and retry controls where permitted.
The transcript suppresses persisted assistant copies during an active stream. A polite announcement reports reply completion once.
The next draft stays editable during a reply. Stop replaces Send until the reply ends.
Failed sends restore the sent text only when the current draft has no text.
Completed messages expose a 44px Copy control with success and failure feedback. Assistant replies show their timestamp beside Copy.
Quota exhaustion disables active conversation input and preserves the builder link.
Submission suggestions retain explicit confirmation under section 14. AI never silently submits a plan.
Missing conversations retain recovery guidance. Other transcript failures retain retry controls.

### 29.3 Responsive behavior and states

At 80rem and above, Home uses a flexible main column and a 290px support column.
Below 80rem, the support area follows the main content in three columns.
Below 48rem, support sections stack with dividers.
Below 48rem, the AI greeting stacks its mark above the text. The shared composer retains its circular action.
Home plan and support surfaces use 16px corners. The AI invitation retains 14px corners.
Section 31 defines the current E-JUST light and dark color pairs.
English and Arabic translations cover the new entry and Home text.
Logical spacing, RTL arrows, the mirrored Drawer, and isolated course codes retain Arabic support.
Visible focus, labeled text areas, pending states, and shared modal behavior retain keyboard access.
Reduced motion removes the composer border transition, starter background transitions, and message entrance animation.
Home retains the missing-advisor warning, plan skeleton, missing-plan creation action, record fallback, and independent error retry states.
Meeting and notification requests retain their loading, error, and empty states.
This section records source behavior. It does not establish test results, browser validation, or production API validation.

## 30. Student information placement and history, 2026-10-09

Home prioritizes the current plan status and its next action. My Plan owns plan editing, feedback, and submission. AI Advisor owns guidance and conversation history. My Advisor owns the advisor profile and meeting actions. The sidebar notification center owns full notification management.

Academic Record owns student ID, faculty, curriculum year, SIS freshness, CGPA, remaining requirements, current enrollments, course attempts, and prerequisites. Account owns contact details and the sign-out action. Academic Record does not request the current plan to calculate milestone rewards.

Course history uses a term timeline, course search, and a term filter. Repeated courses remain separate attempts. The interface displays missing credits and levels as not reported. It uses the backend term code when available. Legacy history can use year and semester. Enrollments display course code and title. Groups and sections are absent from the current backend response.

The backend audit used origin/main at 0bcfa22. The pull fetched that revision but could not fast-forward the local branch. No local backend changes were removed. School, department, and enrollment status exist in the SIS identity model but lack student response fields. The student API lacks historical plan listing, earned-credit totals, and semester GPA. The frontend does not invent these values. Beads acad-zxc tracks the missing contracts.

The separate interactive palette prototypes propose E-JUST red and graphite, Teal and ink, Cobalt and slate, and Plum and graphite. Each proposal includes light and dark tokens, Home, AI, and record previews. E-JUST red and graphite follows the official site red, gray, white, and black family. Accessible action shades are proposed UI adaptations. No proposal changes the application palette before selection.

## 31. E-JUST palette and AI composition, 2026-10-09

### 31.1 Overview and precedence

The current direction uses the quiet Operate E-JUST system.
The user selected the complete token table from `E-JUST Color System.html` and the supplied Gemini, ChatGPT, and Claude composition references.
`src/index.css` implements the palette. `index.html` records the opening visual contract.
This section replaces conflicting crimson palette values in earlier sections, including sections 3, 26, 28, and 29.
The palette proposals in section 30 record earlier exploration. The selected E-JUST palette now governs the application.
Section 29.2 defines the current AI composition. Section 28 continues to govern other layouts unless a later section explicitly replaces them.
Product rules, permissions, academic authority, and plan workflows retain their existing contracts.
Legacy `crimson` scale names alias E-JUST Red for compatibility. Their names do not authorize the earlier palette.

### 31.2 Colors

Warm Stone supplies the canvas, surfaces, text, and borders.
E-JUST Red supplies primary actions. Nile Blue supplies secondary actions, links, and focus.
Sand Gold supplies highlights. Alexandria Teal remains available through its supplied scale and data roles.
The following table records the implemented `--ejust-*` role tokens.

| Role                | Light       | Dark        |
| ------------------- | ----------- | ----------- |
| Background          | `#F8F8F7`   | `#0F0E0D`   |
| Surface             | `#FFFFFF`   | `#1D1C1A`   |
| Secondary surface   | `#F0EFEE`   | `#2D2B28`   |
| Border              | `#E1E0DE`   | `#44423E`   |
| Strong border       | `#C8C6C3`   | `#5A5752`   |
| Text                | `#1D1C1A`   | `#F0EFEE`   |
| Muted text          | `#5A5752`   | `#A19E9A`   |
| Subtle text         | `#78756F`   | `#78756F`   |
| Primary             | `#CC1820`   | `#F8636A`   |
| Primary hover       | `#A8131B`   | `#FF9FA3`   |
| Primary active      | `#8A141B`   | `#FFC8CA`   |
| Primary subtle      | `#FFF1F1`   | `#3F0709`   |
| Text on primary     | `#FFFFFF`   | `#0F0E0D`   |
| Brand               | `#EA232B`   | `#EA232B`   |
| Secondary           | `#1D3AA3`   | `#6089F0`   |
| Secondary subtle    | `#EEF4FF`   | `#111B3D`   |
| Highlight           | `#E0A100`   | `#F5BC2B`   |
| Focus ring          | `#3A63E3`   | `#93B3F7`   |
| Link                | `#2549C8`   | `#93B3F7`   |
| Disabled background | `#F0EFEE`   | `#2D2B28`   |
| Disabled text       | `#A19E9A`   | `#5A5752`   |
| Selection           | `#FFC8CA`   | `#721719`   |
| Skeleton            | `#E1E0DE`   | `#2D2B28`   |
| Overlay             | `#0F0E0D8C` | `#000000B3` |

Shared semantic tokens map these roles into existing components. Components use role tokens rather than raw scale values.
The supplied subtle-text and disabled-text values remain distinct from normal body text.
The implementation uses muted text for AI placeholders and disclaimers.
Rose danger uses `#9F1239` with white text in light mode.
Dark mode uses `#FECDD6` with `#0F0E0D` text. These supplied shades keep error text readable and separate from brand red.
Success uses `#067647` in light mode and `#12B76A` in dark mode.
Warning uses `#B54708` in light mode and `#F79009` in dark mode.
Info uses `#026AA2` in light mode and `#0BA5EC` in dark mode.
Status labels and borders continue to express plan states alongside their colors.

The eight chart colors retain this order in both themes:

| Series | Color     |
| ------ | --------- |
| 1      | `#2F5BEA` |
| 2      | `#E0A100` |
| 3      | `#0E9F8E` |
| 4      | `#EA232B` |
| 5      | `#7C3AED` |
| 6      | `#F26B21` |
| 7      | `#0BA5EC` |
| 8      | `#6F798E` |

### 31.3 Typography

Inter Variable supplies Latin text. Cairo Variable supplies Arabic text through the RTL body rule.
Both stacks retain system sans-serif fallbacks. Code retains the existing monospace stack.
The AI greeting uses a responsive size from 24px to 36px, weight 450, line height 1.35, and letter spacing of -0.03em.
The greeting centers and balances its text. Its E-JUST PNG logo measures 48px.
Draft text uses 16px with line height 1.5. Starter rows use 14px.
The AI entry has no constitution disclaimer. The Home invitation retains its academic authority text.

### 31.4 Layout

The AI entry centers within the available workspace. Its content width reaches 768px and contracts with the viewport.
The greeting leaves 40px before the draft composer on wider screens.
Starter rows occupy a centered column of at most 540px, with 24px above the group.
The active transcript shares the 768px content limit.
The AI workspace fills 100dvh and prevents outer page scrolling.
The transcript scrolls independently. The composer occupies the bottom of the flex layout.
History and New conversation occupy adjacent page actions at the top corner opposite the sidebar.
The existing sidebar retains its account, notification, and global controls.
The account control opens a contextual dropdown above the sidebar footer.
The expanded control shows the avatar, account name, and chevron.
The notification bell sits beside this control in the expanded row.
The collapsed 64px rail stacks the account control and notification bell vertically.
Students see Account in the dropdown. All roles see Appearance, Language, and Sign out.
Appearance offers Light, Dark, and System radio choices. Language offers English and Arabic radio choices.
The menu shows the current appearance and language. Menu choices retain 44px minimum targets.
Sign out remains disabled during its request.
The collapsed logo reveals the expand icon on hover or keyboard focus. Activation expands the sidebar.
Collapsed search uses a compact 44px icon target.
Below 48rem, the greeting stacks vertically and leaves 24px before the composer.
The entry uses 16px vertical padding. The main workspace uses 12px vertical padding on these smaller screens.
Logical spacing, mirrored arrows, and the existing RTL Drawer behavior continue to govern Arabic layouts.

### 31.5 Elevation and shapes

The AI draft uses a flat surface and a thin border. Focus adds the Nile Blue border and a soft outline.
The sidebar retains its low-opacity shadow and 24px corners.
Both AI surfaces share one composer with 28px corners. The entry action and active send or stop controls use circular shapes.
Starter rows use 12px corners and a neutral hover fill.
Home retains its 16px plan surfaces and 14px AI invitation under section 29.

### 31.6 Components and states

The shared textarea disables manual resizing and adjusts its height automatically to 160px.
Send measures 44px and shows an upward arrow without a spinner.
Stop uses the same circular 44px target. Each starter row has a minimum height of 48px.
Page conversation controls retain accessible names when labels disappear.
The active composer replaces Send with Stop during a reply.
The textarea remains editable during a reply. Quota exhaustion disables active conversation input.
Send clears the submitted draft. A failed send restores it only when no newer draft contains text.
Completed messages expose Copy with a 44px target and success or failure feedback.
Primary buttons use the primary, hover, active, and text-on-primary roles.
Shared link controls use the link role. Overlays and loading skeletons use their supplied role tokens.
Reduced motion removes AI draft and starter transitions. The existing global reduced-motion contract continues to apply.
The entry draft, pending creation, failures, history states, streaming, and submission confirmation follow section 29.2.

The shared sidebar, AI greeting, and favicon use the actual E-JUST PNG logo.
Dark mode brightens the dark logo strokes and retains a saturated red center.
Development query tools require development mode and `VITE_ENABLE_DEVTOOLS=true`.
The command palette uses the selected color roles for its surfaces, accents, and focus states.

The course map supports hand dragging and arrow-key movement when its canvas has focus.
Course hover and focus details use an optional backend description when available.
Without a description, the interface explains the actual course state and prerequisite context.

My Plan exposes Edit courses for drafts. The builder searches available courses by code and title.
The picker exposes loading and retry states. It excludes courses currently in the draft.
All draft mutations disable other draft actions until the request finishes.
Credit totals come from the plan response. The mock response sums its saved course credits.
Server validation receives focus after rendering and links to affected course lines.
Discard failures remain visible inside the confirmation dialog.
Page headings omit matching breadcrumb leaves. Remaining ancestor links stay interactive.
Course-map legend chips pair state icons with semantic colors.
Shared retry controls show a rotating reload icon and respect reduced motion.
The route error boundary shows a static recovery message. Retry reloads the page.
These controls retain authorization checks and explicit confirmation for consequential actions.

The backend pull remains blocked by divergent branches.
Fetched `origin/main` exposes catalog descriptions and annual mean and mode grades through an AI tool.
The student HTTP response omits these fields. This interface does not invent them.
The audit does not verify SIS registration writes or establish a new registration contract.

### 31.7 Application rules

Use the selected role pairs for light and dark surfaces.
Keep the AI greeting, composer, and starter rows in their established order.
Keep History and New conversation adjacent in the AI page actions.
Preserve explicit message sending and explicit plan submission confirmation.
Preserve factual progress and existing academic permissions.
This section records implemented source behavior. Validation reports establish test and browser results separately.
