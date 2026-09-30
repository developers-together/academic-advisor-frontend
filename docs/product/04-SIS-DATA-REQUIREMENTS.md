# Advaisor → SIS — Data Requirements Specification

> **To**: SIS engineering team · **From**: Advaisor product/engineering · **Version**: 1.0 (2026-09-29)
> **Status**: awaiting SIS review and sign-off (§8)
> **Basis**: `01-PRODUCT-FOUNDATION.md` §9 (integration contract), decisions Q56–Q68.

---

## 1. Context — what Advaisor is and how it touches the SIS

Advaisor is the university's academic plan platform with a student-facing AI advisor. Students build one
official course-registration plan per semester, the assigned advisor approves it, the student then
registers for the approved courses **in the SIS**, and Advaisor verifies afterwards that the registration
happened.

What this means for you, in one sentence: **Advaisor is a pull-only, read-only consumer of SIS data.**
We never write to the SIS, we never proxy users into it, and we need no SSO integration — Advaisor has
its own account system restricted to `@ejust.edu.eg` addresses. Everything in this document is data we
would like to *read* from endpoints you provide.

You own the endpoint design — paths, shapes, auth mechanism, and infrastructure are yours to decide.
This document defines **the data** (fields, priority, freshness) and the **questions we need answered**
(§6) so both sides can commit to a contract.

## 2. How to read this document

| Priority | Meaning |
|---|---|
| **P0 — Must** | The product cannot launch without it |
| **P1 — Should** | Strong value; launch is possible with a stated workaround/derivation |
| **P2 — Nice** | Improvement, later phase |

| Freshness tag | Meaning |
|---|---|
| `term-static` | Changes rarely; refresh per term is fine |
| `nightly` | A daily batch/pull is acceptable |
| `intra-day` | A few hours' delay is acceptable |
| `live-ish` | Minutes-level freshness, needed during the registration window only |

Scale for sizing: **6,000–8,000 active students**; catalog size university-wide is yours to tell us (§6).

## 3. Data requirements

### A. Student domain

**REQ-A1 — Student identity record** · P0 · `nightly` (spike at term start)

The unique key of the whole integration: students bind their Advaisor account to their academic record
by **student ID** at sign-up, and every piece of academic data we hold is keyed by it.

| Field | Type | Notes |
|---|---|---|
| `student_id` | string, unique, immutable | Format convention? (§6 Q9) |
| `full_name` | string | Arabic name appreciated (UTF-8) |
| `faculty_code` / `faculty_name` | string | |
| `department_code` / `department_name` | string | A student belongs to exactly one department |
| `current_level` | int (1–8) or equivalent | Academic level/year |
| `current_term` | term code | Which term the student is in |
| `enrollment_status` | enum | active / suspended / graduated / withdrawn — we must not plan for inactive students |
| `cohort_year` | int | Admission year — used for AI context only |

*Explicitly not needed:* email, phone, national ID, photo, address (§4).

### B. Catalog & offerings domain

**REQ-B1 — Course catalog** · P0 · `nightly` (change notice appreciated, §6 Q12)

| Field | Type | Notes |
|---|---|---|
| `course_code` | string, unique | |
| `title` | string | EN; AR appreciated |
| `credits` | decimal | Credit hours |
| `level` | int 1–8 | For ordering (prerequisite map) |
| `type` | enum | compulsory / elective |
| `category` | enum/string | University Req / Math & Basic Sci / … (your taxonomy, described) |
| `offering_department` | string | Which department owns the course |
| `usable_across_departments` | bool | Shared-core flag — students take it from any department |

**REQ-B2 — Prerequisite graph** · P0 · `term-static`

| Field | Type | Notes |
|---|---|---|
| `course_code` | string | |
| `prerequisite_course_codes` | string[] | Direct prereqs only; we traverse transitively |

Edge semantics are ours: a prereq counts as satisfied only if the student **sat the final** (pass or
fail) — we need failed attempts in REQ-C1 to make that work.

**REQ-B3 — Term offerings with groups & sections** · P0 · `intra-day` during the window

Students pick a **group number** and a **section number** for every course in their plan; the dropdowns
are validated against your data. This is per **term**, not per catalog eternity.

