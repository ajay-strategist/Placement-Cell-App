# Antigravity Build Prompt — Christ Placement Cell

> Paste the section below into Antigravity. It's written to be executed **phase by phase** — tell Antigravity to do Phase 1 first, confirm it works, then continue. Don't ask it to build everything in one shot.

---

## CONTEXT (give this to Antigravity first)

You are extending an existing web app called **Christ Placement Cell**. Do NOT rewrite it from scratch — extend the current code and keep the existing visual style.

**Current stack (keep it):**
- Frontend: plain HTML + CSS + vanilla JavaScript (no framework). Files: `index.html`, `admin.html`, `student.html`, `teacher.html`, `manage-training.html`, `css/style.css`, `js/db.js`, `js/auth.js`, `js/admin.js`, `js/teacher.js`.
- Backend: Google Apps Script web app (URL is in `js/db.js` as `apiUrl`). It exposes `?action=readAll`, and POST actions `save` / `delete` with `{action, sheet, data|id}`.
- Database: Google Sheets tabs — `Students`, `Teacher`, `Training Program`, `Activity`.
- Auth: `sessionStorage` (`currentUser`, `userRole`) set in `js/auth.js`; offline cache in `localStorage` (`db_cache`).
- Libraries already in use: SheetJS (Excel), a charting library (dashboards).

**Current roles:** Admin, Teacher, Student (3 login tabs in `index.html`).

**Hard rules:**
1. **USE THE CURRENT THEME — do not restyle anything.** Every new screen, modal, button, table, card, and form must reuse the existing design system in `css/style.css` (glassmorphism cards, Inter font, the existing color palette, gradients, sidebar layout, and existing class names like `glass-card`, `sidebar-link`, `btn btn-primary`, `form-control`, `management-tab`, etc.). Do NOT introduce a new framework, new fonts, new color scheme, or new CSS file. If a new component is needed, build it from existing classes/variables; only add minimal CSS that matches the current style.
2. Every data change must go through the existing `db.js` → Apps Script → Google Sheets flow. When you add a new entity, add a new Sheet tab and matching `db.js` methods + Apps Script handling.
3. Don't break existing features. After each phase, the app must still log in and run.
4. Write clear comments and keep functions small.

---

## PHASE 1 — Add two new roles (Teacher Coordinator, Student Coordinator)

**Goal:** Go from 3 roles to 4: `admin`, `teacherCoordinator`, `studentCoordinator`, `student`. Both coordinators have FULL access (no department/batch scoping) — the difference is capability, per the matrix below.

1. **Login (`index.html` + `auth.js`):** add two tabs so the order is Student / Student Coordinator / Teacher Coordinator / Admin. Route after login: admin→`admin.html`, teacherCoordinator→`admin.html` (same portal, permissions hide some controls), studentCoordinator→a new `coordinator.html`, student→`student.html`.
   - Teacher Coordinator logs in with phone + password (mark a teacher record with `isCoordinator: true`, or store role on the Teacher sheet).
   - Student Coordinator logs in with their student register number + password, where the student record has `isCoordinator: true`.
2. **Permission matrix to enforce (hide/disable UI + guard actions):**

   | Capability | Admin | Teacher Coord | Student Coord | Student |
   |---|---|---|---|---|
   | Manage users (admins/coordinators) | ✅ | ❌ | ❌ | ❌ |
   | Add/edit/delete students & teachers | ✅ | ✅ | ❌ | ❌ |
   | Bulk Excel upload | ✅ | ✅ | ❌ | ❌ |
   | Create/edit/delete training & drives | ✅ | ✅ | ❌ | ❌ |
   | Manage sessions, batches, attendance | ✅ | ✅ | ✅ | ❌ |
   | Update selection-phase results | ✅ | ✅ | ✅ | ❌ |
   | Post announcements | ✅ | ✅ | ✅ | ❌ |
   | View dashboards & export reports | ✅ | ✅ | ✅ | own only |
   | System settings & audit log | ✅ | ❌ | ❌ | ❌ |

3. Add a small `permissions.js` helper: `can(role, capability)` returning true/false, and use it everywhere to show/hide buttons and guard handlers.
4. **Admin → User Management:** add a toggle to promote/demote a teacher or student to Coordinator.

**Acceptance:** all 4 roles can log in; coordinators see only what the matrix allows; existing admin/student/teacher flows unchanged.

---

## PHASE 2 — Registered-only attendance with live OTP + QR check-in

**Goal:** For Activities (and optionally Training sessions), students can be marked present **only if registered**, and attendance is captured via a coordinator-displayed **QR code + 6-digit OTP that rotates every 30 seconds**.

