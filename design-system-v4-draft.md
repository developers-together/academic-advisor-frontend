# Advisor design system v4 — draft for approval

> Status: DRAFT, 2026-10-05. This document is the proposal catalog from the
> full-production scan of every role and page. Nothing here is implemented.
> Every item needs explicit approval, and every approved change is prototyped
> before it lands. Canonical design truth stays `design.md` (v2 + v3) until
> approved items are merged into a v4 contract.
> Evidence: 42 full-page captures of the running app (all five roles, desktop
> 1440 and mobile 390) in `/tmp/advisor-scan`, index in `manifest.json`.

## How this document works

| Part | Contents | Needs approval? |
|---|---|---|
| 1 | Current system, as built | No (record only) |
| 2 | Confirmed defects (D-xx) | Approve the fix batch |
| 3 | Proposed UI changes (C-xx) | Yes, per item |
| 4 | Proposed new workflows (W-xx) | Yes, per item |
| 5 | Design-system additions for production | Yes, per section |
| 6 | Production gap inventory | Yes, as scope |
| 7 | Prototype sequence | Yes, as order |
| 8 | Element redesign and redundancy rules (R-xx) | Yes, per item |

Approval rule you set: nothing implements until you approve it, and every
change is prototyped first. Each C/W item names the prototype that will carry
it. The tracker map is beads `acad-b8p`; the approval ticket is `acad-b8p.1`.

---

## Part 1 — Current design system, as built

The contract (`design.md` v2.0 plus the v3 course-map amendment) is implemented
and healthy at its core:

- Tokens: full semantic two-layer system, light and dark, crimson brand, plan-state palette. No raw hex found in components except one native checkbox (D-29).
- Typography: Inter + Cairo, self-hosted, `text-2xs` reserved for staff tables, tabular-nums on staff tables and charts. The staged pass fixed inputs to 16px on touch, 44px touch targets, curly apostrophes, and the last underline emphasis.
- Components: PageHeader, breadcrumbs, command palette, bottom nav, More sheet, StatusChip family, EmptyState, Banner, ConfirmDialog with verb-specific confirms, course map, progress ring, milestones.
- States: skeletons, empty states, error states with retry, permission panels, stale-SIS banner, window-closed banner.
- i18n: nine namespaces, exact EN/AR key parity enforced by test, RTL structurally correct in dialog and drawer.
- Roles: five-role IA, permission-aware routing, role-scoped nav.

The defects below are what the scan found on top of this baseline.

---

## Part 2 — Confirmed defects (D-xx)

Contract violations and bugs. Fixes are directionally settled; they still go
through prototype and your approval as one batch per theme.

### Student

