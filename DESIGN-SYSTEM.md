# Advisor Design System — complete edition (v5.0)

> Status: canonical standalone reference, 2026-10-06. This document is self-contained:
> an implementer needs nothing else to build Advisor UI. It supersedes nothing and
> duplicates nothing: it IS the system, consolidated. Contract source: design.md
> section 26 (v5) on top of the v2/v3 foundation. Living reference:
> [prototypes/design-system.html](prototypes/design-system.html). Working demo:
> [prototypes/app/](prototypes/app/) (Theme v4/v5 toggle). Rollback: git tag
> `design-v4-final`.

## 0. How to read this

| You are… | Read in this order |
|---|---|
| A designer | 1, 2, 3, 4, 7 |
| An engineer | 2, 4, 5, 6, 8, 9 |
| A reviewer | 4.10, 6, 9, 10 |

Every rule has an ID (`DS-…`). MUST rules block release; SHOULD rules need a written
reason to skip. The prototype is the visual truth for everything shown there.

---

## 1. Brand and principles

**Advisor** is the university's AI academic advisor. Five roles: student (phone-first,
spacious), advisor (dense decision tools), dean and VP (aggregates only), admin (task
tools). The AI assists; it never decides. Registration happens in the SIS; the platform
never fakes currency.

| # | Principle | Consequence |
|---|---|---|
| P1 | Calm institutional intelligence | No decoration without a job; brand lives in precise details |
| P2 | Say it once | Every fact has one canonical surface; elsewhere it links (see 6.6) |
| P3 | Material honesty | Buttons look pressable, cards are flat, elevation is earned |
| P4 | One primary action per screen | Exactly one crimson-filled control per view (DP-03) |
| P5 | Color means something | Crimson = brand + primary only; status = 4 semantic channels; data = categorical palette |
| P6 | Design the states, not the happy path | Every component ships its full state set (4.10) |
| P7 | Boring copy wins | Clear and institutional beats clever (7) |
| P8 | Prototype first | No change lands without a prototype the owner approved |

---

## 2. Design tokens (exact values)

### 2.1 Color — brand and neutrals

| Token | Light | Dark | Use |
|---|---|---|---|
| `--crimson-700` | #8B0000 | — | Primary (light) |
| `--crimson-600` | #9B2731 | #B24A53 (dark primary) | Primary hover / dark primary |
| `--crimson-800` / `--crimson-900` | #6B0000 / #520000 | — | Primary active |
| `--crimson-500` | #B24A53 | #D0727D | Focus ring (light) / dark ring |
| `--crimson-400` | #D0727D | — | Focus ring (dark) |
| `--crimson-50/100/200/300` | #FCF4F4 / #F8E5E6 / #F0C9CD / #E3A2AA | — | Tints (active nav, avatars) |
| `--background` | #F6F7F9 | #101216 | Page canvas (v5) |
| `--surface` (card) | #FFFFFF | #191C22 | Cards, drawers, tables, popovers |
| `--foreground` | #1A1D21 | #F1F5F9 | Body text (15.8:1 light) |
| `--muted` | #F1F5F9 | #1E2530 | Subtle fills |
| `--muted-foreground` | #64748B | #94A3B8 | Secondary text (4.8:1 on white) |
| `--border` | #E2E8F0 | #334155 | Hairlines, input borders |
| `--cream` | #F5F0E8 | #26221A | **Earned milestones only** (border #E8DFC9 / #4A422F) |

### 2.2 Color — semantic status (tint + solid pairs)

| Token | Light fg | Light tint bg/border | Dark fg | Dark solid | Use |
|---|---|---|---|---|---|
| success | #32845A | #ECFDF5 / #A7F3D0 | #34D399 | bg #34D399, fg #06281A | confirmed, completed, saved, approved |
| warning | #9A6700 | #FFFBEA / #FDE68A | #FBBF24 | bg #FBBF24, fg #2A1D00 | awaiting, aging, stale, dirty |
| info | #2563A6 | #EFF6FF / #BFDBFE | #38BDF8 | bg #38BDF8, fg #062033 | requested, submitted, saving |
| destructive | #C62828 | #FEF2F2 / #FECACA | #F87171 | bg #F87171, fg #2B0505 | declined, cancelled, expired, error |
| neutral | #64748B | #F1F5F9 / #E2E8F0 | #94A3B8 | — | closed, withdrawn, offline, none |