1. **Coordinator "Live Attendance" screen** (in `manage-training.html` for training, and the placement activity manage view in `admin.html`):
   - Button "Start Live Check-in" for a chosen session → opens a panel showing a large **QR code** and a **6-digit OTP**, both regenerating every 30 seconds with a visible countdown.
   - The code encodes `{activityId, sessionId, window}` where `window = floor(currentEpochSeconds / 30)`. Validate with a TOTP-style scheme: `OTP = hash(sessionSecret + window)` truncated to 6 digits. Store only `sessionSecret` (not every code) in the Sheet.
   - Live list: registered students split into "Checked in (with timestamp)" vs "Not yet", with a manual override (mark present/absent) as fallback.
2. **Student check-in** (`student.html`): a "Check in" action that lets the student either scan the QR (camera) or type the current OTP. On submit, send `{regNo, activityId, sessionId, otp, window}` to Apps Script.
3. **Server validation (Apps Script):**
   - Reject if the student is NOT in that activity/session's `registrations`.
   - Recompute the valid OTP for the current and previous 30s window (small grace period); reject if it doesn't match.
   - Reject duplicate check-ins; on success append `{regNo, timestamp}` to the session's `attendance`.
   - Optional: enforce a check-in window (e.g., only first 15 min) and one-device-per-student.
4. Use a lightweight client-side QR library (e.g., a small `qrcode` JS lib via CDN) for generating the QR; for scanning use the browser camera with a QR-decode lib, or allow OTP typing as the simple fallback.

**Acceptance:** a non-registered student cannot check in; an expired OTP is rejected; a valid in-window OTP/QR marks the student present once with a timestamp; coordinator sees the live count update.

---

## PHASE 3 — Notifications (in-app + email, free)

1. New `Notifications` Sheet tab: `{id, audienceType, audienceValue, title, body, createdBy, createdAt, readBy[]}`.
2. Coordinators/Admin can post a notification targeted to: all / a course / a department / a single student / registrants of a drive.
3. **In-app:** a bell icon in every portal showing unread count + a dropdown list; mark-as-read updates `readBy`.
4. **Email (free):** in the Apps Script, send email with `MailApp.sendEmail(...)` to the targeted students' `mailId`. Note the daily quota (~100/day on consumer Gmail, ~1,500/day on Workspace) — batch and log failures. Trigger emails for: new drive published, session scheduled, results declared, deadline reminders.
5. Design so a **WhatsApp** channel can be added later (a `channel` field on notifications) — do NOT build WhatsApp now.

**Acceptance:** posting a notification shows it in-app for the right audience and emails them; unread badge works.

---

## PHASE 4 — Student resume/documents + application tracker

1. **Resume/documents:** student uploads resume (PDF) and other docs. Store via Apps Script to a Google Drive folder; save the file link on the student record. Show profile-completeness %.
2. **Application tracker (`student.html`):** for each drive the student applied to, show status pipeline: Applied → Shortlisted → Interview → Offer / Rejected, driven by the existing selection-phase data.
3. **Placement readiness score** on the student dashboard: weighted from training attendance %, feedback submitted, and profile completeness.

---

## PHASE 5 — Company/recruiter master + eligibility engine

1. New `Companies` Sheet: `{id, name, role, ctc, location, jdLink, eligibility:{minCgpa, allowedBranches[], maxBacklogs}, contactName, contactEmail}`.
2. Link a placement Activity/drive to a Company.
3. **Eligibility-aware listing:** students only see/register for drives they qualify for (compare student CGPA/branch/backlogs to the company's eligibility). Show "you're not eligible" with the reason otherwise.
4. **Offer + policy:** record offers per student; enforce a configurable policy (e.g., max 1 offer, or "dream company" exception). Admin sets the policy in Settings.

---

## PHASE 6 — Analytics, reports & hardening

1. **Institute dashboard:** placement %, highest/avg/median CTC, recruiter count, branch-wise and gender-wise breakdown, year-on-year trend.
2. **Exports:** generate PDF/Excel placement reports (use SheetJS for Excel; a print-friendly HTML or a PDF lib for PDF).
3. **Audit log:** new `AuditLog` Sheet capturing `{who, action, entity, entityId, timestamp}` for create/edit/delete on key records; Admin-only viewer.
4. **Auth hardening:** hash passwords (don't store plain text), force password reset on first login, and add email-based password reset.

---

## DELIVERY INSTRUCTIONS FOR ANTIGRAVITY
- Implement **one phase at a time**, keep the app runnable after each.
- For every new entity: add the Sheet tab, the `db.js` methods, the Apps Script handler, and the UI.
- Match the existing CSS and component style.
- After each phase, give me a short summary of files changed and how to test it.
