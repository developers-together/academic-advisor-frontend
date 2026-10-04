# Backend contract handoffs from the Advisor frontend effort

Date: 2026-10-02. Source: the frontend map "Wayfinder map: Advisor React client v1 decisions", ticket "Contract gaps and contradictions" (acad-abl.20). Each ask was verified against the backend implementation on 2026-10-01 (`routes/api.php`, `app/Notifications`, controllers, `openapi.json`). The frontend ships workarounds for every item, so none of these block the client spec; they fix real gaps users will hit.

## H1: Point the verification email at the SPA

Priority: high. Without it, every new user who clicks the email link sees raw JSON.

Current behavior (verified): `routes/api.php` names the API route `verification.verify`, so Laravel mails the API URL. A browser click renders the JSON response instead of the app.

Ask: point the verification email link at `{app origin}/verify-email/{id}/{hash}`, keeping the `expires` and `signature` query params the signed middleware requires. Document that the client route calls `GET /api/verify-email/{id}/{hash}` on the user's behalf.

Acceptance: clicking the email link from a browser opens the SPA verification screen, which then calls the API endpoint and renders the result.

Client meanwhile: the client serves `/verify-email/:id/:hash`, calls the endpoint, renders success, then redirects an authenticated user to `/app` and a guest to `/login`; 403 renders the calm invalid-link panel, 503 the retry panel.

Sources: frontend decisions in acad-abl.12 and acad-abl.20 item 2; backend decision acad-9s3.2.

## H2: Add a student visit-request list endpoint

Priority: medium. Today the request survives only in memory for the session that created it.

Current behavior (verified): the student visit-requests group has POST and DELETE only (`routes/api.php` lines 180 to 186). A reloaded client has no id for Delete and no way to show an open request.

Ask: add `GET /api/visit-requests` returning the signed-in student's own requests with the VisitRequest schema, under the create-visit-request permission.

Acceptance: a student who reloads sees their open Proposed request and can delete it.

Client meanwhile: after POST the client writes the returned VisitRequest into the visit-requests cache, so the creating session shows the open request and Delete works; a reload loses it until this endpoint lands.

Sources: acad-abl.20 item 4; backend Meetings baseline (at most one Proposed request per student per term).

## H3: Expose the registration window dates

Priority: medium. The product docs promise a countdown; the contract makes one impossible.

Current behavior (verified): no endpoint carries window dates. The window is SIS-owned and returns only as a 422 `window` key or a 503 `plan.window_unavailable`.

Ask: expose the current term's registration window to the client, for example `GET /api/terms/current` returning `opens_at` and `closes_at`, or a window object on an existing envelope, so the dashboard countdown and a dated WindowClosedBanner can be data-driven.

Acceptance: the client can render when the window opens and closes, or state that it cannot.

Client meanwhile: the banner renders without dates ("Registration is closed. Your approved plan waits for the next window."), triggers only on the window 422, the 503, and window notification links; the dashboard countdown is cut in v1.

Sources: acad-abl.20 item 17; backend acad-9s3.4 (SIS owns the window).

## H4: Make plan credit totals real

Priority: medium. Plans render today with the credit total omitted rather than a fake zero.

Current behavior (verified): `Plan.total_credit_hours` is documented as "Always 0 for now; the SIS computes credit totals", and PlannedCourse rows carry only `course_code`, `group`, `section`, `reason`.

Ask: populate `Plan.total_credit_hours`, or add a `credits` field to PlannedCourse rows, so the client can render the plan total and per-course credits.

Acceptance: a student and an advisor reviewing a plan see real credit numbers.

Client meanwhile: course titles join from the prerequisite map on `GET /api/academic-record`; the credit total is omitted, never shown as zero.

Sources: acad-abl.20 item 18; backend acad-9s3 decision 19.

## Doc-only riders

Small openapi.json documentation fixes; no behavior change:

- R1: document the pagination `page` parameter name (Laravel `page`) in openapi.json (rides on item 3).
- R2: update `Notification.deep_link` to the object schema the implementation actually sends (`{screen, ...ids}`), not the stale nullable string (rides on item 7).
- R3: document `Content-Disposition` on the governance export; the stream already sends `governance-{term_code}.csv` (rides on item 8).
- R4: align the openapi.json reason-rejection wording with the implementation: the contract says 409, `PlanService.assertReasonAllowed` throws 422 with key `reason` (rides on item 19).

## Secondary asks surfaced by the frontend map

Lower priority; recorded so they reach backend triage. Each was accepted or worked around on the client:

- Auth: `RegisterInput` requires `name` but lacks `student_id` and `password_confirmation`, which the product signup needs; the resend-verification path can return 401; there is no password-reset completion endpoint, so forgot-password ends at a sent confirmation; the parked-account response shape is undocumented. (acad-abl.12)
- Profile: `GET /api/me` carries no school or department; there is no plan history endpoint. (acad-abl.14)
- Advisor: no queue visit flag, no Seen receipt, no staleness payload on advisor endpoints, no level query param, and the visit-request POST 201 contract entry is undocumented. (acad-abl.16)
- Governance: the dean 403 lacks a stable error key; an advisor-performance endpoint would unlock the parked scoreboard detail; a trends series endpoint would unlock the trends chart. (acad-abl.17)
- Admin: no audit/system-log endpoint (M5 ships deferred); password reset needs a staff id but there is no staff list; a rule enable field exists only if wanted; riders for `search-matches-email` and `rows.{n}` 422 keys. (acad-abl.18)
- Chat: a quota read endpoint would let the UI show remaining turns; v1 ships with the count invisible until exhaustion. (acad-abl.15, acad-abl.20 item 9)