Rules: chips and banners render as tint (bg + border + fg); solid rendering is only for
primary buttons and small solid badges. Meaning is never color alone — every status
pairs color with an icon, dot, or text (DS-A-05). Status never migrates across domains
(meeting colors stay off student surfaces).

### 2.3 Plan-state palette

| State | Light bg/fg/border | Dark bg/fg/border |
|---|---|---|
| draft | #F1F5F9 / #334155 / #CBD5E1 | #1E293B / #CBD5E1 / #475569 |
| submitted | #EFF6FF / #1D4ED8 / #BFDBFE | #172554 / #93C5FD / #1E40AF |
| under_review | #FFFBEA / #92400E / #FDE68A | #451A03 / #FCD34D / #92400E |
| returned | #FFF7ED / #9A3412 / #FED7AA | #431407 / #FDBA74 / #9A3412 |
| approved | #ECFDF5 / #047857 / #A7F3D0 | #022C22 / #6EE7B7 / #047857 |
| expired | failed pair + dashed border | failed pair + dashed border |
| closed / withdrawn / discarded | #F8FAFC / #64748B / #E2E8F0 | #1E293B / #94A3B8 / #334155 |

Plan-state colors appear only on plan surfaces.

### 2.4 Data visualization palette

Categorical series, in colorblind-safe order: `#2563EB`, `#0D9488`, `#D97706`,
`#7C3AED`, `#64748B`, `#DB2777`. Crimson `#8B0000` renders only the university-average
reference line and "the answer" emphasis — never a series. Heatmap quartiles: data-1
`#D1FAE5`/`#065F46`, data-2 `#ECFCCB`/`#3F6212`, data-3 `#FEF3C7`/`#92400E`,
data-4 `#FECACA`/`#7F1D1D` (dark: `#064E3B`/`#A7F3D0`, `#365314`/`#D9F99D`,
`#78350F`/`#FDE68A`, `#7F1D1D`/`#FECACA`). Full dataviz rules: section 6.

### 2.5 Typography

| Role | Spec |
|---|---|
| Latin | Inter (self-hosted variable, `font-display: swap`) |
| Arabic | Cairo (self-hosted; applies under `[dir=rtl]`) |
| Fallbacks | `ui-sans-serif, system-ui, sans-serif` |
| Weights | 400, 500, 600, 700 — nothing else |
| Display / page title | 24px / 600, -0.01em |
| Section title | 18px / 600 |
| Card title | 16px / 600 |
| Body | 16px form inputs and student body; 14px staff UI (42px line-height ≥1.5) |
| Secondary body | 14px, muted-foreground |
| Metadata | 12px |
| Caption / eyebrow | 11px / 500 / 0.06em tracking / uppercase (micro-labels only, never paragraphs) |
| Numerals | Latin digits both locales; `tabular-nums` on every number column, KPI, timestamp, chart |
| Arabic | line-height 1.6 (EN 1.55); Cairo never below 14px; bidi-isolate course codes (`.bidi-code`) |
| Measure | prose blocks `max-width: 65ch` |

Arbitrary font sizes are banned; the scale above is exhaustive.

### 2.6 Space, radius, elevation, layers

| Scale | Values |
|---|---|
| Space (4px base) | 4, 8, 12, 16, 20, 24, 32, 48, 64 |
| Radius — student | cards 14px, controls 8px, pills 999px |
| Radius — staff | cards 6px, controls 6px, pills 999px |
| Radius — phone sheet | 16px top corners |
| Elevation | popovers/menus `0 4px 6px -2px rgb(15 23 42/.05), 0 10px 24px -6px rgb(15 23 42/.12)`; dialogs/drawers shadow-lg; sticky headers shadow-xs; cards flat (hover: shadow-xs only, DS-C-14) |
| Z-index | sticky 10, dropdown 30, overlay 40, modal 50, toast 60 |
| Breakpoints | sm 640, md 768 (nav switch), lg 1024 (staff density gate), xl 1280 |
| Containers | student content max 860px; staff content max 1200px; prose 65ch |
| Touch targets | 44×44px below `lg`; 36px controls only behind `(pointer: fine) and (min-width: 1024px)` |

