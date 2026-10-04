# Context

Advisor is the university's AI academic advisor platform for E-JUST. Students understand their
academic situation and build one official course-registration plan per semester; the assigned advisor
approves or returns it with a mandatory written reason; the student registers the approved plan
manually in the SIS, which stays the authoritative system for registration data. The AI advisor helps
students plan; it never submits or decides. Deans and the VP observe advising health as read-only
aggregates. Admin runs the operational control plane: users, assignments, courses, programs, rules,
registration windows, notification configuration, and AI configuration. The client is a single Vite
React 19 app in this repository; product truth lives in `docs/product/`, design truth in `design.md`.

## Glossary

| Term | Meaning |
| ---- | ------- |
| Plan | The single official course-registration plan a student builds per semester. The core object. |
| Plan line | One row: course + group + section. Groups/sections come from SIS-sourced options. |
| Validation | Deterministic server-side rule check on plan lines and totals. Hard-blocks submission. |
| Return | Advisor rejects a plan by writing the mandatory comment; state becomes `returned`. |
| Comment | Advisor-authored text on a plan. On a Returned plan it is the reason. |
| Seen | Student acknowledgment that unlocks a Returned plan for editing and resubmission. |
| Availability window | A recurring weekly day/from/to office-hour slot an advisor publishes. |
| Meeting request | The single request object behind both meeting directions; state machine per foundation §10.1. |
| Meeting slot | A concrete dated start/end interval generated from availability; the unit a request proposes and confirms. |
| Registration window | SIS-provided open/close dates; the platform's only clock. |
| Verification | Server check against SIS that the student registered the approved plan. |
| Caseload | The set of students assigned to one advisor, created by Admin. |
| Queue | The advisor's pending plan reviews; the advisor's landing workspace. |
| Aging | A queue item undecided past the Admin-configured threshold; the UI reads the server's `is_aging` flag and never the threshold value. |
| Governance | The read-only dean/VP aggregate views over advising health. |
| Scorecard | The aggregate table over completion %, median decision time, and aging. |
| Command palette | The permission-aware ⌘K/Ctrl+K search and command surface. |
| Stale SIS | SIS-sourced data older than its freshness expectation; always labeled with its as-of time. |
| Account registration (sign-up) | Creating a user account inside Advisor; `@ejust.edu.eg` only; students bind by student ID. |
| Course registration | Enrolling in sections. Happens in the SIS only; out of product scope. |

## Invariants

- The platform never writes to the SIS and never computes GPA.
- A plan that fails validation cannot be submitted; advisors cannot approve invalid plans.
- The AI never sends, approves, or changes academic state; nothing consequential happens without an
  explicit human confirmation.
- No student is ever labeled "at risk" or "probation"; rule copy states constraints, never categories.
- Notifications are in-app only; no email, SMS, WhatsApp, or push; no free-form person-to-person
  messaging.
- VP surfaces never show dean identity beside faculty statistics and never drill below Department.
- Dean sees only their own area; advisors and aggregates, never student profiles.
- Every user-facing string exists in both EN and AR dictionaries; numerals stay Latin in both locales.
- Status is never color alone: icon + label + color everywhere.

## Decisions

System-wide decisions live in `docs/product/01-PRODUCT-FOUNDATION.md` §20 (Decisions Log) and
`docs/adr/` when architecture decisions need their own record.
