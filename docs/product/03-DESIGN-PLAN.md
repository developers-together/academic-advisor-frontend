# Advisor — Design Plan (Figma Journey)

> **Basis**: `01-PRODUCT-FOUNDATION.md` (§ refs). **Sequencing**: this plan executes only after the
> foundation doc is signed. Build phases (P0–P4 in `02-PROJECT-PLAN.md`) consume D-phase outputs — each
> D-phase lands **before** its matching build phase starts.

---

## 0. Design Stance

We are not restyling the prototype. The prototype answers *"what features existed"*; this plan answers
*"given the foundation contract, what is the clearest interface for each role's decisions?"*. The two
things worth keeping on their merits: the **prerequisite map** (foundation §14-S4) and the E-JUST
**crimson identity**. Everything else is designed fresh from the role models.

## 1. D-Phases

| Phase | Output | Feeds |
|---|---|---|
| **D0 — Design system** | Tokens (Figma variables), type scale, grid, core component library (~30 components, §2), both themes, LTR+RTL | everything |
| **D1 — Shell + auth** | App shell (role-scoped rail, topbar), X1 auth (login + in-system **account registration** with student-ID binding, `@ejust.edu.eg` gate, states) | P0 |
| **D2 — Student journey** | S1–S6 **fully**, all plan states (§15 matrix), edge states, phone + desktop frames | P1 |
| **D3 — Advisor workspace** | A1–A5 fully: queue, review drawer (approve/return+comment/meeting), explorer, meetings, office-hours editor | P1 |
| **D4 — Dean** | D1–D4: scoreboard, funnel, advisor detail, student explorer | P3 |
| **D5 — VP + Admin** | V1–V3 scorecard/drill/trends; M0–M8 admin operations (design.md §4.5) | P3 |
| **D6 — State matrix coverage** | Every screen × loading/empty/error/denied/stale-SIS/window-closed (foundation §15); deadline + notification moments | P4 |
| **D7 — Prototype + handoff** | Clickable stakeholder prototype: **J1 happy loop + J2 return loop + one advisor review** (the demo that sells the product); dev-mode handoff, redlines, token export | P4, university sign-off |

## 2. Component Library (D0 scope — ~30 components)

**Primitives**: color/type/spacing tokens · buttons (variants × states) · inputs, selects, dropdowns ·
badges/chips · banners · toasts · tooltips · tabs · pagination (10/20/50/All) · skeleton loaders ·
empty-state illustration set (bilingual).

**Domain components** (each maps to a foundation §):

| Component | Foundation ref | Notes |
|---|---|---|
| `PlanStateChip` | §7 | 8 settled states plus the contract's discarded terminal (rendered on the Closed tokens with its own label); color + icon + label; the single most repeated element in the product |
| `PlanCard` (dashboard) | S1 | State, next action CTA, window countdown |
| `PlanLine` | §7.1 | course + group + section dropdowns + per-line validation |
| `ValidationPanel` | §7.3 | Hard-block messaging; **reveals constraints, never labels** (Q57) |
| `CommentThread` | §7.2 | Advisor-only comments; student = read + **Seen** button |
| `SeenButton` | Q32 | Unlock affordance; confirm micro-dialog |
| `SubmitSuggestionCard` | §12 | AI chat → submit handoff; the AI edits the one plan in place |
| `PrereqMap` | S4 | Port of prototype SVG roadmap; 4-state coloring, level columns |
| `AvailabilityEditor` / `SlotPicker` / `SlotViewer` | §10 | recurring rows, slot generation, conflicts, confirmation |
| `MeetingRequestCard` | §10 | Both directions; the v2 request state machine with confirmation |
| `QueueTable` + `ReviewDrawer` | A1 | Approve / Return+comment / Request meeting — the advisor's one job |
| `ScoreboardTable`, `FunnelChart` | §13 | Dean; completion %, median decision time, aging |
| `FacultyScorecard`, `DrilldownTable` | §13 | VP; approvals per faculty |
| `NotificationCenter` + `NotificationItem` | §11 | 8 trigger types, deep links |
| `StaleDataBanner`, `WindowClosedBanner` | §15 | Global system states |
| `LanguageToggle`, `ThemeToggle` | §17 | Shell topbar |

## 3. Visual Direction

- **Identity**: E-JUST crimson as the brand anchor (prototype heritage) on a neutral, high-contrast
  scaffold; state colors reserved for plan semantics (Draft gray · Submitted blue · Under Review amber ·
  Returned orange · Approved green · Expired red · Closed neutral; Withdrawn and Discarded share the
  Closed neutral).
- **Typography**: Inter (EN) + an Arabic companion (Cairo or IBM Plex Sans Arabic) — decide in D0 with
  rendering tests in both themes; Latin numerals for academic figures in both locales.
- **Density**: students get breathing room (phone-first); advisor/dean/VP get data-dense tables
  (desktop-first). One system, two densities.
- **Dark/light as Figma variable modes** — no duplicate frame trees, ever.
- **RTL as mirrored layout with logical properties** — one auto-layout frame per screen, direction
  switch via variable; RTL screenshots reviewed per screen in D6.

## 4. Screen Production Rules

1. Every frame states its **foundation §** and its position in the §15 state matrix.
2. No screen is "done" without: loading, empty, error, and (where relevant) window-closed and
   stale-SIS states.
3. Student screens are designed at 390px **and** 1440px; staff screens at 1440px and usable to 360px
   with the mobile shell (top bar, bottom navigation, sheets) per design.md §5 and §20.
4. All copy in both EN and AR — no lorem, no English-only frames. Placeholder content uses the seeded
   dataset shape (extraction §2) so frames double as dev specs.
5. Numbers follow the foundation: no risk labels, no simulator UIs; student free text stays inside
   plan fields, chat, and meeting-request notes (Q57, Q36, Q66 as amended).

## 5. Acceptance Checklist (per D-phase)

- [ ] Covers the full page inventory for its role (foundation §14) — no invented pages
- [ ] Every §15 state present or explicitly N/A with reason
- [ ] Both themes, both directions rendered and reviewed
- [ ] Components from §2 reused (no one-off styling)
- [ ] Permission matrix respected on-screen (a dean frame never shows an approve button, etc.)
- [ ] Bilingual copy final enough to hand to engineering (i18n keys implied)
- [ ] D7: prototype runs J1 + J2 + one review end-to-end without a designer narrating