### 2.7 Iconography and imagery

lucide-react only, `strokeWidth` 2, sizes 16/20/24. No emoji as icons or decoration.
Directional icons mirror under RTL. Decorative icons are `aria-hidden`. Icons never
replace text labels on first-use surfaces.

### 2.8 Motion

| Token | Value |
|---|---|
| fast / base / slow / modal | 150 / 200 / 300 / 400 ms |
| Entrance easing | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo); exits at 0.6× duration |
| Keyframes | `fade-in`, `chip-in` (scale .96→1), `typing` |
| Animate only | transform and opacity |
| Mandatory | `prefers-reduced-motion: reduce` collapses all durations to 0.01ms |

Motion explains change (drawer open, status transitions, skeleton→content, AI
streaming); it never decorates.

---

## 3. Layout and shell

### 3.1 Desktop shell

- **Sidebar** (224px): brand mark + wordmark exactly once, role nav, `More` group,
  account at bottom. Collapsed 56px icon rail at <1280px.
- **Top bar** (56px, sticky): breadcrumbs with page context — never the product name —
  then search (⌘K), bell with unread count, avatar menu (account, language, theme,
  sign out).
- **Content**: page header (title 24/600, description 14 muted, one primary action
  right-aligned in LTR), then content column.

### 3.2 Mobile shell (<768px)

Top bar: page context + bell + avatar. Bottom nav: exactly five slots (home, three
role primaries, More). More opens a bottom sheet (16px top radius) holding secondary
areas, language, theme, sign out. Safe-area padding `env(safe-area-inset-bottom)`.
Bottom nav items: icon + 11px label, `aria-current="page"` on active, 44px minimum
height.

### 3.3 Breakpoint behavior

| Range | Shell | Tables | Drawers/dialogs |
|---|---|---|---|
| ≥1024 | full sidebar | full table | side drawer |
| 768–1023 | collapsed rail | table, tighter padding | side drawer |
| <768 | top bar + bottom nav | transform to cards (whole-table horizontal scroll is banned) | full-screen sheet |

### 3.4 Navigation model

One route table drives sidebar, bottom nav, breadcrumbs, palette, and guards. Roles
see only their areas; a cross-role hit renders the calm permission panel (never a raw
404). Breadcrumbs on every sub-route: `aria-label="Breadcrumb"`, separators
decorative, current page `aria-current="page"`, collapsed `…` on mobile.

---

## 4. Component contract

> The deepest section, per review: every component lists anatomy, variants, states,
> and when it is forbidden. States marked ★ are mandatory in every implementation.

Universal interaction states (apply to every interactive component): default ★, hover,
focus-visible ★ (2px ring `--crimson-500`, 2px offset, never removed), active,
disabled ★ (50% opacity + `cursor: not-allowed` + tooltip reason where non-obvious),
loading ★, selected, readonly. Form fields additionally: error ★ (inline, below field,
destructive + icon), success, required/optional marked.

### 4.1 Button

Anatomy: label (verbs, sentence case), optional leading icon. Variants: `primary`
(crimson solid — at most one per view), `outline`, `ghost`, `destructive` (solid red;
only inside confirm flows), `link` (weight/color emphasis, no underline). Sizes: 44px
(touch) / 36px (staff `lg+`), small 32px. States: the universal set + loading spinner
replacing icon. Forbidden: two primaries in one view; destructive as a row button;
text-only "Delete" links.

### 4.2 Status chip (unified)

Anatomy: dot or icon + label, pill. Domains: plan (2.3 palette), meeting, account,
data (2.2 mapping: confirmed/completed→success, requested/proposed→info,
awaiting→warning, declined/cancelled/expired/conflict→destructive, closed→neutral).
Sizes sm 11px / md 12px. Screen readers get the full form: "Meeting status: Confirmed".
Forbidden: raw status enums, color-only chips, cross-domain reuse.

### 4.3 Banner