| Field | Type | Notes |
|---|---|---|
| `term_code` | string | |
| `course_code` | string | |
| `groups` | list | Group numbers offered this term |
| `sections` | list | Section numbers; and the **valid group↔section combinations** — define the model (§6 Q1) |
| `seats_total` / `seats_available` | int | *P1* — we surface availability as advice only; the SIS remains the final gatekeeper |

*Explicitly not needed:* section meeting times / schedules — timetable clash checking is out of our scope.

**REQ-B4 — Program requirement totals** · P1 · `term-static`

`program_code → total_credit_hours_required` (e.g. 134). We can derive a student's remaining credit
hours as `total − earned` if you confirm that formula, else see REQ-C4.

### C. Student academic records domain

**REQ-C1 — Course history (all attempts)** · P0 · `nightly` (spike after grade posting)

Every attempt, **including failures and repeats** — our repeat policy blocks a 3rd attempt of a course,
so attempt counts must be reconstructable.

| Field | Type | Notes |
|---|---|---|
| `student_id` | string | |
| `course_code` | string | |
| `term_code` | string | When attempted |
| `attempt_number` | int | If you track it; else we derive from repeated (student, course) rows |
| `final_grade` | letter | As stored in the SIS (include F and W if applicable) |
| `grade_points` | decimal | *P1* — only if trivially available; we never recompute GPA |
| `credits_earned` | decimal | 0 for failed attempts |
| `sat_final` | bool | Or an equivalent (grade is not "incomplete"/"withdrawn-late") — powers our prereq rule |

**REQ-C2 — Current enrollments** · P0 · `nightly`

`student_id → [{course_code, group, section, term_code}]` — courses in progress right now.

**REQ-C3 — CGPA** · P0 · `nightly`

`student_id → cgpa (decimal)` on your official scale (tell us the scale, §6 Q5). We display it and apply
one rule threshold (below 2.00 limits a plan to 12 credits); we **never** compute or restate GPA math.

**REQ-C4 — Remaining credit hours / degree audit** · P1 · `nightly`

Either `student_id → remaining_credit_hours` directly, or a full degree audit (remaining required
courses per category) if you have one — that would also feed the AI's "can I graduate?" answers.
Otherwise we derive from REQ-B4 + REQ-C1, with your confirmation that the derivation is legitimate.

### D. Calendar & registration domain — the two most time-sensitive items

**REQ-D1 — Academic calendar: registration window dates** · P0 · `term-static`, needed **≥ 2 weeks before the window opens**

| Field | Type | Notes |
|---|---|---|
| `term_code` | string | |
| `registration_opens_at` / `registration_closes_at` | datetime, ISO 8601 + timezone | The whole product's clock derives from these two values |
| `term_starts_at` | date | Context for display |
| `is_current_term` | bool | Or we derive from dates |

**REQ-D2 — Registration status (verification)** · P0 · **`live-ish` during the window**

After an advisor approves a plan, Advaisor checks the SIS to confirm the student actually registered the
approved courses. This is how the platform closes its loop — it is the single most important read after
the window opens.

| Field | Type | Notes |
|---|---|---|
| `student_id` | string | |
| `term_code` | string | |
| `registered_courses` | list | `[{course_code, group, section}]` as actually registered |

We will poll per-student on demand (student taps "check my registration") plus a nightly sweep of
approved plans. §6 Q4 asks what polling interval you can tolerate.

### E. Aggregates & configuration

**REQ-E1 — Course analytics (aggregated, anonymized)** · P1 · per term, after grades post

| Field | Type | Notes |
|---|---|---|
| `course_code` | string | |
| `avg_grade` | decimal or letter | Average outcome |
| `fail_percentage` | decimal | % of attempts failed |
| `period` | string | Which terms the aggregate covers |

Consumed **only** by the AI advisor to honest-up students ("this course has a 40% fail rate") — no
screens, no individual students. *Alternative we can accept:* we derive these from fully mirrored REQ-C1
data — if so, confirm our history mirror is complete for all students, not per-request.

**REQ-E2 — Academic rule configuration** · P2 (optional) · `term-static`

If the SIS exposes its own rule parameters (min/max credits per term, summer cap, probation threshold,
repeat limits, graduation totals), we sync them and display "source: SIS" per rule. **If you don't
expose them, no problem** — Advaisor's admin enters them manually as a fallback. Tell us either way.

## 4. Explicitly NOT needed (please don't build or expose for us)

