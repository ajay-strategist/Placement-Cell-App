# Christ Placement Cell — Issue Log

Issues found during testing.

## Status (updated 2026-06-29)
- **#1 Student Coordinator** — ✅ Resolved in code (login tab, `permissions.js`, `coordinator.html` all exist; screenshots predate this). Verify after deploy.
- **#2 "undefined Days"** — ✅ Fixed (computed-days fallback in `admin.js` list/edit + `manage-training.html` header).
- **#3 Description renders raw HTML** — ✅ Fixed (`manage-training.html` header now uses innerHTML).
- **#4 Edit modal empty description** — ✅ Already correct in current code (innerHTML prefilled); hardened.
- **#5 Passwords plain text** — ⚠️ Partially fixed (now masked with click-to-reveal in UI). Hashing on storage still pending (Phase 4 auth hardening).
- **#6 Coord badge inconsistency** — ✅ Fixed (both use one `.coord-badge` style).
- **Password column** — ✅ Removed from the student table entirely (key/reset action kept under Actions).
- **Training Reports** — ✅ Added a new **Reports** tab to Program Management: summary cards (registered/batches/attended/completed/not-attended), batch-wise summary table, student-wise report with status filter (not-attended / below-threshold / completed), configurable completion % (default 75), and **Export to Excel** (Summary + By Batch + Students sheets).

---


| # | Area | Issue | Notes |
|---|---|---|---|
| 1 | User Management — roles | **Student Coordinator not found.** User Management only has "Manage Students" and "Manage Teachers" tabs. Teacher Coordinators show a "Coord" badge under Manage Teachers, but there is no way to view, create, or manage Student Coordinators anywhere. (Note: a "Coord" badge DOES appear on student Arjun Mehta, so a flag exists — but there's no dedicated way to find/filter coordinators or a Student-Coordinator login.) | Need a way to promote a student to Student Coordinator, filter/see coordinators, and a Student-Coordinator login + portal. |
| 2 | Training — duration | **"undefined Days" / "Duration: Days".** "Soft Skills Mastery" shows `undefined Days` in the Training list, and the Program Management header shows `Duration: Days` with no number. Duration/days calculation is broken when end date is missing or for older records. | Compute days from start/end dates; fall back gracefully if dates are missing. |
| 3 | Training — description renders raw HTML | Program description is stored with HTML tags and shows **literally** as `<b>Corporate communication</b> training.` in the Program Management header (and as plain text elsewhere) instead of rendering bold. | Render the rich-text description as HTML (safely) wherever it's displayed. |
| 4 | Training — Edit modal | **Edit Training Program modal opens with an empty Description box** even when the program already has a description. The existing content isn't pre-loaded into the editor. | Pre-fill the rich-text editor (and Target Audience selections) with the program's saved values on edit. |
| 5 | Security — passwords | **Passwords are shown in plain text** in the Student Master Records "PASSWORD" column (and stored in plain text). | Mask passwords in the UI; hash on storage (ties to Phase 6 auth hardening). |
| 6 | UI — badge inconsistency | The **"Coord" badge color is inconsistent** — green under Manage Teachers, navy/dark-blue under Manage Students. | Use one consistent badge style for coordinators across both tabs. |