Anatomy: icon (20px, semantic color) + title (600) + body + optional actions row.
Variants: info, success, warning, destructive, window-closed. `role="alert"` for
destructive, `role="status"` otherwise. One banner per intent per view; the student
home carries at most one action banner (it replaces the notification digest).

### 4.4 Academic pulse strip (signature, student)

Anatomy: optional heading row + 3-segment band (10px tall, pill) + label row. Segment
1 plan state (fixed minimum width, crimson by state), segment 2 credit load
(proportional to the 12-18 window), segment 3 degree progress (proportional). Labels
are persistent text with exact values; color never carries the value alone. At most
one per page; it replaces KPI restatements. States: draft/returned/approved shift
segment colors and labels. RTL mirrors via logical properties.

### 4.5 Decision rail (signature, staff)

Anatomy: fixed 5-field grid — student (name 600 + id muted), state chip, signal (what
changed, one line), urgency (tabular wait + aging chip), one primary action (Review).
Approve/Return live in the review surface, never on the rail. States: default,
selected (outline ring), aging (urgency in warning), blocked (destructive hint).
Collapses to 2 columns under 900px. Forbidden: more than one primary on the rail,
adding fields beyond the five.

### 4.6 Form fields

Anatomy: label (13/500, above), control, helper (12 muted), error (12 destructive +
icon, replaces helper). Inputs 44px touch / 36px staff, 16px text (prevents iOS
zoom). Selects and native-looking controls styled to the same spec. Checkbox and
radio: custom-drawn (no raw browser chrome), 20px box, crimson check. Rules: labels
never duplicate placeholders verbatim; required marked, optional stated once per
form; validation inline on blur + on submit; errors keep the draft (never clear
input); save flows show saving→saved with a polite live region; dirty editors guard
navigation.

### 4.7 Table (staff density)

Anatomy: toolbar row (search, filters, result count) + table + row actions + pager.
Header: 11px/500/0.06em uppercase muted, `aria-sort` when sorted. Cells: 13px,
12px padding, numbers right-aligned `tabular-nums`. Row actions: one quiet `⋯` menu
(menu: Edit, Duplicate, Delete-in-destructive); destructive actions open the impact
dialog (4.8). Pager: "Showing 1–N of M" + Previous/Next (44px on touch). Empty:
filter-aware empty state with a clear action. Loading: skeleton matching the final
shape. Mobile: transforms to cards under 768px.

### 4.8 Confirm / impact dialog

Anatomy: title as question ("Delete CS 201?"), impact list (dependents, counts),
consequence line ("This cannot be undone."), actions: Cancel (outline, initial focus)
+ verb-specific destructive ("Delete course" — never "OK"/"Yes"). Focus-trapped, ESC
closes, focus returns to trigger. Harmless actions never get dialogs (PR-17).

### 4.9 Drawer and dialog

Drawer: side panel (480px staff review, 420px general), full-screen sheet <768px,
focus trap + ESC + focus return, header (title + state chip) / scroll body / sticky
decision footer. Dialog: centered, max 480px, same trap rules. The review drawer
section order is fixed: academic summary → courses → validation → warnings → comments
→ meeting → return reason.

### 4.10 State gallery (mandatory for every surface)

| State | Pattern |
|---|---|
| loading ★ | skeleton matching final shape; no full-page spinners |
| empty ★ | EmptyState: icon, title naming what, one line on whether it is normal, next-step action |
| error ★ | ErrorState: what failed, whether anything was saved, retry, request reference |
| saving/saved ★ | button state + polite live region |
| dirty | unsaved-changes guard: Stay / Discard |
| stale | as-of timestamp + Refresh above the affected content |
| permission ★ | calm panel: which role owns this + way back |
| conflict | two versions + Keep mine / Take server |
| not found | role-aware way back (never a raw 404) |
| window closed | replaces the submit CTA; content stays readable |

### 4.11 Notifications

Anatomy: category icon (32px tile), title (600 when unread), body, time, deep link,
one inline action where one exists. Unread = dot + title weight (info channel);
crimson never marks unread. Bell = popover with the 5 most recent + "Mark all as
read"; center page = full history with All/Unread. Delivery is in-app only (PR-05).
Role-correct copy: governance/admin feeds carry their own event taxonomies.