- **D-01 Credits are absent from plan surfaces.** No per-line credits, no term
  total, no 12-18 load window anywhere on My Plan or Builder. Contract 8.4 and
  16 require them (PR-12's UX surface).
- **D-02 My Advisor has no Request meeting action.** J3's entry point does not
  exist on the page that owns it; a student with no meeting sees a dead end.
- **D-03 Returned-plan story is broken.** Home shows "Draft / Not submitted
  yet" while notifications report the plan was returned with feedback. The
  return reason never renders on plan surfaces; comments show "No comments
  yet" against that same notification. J2 is unverifiable in the UI.
- **D-04 Builder defers all feedback to the gate.** No prerequisite or
  credit-impact hint per line ("CS402 requires CS301 first" never appears), no
  save/saving/saved indicator, no breadcrumb on the sub-route.
- **D-05 Record gaps.** Credits earned never shown (only remaining), no SIS
  as-of stamp (PR-16), course map has no legend (color-only statuses, DS-C-08)
  and clips nodes at 390px with no pan hint, pending milestones say only "Not
  yet" instead of the concrete next step.
- **D-06 AI Advisor entry is empty.** No grounded starters (section 14
  requires six), no visible composer on landing, conversation items have no
  selected state, the scenario chip is unexplained jargon.
- **D-07 Student desktop nav deviates.** Flat eight-item sidebar with an
  uncontracted "Rules" area; DS-IA-02 wants secondary areas in a More group.
  (Mobile shows four slots; the fifth, More, is overlapped by a dev-only
  React Query devtools button in development builds. The devtools button
  should move or start closed so it stops masquerading as a nav slot.)
- **D-08 Notifications promise a phantom.** "Follow the checklist to register
  in SIS" references a checklist that exists nowhere (DS-W-11). No
  notification item carries a visible deep link or inline action (17).

### Advisor

- **D-09 Queue is a table, not a decision workspace.** Rows carry no visible
  review affordance or action; no sort control (ticket `acad-8so`); no summary
  line ("1 aging past threshold"); rows under-triage (no last-update, no
  reason).
- **D-10 Caseload misses contract filters.** Only three tabs; no review
  status, meeting status, or last-interaction filters (section 10); no column
  sort; "Meeting not met" chip renders meeting color on a student surface
  (DS-C-10).
- **D-11 Meetings breaks DP-03 and misses actions.** "Invite student" and
  "Confirm time" are both solid primaries; the Delay action from section 15 is
  missing; no Today strip; proposed slots render as plain text with no pick
  affordance.
- **D-12 Office Hours lacks the availability contract.** No duration, buffer,
  conflict feedback, or slot-generation preview (section 15); no dirty-state
  guard or saving/saved feedback; no booked-slot context.
- **D-13 Profile is a one-field page.** Merge candidate with Office Hours
  (DP-02); no saved feedback.
- **D-14 Advisor mobile has no table transformation.** Queue and caseload
  render squeezed desktop tables at 390px; whole-table squeeze is banned
  (section 20).

### Governance (dean, VP)

- **D-15 No term switcher and no data-freshness stamp anywhere.** Every page
  says "this term" while DS-W-11 and PR-16 require honest currency.
- **D-16 Role context is wrong.** Sidebar and topbar say "Advisor" for dean
  and VP users.
- **D-17 Bottleneck can contradict its data.** The banner names the lowest
  completion while two sub-unit cards show the same 62 percent (tie unresolved
  by the computation); the banner does not link to the flagged unit.
- **D-18 Dean Analytics under-delivers D3.** One metric, no department
  comparison, no filters; KPI endpoint (66 percent) can disagree with the
  Overview KPI (62 percent) for the live term; no text alternative.
- **D-19 VP drill-down does not drill.** The department level never appears;
  the page duplicates Faculties; the breadcrumb is malformed; nothing in the
  nav maps to it.
- **D-20 VP Trends misses V3.** Completion only (decision time and aging
  missing), seven overlapping splines with no isolation or reference line, no
  text alternative, no partial-term marker.
- **D-21 Governance notifications carry student copy.** "Plan and visit
  updates" is not governance content; there is no alert taxonomy for deans or
  the VP.
- **D-22 Dean advisors table lacks precision.** "Median" names no unit, aging
  has no unit, no department grouping, no quartile emphasis (Appendix B
  defines heatmaps the table never uses), KPI counts ship unitless ("29
  aging").

### Admin

- **D-23 Operations landing does not exist.** `/admin/operations` renders the
  not-found page (contract 4.5 makes it a section landing). The not-found page
  itself drops the shell, so a lost admin has no sidebar and a
  crimson-styled exit.
- **D-24 Users IA is tangled.** Nav "Users" redirects to `/admin/students`
  ("Accounts"); the legacy route renders the same page with the wrong nav item
  highlighted; the account panel (suspend, binding repair, reset, delete) only
  opens by clicking the name, with no row affordance signaling it.
- **D-25 Assignments cannot answer "who advises whom".** The ADVISOR column
  shows an "Assigned" chip, not a name; no filters, sort, pagination, or row
  actions; search truncates its own placeholder.
- **D-26 Courses, Programs, and Staff have no search, filter, sort, or
  pagination** (section 18 requires them on lists); "Add" buttons sit on a
  separate row on some pages and the title row on others; column-header casing
  differs between pages.
- **D-27 Destructive actions are under-protected.** Courses Delete is a bare
  text link; Staff Delete is a solid button repeated per row with no
  self-delete guard; Programs has no Delete at all. PR-17 impact dialogs are
  missing on all three.
- **D-28 Rules page scope mismatch.** The contract's M5 prerequisite and
  eligibility rules editor does not exist; the page holds AI quotation texts
  plus the queue-aging threshold with an unlabeled input.
- **D-29 Registration Windows cannot grow.** No "Add window" action; SIS
  mirror shows no as-of stamp; "Dates mirror the SIS" copy is duplicated. (The
  deactivate confirm and error states from the staged pass cover the PR-17
  half.)
- **D-30 AI Configuration has a raw native checkbox** (blue, DS-C-01) and two
  kill switches whose precedence is undocumented; Save gives no dirty or
  saved feedback.
- **D-31 Admin Overview card anatomy is inconsistent.** Three of seven cards
  carry no count; the contract's pending-bindings count is absent; "Registration
  Windo…" truncates in the rail.
- **D-32 Admin Notifications is an inbox where the contract wants M7
  configuration**, with student-shaped empty copy.

### Auth and cross-cutting

- **D-33 Auth pages drift.** Forgot password is a dead end (no back link),
  "University email" vs "Email" label drift, eye toggle only on login, three
  different card positions.
- **D-34 Naming drift across surfaces.** "Student Explorer" vs "Students";
  "Users" vs "Accounts"; "Rules" vs "University Rules"; dean title fixed to
  "Faculty Overview" in the staged pass. DS-W-12 requires one name per thing.
- **D-35 Container widths are inconsistent.** Empty states render half-width
  on some pages and full-width on others; the registration-windows table stops
  short of the content column.

---

## Part 3 — Proposed UI changes (C-xx, need your approval)

Each item lists the prototype that will carry it before implementation.

- **C-01 Plan health strip** (fixes D-01, D-03, D-04). Per-line credits, term
  total against the 12-18 window, a Validate action that renders server
  results grouped by line before the submit gate, save/saving/saved state, and
  a Returned hero: "Your plan was returned, read the feedback", with the
  reason above comments and Seen, Edit, Resubmit in sequence.
  Pages: Home, My Plan, Builder. Prototype: clickable HTML of the three plan
  states (draft, returned, approved) at 1440 and 390.
- **C-02 Queue decision workspace** (D-09). Hover and focus row actions
  (Open review, Approve, Return), a sort select (aging first, newest, last
  updated), a summary line, and an optional keyboard triage mode
  (J/K move, Enter open, A approve, R return). Pages: Queue.
  Prototype: one interactive HTML table with the three interaction states.
- **C-03 Meetings day model** (D-11). Today strip first, single primary
  action per view, slot-picker chips on awaiting-response cards, Delay action,
  booked-slot context. Pages: Meetings.
  Prototype: HTML of the three meeting card states.
- **C-04 My Advisor completion** (D-02). Request meeting as the page primary,
  meeting location and duration on confirmed cards, past-meetings list, full
  AdvisorCard per 8.4. Pages: My Advisor. Prototype: HTML.
- **C-05 Governance term and truth layer** (D-15, D-16, D-17, D-22). Global
  term switcher, "Data as of" stamps, KPI deltas versus prior term, unit
  labels on counts, role-correct shell context, bottleneck banner linking
  through to the flagged unit with tie handling (name both, or fall back to
  aging). Pages: all dean and VP surfaces. Prototype: HTML of Overview with
  the term control.
- **C-06 Dean analytics completion** (D-18). Three metrics, department
  comparison, term range, text alternative, straight lines. Pages: Analytics.
  Prototype: chart HTML with the metric switcher.
- **C-07 VP scorecard v2** (D-19, D-20). Delta column and sparkline per
  faculty, row click drills to departments inline (replacing the drilldown
  page), Trends gains a metric switcher, click-to-isolate lines, university
  reference line, partial-term dash. Pages: Faculties, Trends.
  Prototype: HTML scorecard with one expanded row.
- **C-08 Admin table standard** (D-25, D-26, D-27, D-31). One PageHeader
  pattern (primary action on the title row), one table specification (header
  casing, quiet row-action menu, destructive actions only inside impact
  dialogs listing dependents, search, filter, sort, pager, result count),
  status columns split by meaning, advisor name in Assignments, native
  checkbox replaced by the token component, self-delete guard, container
  widths unified. Pages: all admin lists. Prototype: one HTML page showing the
  standard applied to Courses.
- **C-09 Operations landing** (D-23, D-31). Section landing per 4.5 with task
  cards: counts, pending bindings, unassigned students, window countdown;
  role-aware not-found inside the shell. Pages: /admin/operations, not-found.
  Prototype: HTML of the landing.
- **C-10 Registration windows lifecycle** (D-29). Add-window flow for future
  terms, as-of SIS stamp, imminent-close banner on Overview. Pages:
  Registration Windows, Overview. Prototype: HTML.
- **C-11 AI Advisor entry** (D-06). Grounded starters, recent conversations
  with selected state, scenario chip explained in student language. Pages:
  /app/chat. Prototype: HTML.
- **C-12 Navigation model** (D-07, D-24, D-34). Desktop More group per role,
  guaranteed five-slot mobile nav with the More sheet (Record, Notifications,
  Account, language, theme, sign out), Rules moved into More or removed,
  renames: Students, Accounts, one Rules name, shortened window label,
  devtools button moved so it never reads as a nav slot. Pages: all shells.
  Prototype: HTML of both shells, EN and AR.
- **C-13 Notification anatomy** (D-08, D-21, D-32). Every item: category icon,
  title, body, time, deep link, one inline action where one exists (Review
  request, Open plan), unread as dot plus weight (crimson border retired as
  decoration), All or Unread filter, role-correct empty copy. Pages:
  notification center, digest cards. Prototype: HTML.
- **C-14 Auth alignment** (D-33). One layout, back links, consistent labels,
  eye toggles, defined error and success states. Prototype: HTML.
- **C-15 Record truth** (D-05). Credits earned beside remaining, SIS as-of
  stamp, map legend, mobile fit or pan for the course map, milestone
  next-step copy. Pages: Record. Prototype: HTML at 1440 and 390.
- **C-16 Office hours completion** (D-12, D-13). Inline overlap and past-time
  validation, slot-generation preview line, dirty guard with saving and saved,
  booked-slot context, Profile merged in. Prototype: HTML.

## Part 4 — Proposed workflows (W-xx, need your approval)

- **W-01 Registration checklist** (D-08). After Approved, a real checklist
  surface: "Plan approved, register these sections in SIS, mark done".
  Replaces the phantom reference; gives J1 a last mile. Pages: Home, Plan,
  Notifications.
- **W-02 Governance alerts and watchlists** (D-21). Dean sets per-department
  thresholds (completion, decision time, aging); breaches raise notifications,
  amber KPI tints, and sort weight. VP subscribes to faculty watchlists.
  Pages: Overview, Notifications.
- **W-03 Import result panel** (D-25). After CSV import, show matched, bound,
  and failed rows with reasons before commit. Pages: Assignments.
- **W-04 First-run activation strip** (production behavior). New students see
  a three-step strip: check your record, build your plan, submit for review.
  Dismisses permanently. Pages: Home.
- **W-05 Inline blocker explainer** (D-04). "Why can I not add CS402?" opens
  the server's rule explanation from the course picker. Pages: Builder.

## Part 5 — Design-system additions for production (v4 sections)

New contract sections drafted after approval of the items they document:

1. **Table system**: density, header casing, row-action menu, transformation
   to cards under `lg`, pager and result-count standard.
2. **PageHeader v2**: breadcrumbs required on sub-routes, action placement,
   description rules.
3. **Form standard**: labels, required and optional, dirty state, saving,
   saved, error placement, checkbox and radio tokens, control sizes.
4. **Notification anatomy**: the C-13 spec, per category, per role.
5. **KPI card v2**: value, unit, delta versus comparison term, context line.
6. **Dataviz v2**: metric switchers, deltas, sparklines, reference lines,
   partial-term marker, text alternative as a required artifact.
7. **Governance alert taxonomy**: event, threshold, audience, deep link.
8. **Activation and onboarding pattern**: the W-04 spec.
9. **A11y evidence pack**: contrast matrix per theme and language, keyboard
   maps for palette, builder, queue, scheduling; screen-reader scripts.
10. **Localization QA standard**: Arabic review beyond key parity (plural
    forms, bidi, day and number formats).
11. **Command palette record search** (existing ticket `acad-bug`): role-scoped
    people and record entries.
12. **Prototype standard**: where prototypes live, how they graduate.

## Part 6 — Production gap inventory (beyond this frontend)

Scope decision needed: which of these are in the product effort.

- Real backend: auth with SIS binding, rules engine, plan lifecycle storage,
  notifications delivery, governance aggregation. The client is mocked end to
  end today.
- AI advisor service: the six student capabilities, quota enforcement.
- Data: seeding and sync for 6-8K students, term calendar source, course
  catalog feed.
- Operations: hosting, environments, Sentry or equivalent, source maps, error
  budgets, browser support matrix.
- Compliance: WCAG 2.1 AA evidence (Part 5 item 9), Arabic linguistic QA.
- Performance: route-level code splitting audit, bundle budget, image and
  font strategy.

## Part 7 — Prototype sequence

Your rule: prototype first, approve everything. The full HTML suite is built
and served: **prototypes/**, hub at `http://127.0.0.1:4173/` (or open
`prototypes/index.html` directly). Every screen carries a dark pill bar that
switches its states, uses the real design tokens from Appendix B, and names
the catalog items it demonstrates. Files:

| File | Demonstrates | Items |
|---|---|---|
| 01-plan-health | Plan health strip, Returned hero, checklist | C-01, D-01, D-03, D-04, W-05 |
| 02-queue-workspace | Queue as decision workspace, keyboard triage | C-02, D-09 |
| 03-shell-notifications | Shell, context top bar, bell popover, More sheet, mobile, RTL | R-01, R-02, C-12, C-13 |
| 04-chat | AI Advisor one surface, all response states | R-03, C-11 |
| 05-my-advisor | Request meeting, meeting detail, past list | C-04, D-02 |
| 06-meetings | Today strip, slot picker, Delay | C-03, D-11 |
| 07-record | Credits earned, as-of stamp, map legend | C-15, D-05 |
| 08-office-hours | Availability contract, saving, saved, dirty | C-16, D-12, D-13 |
| 09-governance | Term switcher, deltas, bottleneck link, scorecard drill, alerts | C-05, C-06, C-07, W-02 |
| 10-admin | Table standard, impact dialog, Operations, windows, import report | C-08, C-09, C-10, W-03 |
| 11-auth | Aligned auth pages with error and success states | C-14, D-33 |
| 12-workflows | Registration checklist, first-run strip | W-01, W-04 |
| 14-color-states | Color before/after pairs, full state gallery | R-04, R-05 |

**The full working replica** lives at `prototypes/app/` (same server, path
`/app/`): every proposal above is applied and interactive across all five
roles — plan fix and submit, approve and return with reasons, meetings both
ways, notifications with actions, scripted AI chat, governance term and
drill, and the admin task loops. Sign in with the five demo accounts
(password123). Data resets on refresh.

Review order is yours. The suggested order stands: the replica first, then
the theme screens for detail. React per screen: approve, amend, or reject,
and name items by number.

Approve or reorder this list, pick items from Parts 2 to 4, and I will start
prototyping. Nothing merges without you.

---

## Part 8 — Element redesign and redundancy rules (R-xx)

You flagged duplicate and redundant data everywhere. The audit confirms it:
the same fact renders on two to five surfaces, the product name renders twice
on every page, notifications exist on three surfaces with no actions, and copy
repeats itself inside single pages. This part defines the element redesigns
and the rules that end the duplication. R-items absorb related D and C items.

### 8.1 Redundancy audit (evidence)

| Repeated element | Where it renders today | Resolution |
|---|---|---|
| Product name "Advisor" | Sidebar brand AND top bar, every desktop page (R-01) | Identity lives in the sidebar once |
| Notifications | Bell count, Home digest card, center page: three surfaces, zero actions (R-02, D-08) | Bell popover + center page; Home digest removed, replaced by one action banner |
| CGPA and credits | Home KPI cards AND Record (D-05) | Canonical on Record; Home shows one compact line that links |
| Advisor identity | Home full card AND My Advisor full card (D-02) | Canonical on My Advisor; Home shows a compact row that links |
| Next meeting | Home card AND My Advisor list | Canonical on My Advisor; Home shows it only within 7 days |
| Plan state | Home hero chip, Plan page chip, notification copy re-telling transitions in words (D-03) | Canonical on My Plan; Home mirrors chip plus one action; notifications carry events, not state restatements |
| Dean sub-unit completion | Bottleneck banner, child cards, advisors table (D-17, D-22) | Overview shows aggregates with deltas; tables carry the detail |
| VP Overview vs Faculties | Overview restates scorecard totals and adds a button that duplicates the nav item (D-37 in Part 2 spirit) | Overview becomes deltas plus alerts; comparison lives on Faculties |
| VP Faculties vs Drill-down | Two nearly identical tables (D-19) | One table with inline drill (C-07) |
| Admin "Users" vs "Students" vs "Accounts" | Redirect chain, two nav names, one page (D-24, D-34) | One area, one name |
| Record ring caption vs map caption | Same sentence twice on one page (D-05) | Say it once |
| Registration windows copy | "Dates come from the SIS" in subtitle AND helper (D-29) | Copy rule below |
| AI configuration copy | Intro line repeats the helper (D-30) | Copy rule below |
| Language and theme controls | Top bar icon toggles, planned More sheet, planned Account rows | Exactly two homes: quick toggle in the avatar menu, full rows in Account |
| Caseload vs Queue columns | Both show name, plan state, waiting age | Queue answers "which decision"; caseload answers "which relationship"; columns split by question |

**Copy rule (DS-W extension):** a page states a fact once. The subtitle names
the page's truth; helper lines add behavior, never restate. One label per
thing across nav, page title, and dictionary (D-34 closes with this).

### 8.2 R-01 Shell: sidebar and top bar (carries C-12)

Current: sidebar holds identity and nav; top bar repeats the product name and
scatters search, theme, language, bell, and avatar; breadcrumbs have no home;
on mobile the More slot collides with the devtools button.

Redesign, desktop:

```
┌────────────┬────────────────────────────────────────────────┐
│ ◆ Advisor  │ Home › My Plan › Builder          ⌘K   🔔  ⏶  │
│            ├────────────────────────────────────────────────┤
│  Nav       │                                                │
│  ...       │                page content                    │
│  More      │                                                │
│  (account) │                                                │
└────────────┴────────────────────────────────────────────────┘
```

- Sidebar: identity exactly once, role nav, More group, account entry at the
  bottom. No top-bar name.
- Top bar: breadcrumbs with the page context, search opening the palette,
  bell with unread count, avatar menu (profile, language, theme, sign out).
- Theme and language icon toggles leave the top bar; quick toggles move into
  the avatar menu, full settings stay in Account.

Redesign, mobile:

```
┌──────────────────────────────┐
│ Builder               🔔  ⏶  │   page context, bell, avatar
├──────────────────────────────┤
│            content           │
├──────────────────────────────┤
│ Home  Plan  AI  Advisor  More│   five slots, More = bottom sheet
└──────────────────────────────┘
```

- The More sheet holds Record, Notifications, Account, language, theme,
  sign out. The devtools button moves so it never reads as a nav slot.
- Rejected alternative, recorded for completeness: one merged top bar with no
  sidebar. It breaks Operate density for staff tables, so it stays out.

### 8.3 R-02 Notification system (carries C-13)

Current: three surfaces, no actions, crimson used as unread decoration, and
copy written for the wrong role on staff inboxes.

Redesign:

- **Bell = popover panel.** Recent five, per-item action ("Review request",
  "Open plan"), mark all read, link to the full center. No page navigation to
  act.
- **Center page = history.** All or unread filter, category grouping, the same
  anatomy: category icon, title, body, time, deep link, one inline action.
- **Home digest is removed.** The third surface becomes at most one
  ActionRequiredBanner, driven by state: plan returned, meeting proposal
  waiting, registration window closing. One banner, one action, deep link.
- **Read model:** unread is a dot plus title weight in the info or neutral
  channel. The crimson border retires as decoration; crimson stays brand and
  primary action.
- **Role-correct copy:** governance and admin feeds carry their own event
  taxonomies (W-02), never "plan and visit updates".
- Delivery stays in-app only (PR-05).

### 8.4 R-03 AI chat element (carries C-11)

Current: the landing has no composer, no starters, and a conversation list
without a selected state; the chat feels closed until you click New.

Redesign: chat becomes one surface.

```
┌───────────────┬──────────────────────────────────────┐
│ Conversations │  transcript                          │
│ ● last open   │  ...                                 │
│ ○ older       │  [structured cards | tool | errors]  │
│ ○ older       │  ┌──────────────────────────────┐    │
│               │  │ Ask anything        (Send)   │    │
│ + New         │  └──────────────────────────────┘    │
└───────────────┴──────────────────────────────────────┘
```

- The composer is always visible; the landing state is the composer plus the
  six grounded starters from section 14 plus recent conversations.
- Response states run on the shared state layer: thinking, streaming, tool
  result, structured cards, failed with retry. The submit suggestion flow
  stays exactly as contracted (PR-07: nothing submits without the student).
- The conversation rail collapses to a sheet on mobile.

### 8.5 R-04 Color system

Rules, applied as an audit across every surface:

1. Crimson means brand and primary action. Never decoration, never unread,
   never a dataset. Today it also paints notification borders, the AI card
   border, and the 404 exit button; all three change.
2. Status means one of four semantic channels plus the plan palette, always
   rendered as tint plus icon or text (contract 6.3 holds; the audit enforces
   it where drift exists, such as the meeting chip on student surfaces).
3. Data series use the Appendix B categorical palette. A faculty line never
   renders in brand maroon; the university-average reference line may, because
   there crimson means the institution.
4. Dark mode stays a token flip; the audit re-checks every new tint pair in
   both themes at 4.5:1.

### 8.6 R-05 State layer

One specification, enforced per surface class, closing the drift the scan
found (Office Hours, Profile, and AI Configuration have no saving, saved, or
dirty states; some empty states are half width; the not-found page drops the
shell):

| State | Pattern |
|---|---|
| Loading | Skeleton matching final shape; no spinners for area loads |
| Empty | EmptyState, one width, names what, whether normal, next step |
| Error | ErrorState: what failed, saved or not, retry, request id |
| Saving, saved | Button state plus polite live region on every mutating form |
| Dirty | Unsaved-changes guard on editors (hours, rule texts, config) |
| Stale | StaleDataBanner with as-of time and retry above affected content |
| Permission | Calm panel with role reminder and a way back |
| Conflict | Two versions shown with resolution actions |

### 8.7 R-06 Say-it-once data rules

Canonical surface per fact; every other surface references, it never
restates:

| Fact | Canonical surface | Elsewhere |
|---|---|---|
| CGPA, credits earned and remaining | Academic Record | Home: one compact line linking to Record |
| Advisor identity and hours | My Advisor | Home: compact row |
| Meetings | My Advisor (student) / Meetings (advisor) | Home: next meeting only within 7 days; review drawer: meeting slice only |
| Plan state and its action | My Plan | Home: chip plus one action |
| Notifications | Center page | Bell popover; Home: action banner only |
| Governance numbers | Advisor and child tables | Overview: aggregates with deltas, never the same table twice |
| Admin counts | The destination list pages | Overview: counts plus deltas that route |

### 8.8 Prototype plan for Part 8

- **Proto A "Shell and notifications"**: sidebar, top bar, avatar menu, bell
  popover, More sheet, mobile, EN and AR. Carries R-01, R-02, C-12, C-13.
  Replaces prototypes 3 and 6 in Part 7.
- **Proto B "Chat"**: one-surface chat with starters and all response states.
  Carries R-03, C-11.
- **Proto C "Color and states"**: before and after sheets for the color audit
  and the state layer. Carries R-04, R-05.

Part 7 sequence updated: 1 = C-01 plan health strip, 2 = C-02 queue
workspace, then A, B, C-07 scorecard, C-08 and C-09 admin, in your chosen
order.
