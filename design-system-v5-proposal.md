# Advisor design system v5 — proposal draft (brand-new direction)

> Status: DRAFT for approval, 2026-10-06. Nothing here is implemented. Built from a
> live research loop: browsed Dribbble, Behance, and enterprise design-system sites in
> the in-app browser, then ran a ChatGPT-on-the-web planning loop (plan prompt → read →
> decide → act) per your workflow. ChatGPT's longer stress-test stalled mid-generation,
> so the contrast math and the remaining sections below were completed by hand with
> WCAG arithmetic. Sources and the full loop log are in Part 6.

## Part 1 — Research evidence

Captures saved to `/tmp/design-research/` (screenshots) and summarized here.

| Source | What it shows | Take for Advisor |
|---|---|---|
| Dribbble "university student dashboard" | Pastel bento grids, indigo/violet, 16-24px radii, progress rings, GPA/schedule cards, welcome headers | Bento warmth + progress devices are the student-facing norm; indigo is the cliché to avoid |
| Dribbble "academic advisor education dashboard" | Ryan Hulseberg's university portal: crimson sidebar, white content, blue links; Advisor mobile app (blue booking) | Crimson institution portals exist and read as credible; our brand is viable as-is |
| Behance search | Université de Toulouse identity: crimson on warm cream; Academic Journey UX/UI | Warm cream + crimson reads institutional yet fresh; cream suits achievement moments |
| Enterprise systems (Atlassian, Polaris caliber) | Neutral layered grays, semantic status roles, strict scales, color reserved for meaning | The Operate backbone; staff surfaces follow this |

## Part 2 — The four candidate directions (ChatGPT loop 1)

1. **Crimson Institutional** — quiet authority; current identity modernized. Risk: conventional portal.
2. **Academic Editorial** — warm cream #F5F0E8, Source Serif, editorial dividers. Risk: serif slows tables.
3. **Signal Operations** — enterprise precision, 6px density, "decision rail". Risk: cold.
4. **Crimson Modern** — calm bento intelligence, 14px radius, "academic pulse" strips. Risk: trendy drift.

## Part 3 — The proposed hybrid (ChatGPT loop 2 + my decision)

**Base: Crimson Modern** for student-facing surfaces; **Signal Operations density and
the decision rail** for staff surfaces (this mirrors the contract's existing two-density
rule: student spacious, staff compact); **warm cream #F5F0E8 reserved exclusively for
earned milestones and approval moments** (one nod to Academic Editorial, no serif).

### 3.1 Token set (light)

| Role | Value | Notes |
|---|---|---|
| Background | #F6F7F9 | cool-neutral canvas |
| Surface | #FFFFFF | cards, drawers, tables |
| Surface-warm (milestones only) | #F5F0E8 | earned moments; never decorative |
| Primary | #8B0000 | hover #6B0000, active #520000 (existing ramp) |
| Accent (interactive secondary) | #5A67A8 | AA on white (5.3:1); #6674B8 demoted to decorative only |
| Body text | #1A1D21 | 15.8:1 on background |
| Success fg | #32845A (4.6:1) | chip tints unchanged |
| Warning fg | #9A6700 | fixed from #B27618 (3.8:1 fail → 4.8:1 pass) |
| Info fg | #2563A6 | |
| Destructive | #C62828 | |
| Radius | 14px student / 6px staff | two densities on one token set |
| Fonts | Inter + Cairo unchanged | Source Serif rejected (table efficiency risk) |

### 3.2 Dark mode pairs

Background #101216, surface #191C22, primary #B24A53 (white text on it = 5.3:1),
success #34D399, warning #FBBF24, info #38BDF8, destructive #F87171 (all ≥7:1 on
background as text). These align with the existing dark tokens; v5 formalizes them.

### 3.3 Chart palette (6, colorblind-ordered, crimson excluded)

#2563EB blue · #0D9488 teal · #D97706 amber · #7C3AED violet · #64748B slate ·
#DB2777 pink. Crimson is reserved for the university-average reference line and
"the answer" emphasis. Every chart still names its question.

### 3.4 Signature elements

- **Academic pulse strip** (student): a slim contextual progress band (plan status,
  credit load, degree share) reused across Home, Plan, and Record. Replaces repeated
  KPI cards — the say-it-once rule made visible.
- **Decision rail** (staff): a persistent five-field strip on review surfaces —
  Student (name + id) → Plan state chip → Signal (what changed) → Urgency (waiting
  vs threshold, aging chip) → Next action (one primary). States: default, selected,
  aging, blocked. Density follows the staff 6px mode.

### 3.5 RTL mitigations (for 14px bento + Cairo)

1. Bento asymmetry mirrors via logical properties only (no left/right utilities).
2. Cairo runs ~4% taller: student body line-height 1.6 in AR, 1.55 in EN.
3. Bidi isolation (.bidi-code) extends to chips, meters, and chart labels around
   course codes.

## Part 4 — What changes vs the current system (v4 draft interplay)

- Keeps: all v4 structural proposals (shell, notifications, states, flows). v5 is a
  reskin + two signature elements, not a rework.
- Changes: background canvas (#F6F7F9), radius system (two-mode), accent token
  (fixed AA), warning fg (fixed AA), chart palette formalized, cream milestone
  surface added, decision rail added, pulse strip added.
- The ChatGPT-critiqued pairs above all pass AA as marked; accent-as-text moved to
  #5A67A8 specifically to pass.

## Part 5 — Approval asks

1. Approve the hybrid (or pick a pure direction from Part 2).
2. Approve the two signature elements (pulse strip, decision rail).
3. Approve the AA token fixes (accent, warning).
4. Then: I skin the working replica with v5 as a toggle so you compare live, before
   anything touches design.md.

## Part 6 — Loop log (your ChatGPT workflow)

1. Think → prompt ChatGPT (web) for a research plan. Result: the tab hit your
   account's MFA wall; you approved it later and the session went live.
2. Research executed in the browser meanwhile: Dribbble ×2, Behance, enterprise
   system sites (Atlassian and Polaris paths had moved; noted, not guessed further).
3. Think → synthesis prompt (product context + findings + constraints) → ChatGPT
   returned the 4 directions verbatim in Part 2.
4. Think → hybrid decision (mine) → stress-test prompt to ChatGPT. Generation
   stalled twice after the first heading; the deterministic parts (contrast math,
   dark pairs, chart order, RTL, rail spec) were completed by hand, recorded above.
5. Next loop (after your approval): v5 skin on the replica → your review → design.md v5.