### 4.12 AI Advisor chat

One surface: conversation rail (240px, selected state) + transcript + composer always
visible. Landing state: composer + six grounded starters + recent conversations.
Response types: text, course card (code, title, credits, status, why-it-matters, one
action), summary card, plan proposal (lines + credits + reasoning + the mandatory
"Nothing has been submitted yet" banner), meeting suggestion. Tool events render in
user language. States: thinking (animated dots), streaming (partial text + cursor),
failed (transcript preserved + Retry). The AI never submits (PR-07).

### 4.13 Cards, KPI, milestones

Card: surface + border + radius by mode, 20-24px padding, no nested cards. KPI: label
eyebrow, value 26/700 tabular, unit, delta chip vs comparison term, context line.
Milestones: earned = success tint or cream celebration surface; pending = muted +
concrete next step (never bare "Not yet"). Progress ring: SVG, 40% arc style, center
value; the caption is stated once per page.

### 4.14 Meeting components

Meeting card: status chip, other party, direction line, reason, slots (radio chips;
booked slots render disabled with the reason "Booked — CS 301 lecture"), actions by
state (requested → Confirm/Propose/Delay/Decline; awaiting → Confirm/Decline;
confirmed → Reschedule/Cancel/Mark completed). Slot picker: per-day radio groups,
44px targets, booked conflicts visible. Office hours editor: rows (day/from/to),
inline overlap validation, slot-generation preview, publish/clear with confirms.

### 4.15 Command palette

⌘K / Ctrl+K + visible entry point. Radix dialog at top-20%, grouped entries (Pages,
Records, Actions) built from the role-scoped route table only. Keyboard contract:
arrows, Enter, ESC, focus return. Footer hints ↑↓ ↵ esc.

### 4.16 Empty-state anatomy (canonical)

Title (16/600) names what is empty; body (14 muted) says whether that is normal; one
action when one exists. Half-width on mixed pages, full-width on list pages — never
both widths on one page.

---

## 5. Workflow and state-transition rules

- **Plan lifecycle**: draft → submitted → under_review → approved/returned (+expired,
  withdrawn, discarded). Every transition renders a chip, a notification with an
  action, and the canonical surface updates. Returned: reason renders on the plan
  (once), Seen gates re-editing, resubmit re-enters validation.
- **Validation**: the server owns verdicts; the UI renders them grouped by line with
  jump-to-line. The submit gate is visible before submission (credit meter +
  Validate), not only at failure. Copy explains the rule in student language; raw
  rule IDs may appear once as a meta line, never as the message.
- **Hard block**: plans failing validation cannot submit; the button explains why on
  hover and the banner lists every failure.
- **Destructive actions**: impact → confirm (verb-specific) → execute → result → undo
  where safe. Deletion surfaces dependents (programs, plans, rules).
- **Optimistic vs confirmed**: nothing is optimistic for consequential writes;
  saving→saved states cover the rest. Failures keep drafts.
- **Permissions**: enforced at route, data, navigation, and action layers; the UI
  never shows a disabled control where the role should see nothing at all.
- **Meetings**: one model both directions; every status change notifies the other
  party with a deep link; conflicts render explicitly with resolution actions.

---

## 6. Data visualization contract

1. Every chart names the question it answers in its title or caption (DS-C-13).
2. Palette per 2.4; crimson only for reference/"answer" emphasis; series never use
   the brand color.
3. Straight or stepped lines for discrete terms; smooth splines are dishonest.
4. The in-progress term renders dashed or hollow with a "partial term" label.
5. Text alternative (table or summary line) is mandatory (DS-C-11); tooltips carry
   `tabular-nums`.
6. Non-color differentiation: line styles, markers, or direct labels.
7. One chart per governance view plus supporting tables (no chart walls).
8. KPIs show delta versus a named comparison term; counts carry units ("29 plans",
   "26 h").

---

## 7. Content and voice

- Sentence case everywhere; verbs on buttons ("Return plan"); no exclamation marks in
  product copy; no emoji.
- Errors: what failed, whether anything was saved, whether it is temporary, what to
  do. "Something went wrong" is banned where a better explanation exists.