- **Any write access** to the SIS — registration, grades, records: never
- Student emails, phone numbers, addresses, national IDs, photos — Advaisor accounts are in-system
- Attendance, financial/billing, scholarship, disciplinary, housing, HR data
- Section meeting times / timetables — we do no clash checking
- SSO / identity federation — no user login flows touch the SIS
- Real-time streams/webhooks — polling is fine (though a change webhook for catalog updates would be a pleasant surprise, §6 Q12)

## 5. Non-functional expectations

| Topic | What we ask for |
|---|---|
| **Transport** | REST + JSON strongly preferred; we can adapt to GraphQL or file drops if that's what exists |
| **Auth** | Server-to-server (API key, mTLS, or OAuth client-credentials — your choice); secrets live only in our backend; TLS mandatory |
| **Environments** | A **staging endpoint with realistic synthetic data** before production cutover — our build pipeline depends on it from day one |
| **Pagination & filters** | Bulk pulls (all students, full catalog) must support pagination and `updated_since` filters |
| **Formats** | UTF-8 (Arabic content), ISO 8601 datetimes with explicit timezone, stable term codes |
| **Load** | ~6–8K students; heaviest moment is registration week (we'll keep to an agreed polling budget, §6 Q4/Q11) |
| **Change management** | If a field or shape changes, advance notice; versioned endpoints appreciated |
| **Data minimization** | We request exactly the fields in §3 — nothing more; happy to sign a data-access scope if your governance needs one |

## 6. Questions we need answered (these block the final contract)

1. **Groups vs sections**: what is the data model? Is a section nested under a group? Can a student combine group G1 with section S3, or are there fixed valid combinations per course/term?
2. **Term offerings**: can you provide "courses actually offered in term X" distinct from the full catalog? If not, is every catalog course assumed offerable?
3. **Term codes**: your convention, and the concrete dates for the **next** registration window (we need D1 signed off ≥ 2 weeks before it opens).
4. **Registration-status freshness (D2)**: how fresh can this realistically be during registration week — minutes? hourly? What polling interval can your infrastructure tolerate?
5. **Grade & GPA scale**: the official letter scale and the CGPA scale (4.0?), so display matches transcripts exactly.
6. **Course analytics (E1)**: can you aggregate avg grade + fail %? Over which period? Or should we derive from mirrored history (then: is our history pull complete for all students)?
7. **Degree audit (C4)**: do you have remaining-credits or a full audit per student, or do we derive from program totals?
8. **Attempts**: does history include failed and withdrawn attempts, and can attempt counts be reconstructed reliably (we enforce a 3rd-attempt block)?
9. **Student ID**: format, uniqueness, immutability — it is the sign-up binding key, so we need certainty.
10. **History depth**: how many past terms are available (feeds AI context and analytics)?
11. **Load & windows**: any rate limits, maintenance windows, or batch schedules we must respect?
12. **Change notification**: webhook/`updated_since` support for catalog and student-record changes, or pure polling?

## 7. Appendix — suggested object shapes (non-prescriptive; yours to redesign)

```jsonc
// GET /terms/{term_code}/offerings  (REQ-B3)
{ "term": "2027-SPR",
  "offerings": [{ "course_code": "CS201", "groups": [
      { "group_no": 1, "sections": [ { "section_no": 3, "seats_available": 12 } ] } ] }] }

// GET /students/{student_id}/academic-record  (REQ-C1..C4, A1)
{ "student_id": "EJ-2023-0451", "faculty": "CSIT", "department": "CSC",
  "level": 5, "cgpa": 2.86, "remaining_credit_hours": 42,
  "history": [{ "course_code": "CS101", "term": "2023-FAL", "attempt": 1,
                "grade": "B+", "credits_earned": 3, "sat_final": true }],
  "current_enrollments": [{ "course_code": "CS301", "group": 2, "section": 1 }] }

// GET /students/{student_id}/registration?term=2027-SPR  (REQ-D2)
{ "term": "2027-SPR",
  "registered": [{ "course_code": "CS301", "group": 2, "section": 1 }] }
```

## 8. Sign-off

| Role | Name | Date |
|---|---|---|
| Advaisor product owner | | |
| SIS engineering lead | | |
| University IT / integration owner | | |

**Next step**: a working session to walk §6 question by question; then Advaisor proceeds against a
staging endpoint; production cutover only after both sides sign this document's final revision.