- Empty states: what, whether normal, next step.
- Honest self-description: the AI assists; the SIS is the ledger; stale data is
  labeled with as-of time (PR-16, DS-W-11).
- One label per thing: nav, page title, and dictionary agree (Students, Accounts,
  Rules, Faculty Overview). Product name "Advisor", never "Advaisor".
- Numbers: Latin digits both locales; dates localized; credits as "12–18 credits";
  ranges use the hyphen; no em dashes in UI copy.
- Academic tone: "The repeat rule blocks this course" — constraints, never labels on
  people (PR-01: no "at risk", no "probation").

---

## 8. Accessibility contract

- Target WCAG 2.1 AA. Verified pairs (normal text): #1A1D21 on #F6F7F9 15.8:1 ✓;
  #FFFFFF on #8B0000 10.0:1 ✓; #8B0000 on #F6F7F9 8.9:1 ✓; #32845A on #FFF 4.6:1 ✓;
  #9A6700 on #FFF 4.8:1 ✓; #2563A6 on #FFF 6.3:1 ✓; #C62828 on #FFF 5.0:1 ✓;
  #64748B on #FFF 4.8:1 ✓. Dark pairs ≥7:1 (2.2).
- Focus: always visible, 2px crimson ring with offset, never removed; focus order
  follows reading order; focus trapped in dialogs/drawers and returned on close.
- Keyboard: the full app works without a pointer, including palette, builder, queue
  triage, and scheduling.
- Touch: 44px minimum below `lg`; zoom never disabled.
- Screen readers: `aria-current` on nav, `aria-sort` on tables, live regions for
  saving/saved and status changes, sr-only full status text on chips, `aria-busy` on
  loading regions, one h1 per page, landmarks + skip link.
- Reduced motion honored globally; motion never carries meaning alone.
- Non-color communication everywhere (icons, dots, text, shapes).

---

## 9. Localization (EN + AR)

- All strings via dictionary keys; EN/AR parity enforced by test; `lang`/`dir` flip on
  `<html>`; document title per route.
- Logical CSS properties only (`ps-`, `pe-`, `start`, `end`); physical `left/right`
  in components is a defect. Icons with direction mirror under RTL.
- Cairo applies under `[dir=rtl]` with line-height 1.6; Latin digits stay Latin;
  course codes bidi-isolate inside Arabic sentences.
- Arabic plurals use i18next CLDR forms (`_zero/_one/_two/_few/_many/_other`) —
  hardcoded duals are defects.
- Units, dates, and times localize through the format helpers (Africa/Cairo for
  scheduling).

---

## 10. Governance

- Versioning: semver on this document; the changelog lives in design.md.
- Change process: proposal → prototype approved by the owner → contract update →
  implementation → QA. No component ships without a story/test and both themes.
- Deprecation: mark, announce in the changelog, remove after one release.
- Design/code parity: tokens here map 1:1 to `src/index.css` custom properties;
  raw values in components are defects (DS-C-01).
- Ownership: the product owner approves visual changes; engineering owns
  implementation quality; the design hook and `npm run verify` gate every change.
- **Release gates (all five must pass before a change is production-ready):**
  1. Design review — the change matches this document and the prototype.
  2. Accessibility review — contrast pairs (section 8), focus, keyboard, SR labels.
  3. RTL review — logical properties, mirroring, Cairo rendering, plural forms.
  4. Reference-page parity — `prototypes/design-system.html` renders the change.
  5. Documentation and version check — this file updated, changelog entry written.

---

## 11. Implementation mapping

| Layer | Location |
|---|---|
| Tokens | `src/index.css` (`@theme` + `:root`/`.dark`) |
| Primitives | `src/components/ui/*` |
| Domain components | `src/components/domain/*`, `src/features/*/components/*` |
| Shell/router | `src/components/layouts/app-shell.tsx`, `src/app/routes/*` |
| i18n | `src/lib/i18n/locales/{en,ar}/*.json` (9 namespaces) |
| Living reference | `prototypes/design-system.html` |
| Working demo | `prototypes/app/` (Theme v4/v5 toggle) |
| Theme screens | `prototypes/01…14` |
| Proposal history | `design-system-v4-draft.md`, `design-system-v5-proposal.md` |
