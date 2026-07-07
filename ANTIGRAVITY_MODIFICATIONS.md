# Antigravity Modifications — Intake (draft, do not build prompt yet)

Collecting requirements. The final Antigravity prompt will be created only when the user says so.

## Fixed context (applies to the whole prompt)
- **Database: SUPABASE** (Postgres). ⚠️ We are NO LONGER using Google Sheets — migrate the entire data layer off Google Apps Script/Sheets to Supabase. (The old Google Sheet link is deprecated: ~~https://docs.google.com/spreadsheets/d/168am1ojXcA52yNcyDZSZ0uhvMFcIIxk1URk9IHwqA10/edit~~)
- **Supabase setup Antigravity must do end-to-end** (user has NO programming skills):
  - Create the database schema (SQL) for all entities — see list below — and provide the exact SQL to run in the Supabase SQL editor.
  - Wire the front-end using the Supabase JS client (`@supabase/supabase-js`) with the project URL + anon key. Replace `js/db.js`'s Apps Script logic entirely with Supabase reads/writes (proper responses so the app can confirm success/failure and show toasts).
  - Give plain-language, step-by-step instructions for creating the Supabase project, running the SQL, getting the URL/anon key, and pasting them in.
  - Handle Row Level Security appropriately (or a simple, documented policy) so the app works for a non-technical operator.
- **Entities/tables needed:** students (incl. class, isCoordinator), teachers (incl. isCoordinator), training_programs (with sessions, batches, registrations, feedbacks — JSONB or related tables), placement_activities (with selection phases + per-phase qualified/eliminated students + registrations), exams (questions/options/answers/explanations JSONB), exam_attempts/results, class_incharge. Keep it non-technical to operate.
- **User has no programming skills** → Antigravity must handle EVERYTHING end-to-end: front-end code, the Supabase backend/schema, wiring, and step-by-step setup instructions in plain language.
- App is the existing "Christ Placement Cell" web app (HTML/CSS/JS). (Note: `BACKEND_SETUP.md` in the folder is the OLD Google-Sheet setup — now obsolete/superseded by Supabase.)

## Modifications (to be filled in from upcoming messages)
1. **Student Data Table (User Management → Manage Students) looks messy — make it a premium, properly-aligned table.**
   Observed problems in the current render: NAME wraps to 2 lines ("Arjun Mehta"), COURSE wraps ("B.Sc CS"), DEPT wraps ("Computer Science"), CLASS shows "—" placeholders, uneven row heights, columns not aligned cleanly. Wants: clean column widths/alignment, no awkward wrapping, consistent row height, tidy action buttons, premium spacing/typography — while keeping the current theme.

2. **Training Programs table — centre-align the numeric columns.** The count columns (Registered, Attended, Not Attended, Completed) should be centre-aligned under their headers (currently left-aligned / off).

3. **Program Management "Banner" (program details header) — adjust alignment + premium look.** The top card (program name, Venue / Date / Duration, and the "3 Registered" box). Make the layout properly aligned and premium. (User note mentions Venue — ensure Venue is clearly shown/aligned in the banner.)

4. **Registered Students tab — button alignment.** "Assign Selected" and "Remove from Batch" buttons (next to the "Assign to Batch…" dropdown) are not aligned with the row — fix the alignment so the label + dropdown + both buttons sit on one clean baseline.

5. **Manage Batches → Auto-Split panel.** The "Auto Split" button is not aligned with the Split Method / Number of Batches fields — fix alignment. Also the blue dashed panel background isn't good — restyle it to a premium look (keep theme).

6. **Reports tab — summary cards.** Adjust the card size and put all the cards (Registered, Batches, Attended, Completed, Not Attended) on a SINGLE row instead of wrapping to a second row.

7. **BUG: MCQ Exams not working.** The MCQ Exams module (create exam / take exam / upload external marks / auto-grade) must be fully functional end-to-end, saving to the Google Sheet DB.

8. **BUG: Create Class not working.** Class management must work — creating/managing classes and populating the Class view. Ensure classes can be created and appear (from the student Class field and/or a create action), fully wired to the Google Sheet.

9. **NEW FEATURE — Placement selection-phase qualification tracking.** Each recruitment/drive has multiple processes (phases). In each phase some students qualify and some are eliminated; only qualified students move to the next phase, continuing until the last process. Need to track qualified vs eliminated per phase, with TWO ways to update the qualified list:
   - **Option 1 (staff update):** Admin / Student Coordinator / Teacher Coordinator can update the list of selected (qualified) students for a phase.
   - **Option 2 (student self-update):** Students can update their own status (e.g., when they receive an email/result about clearing a round).
   Enforce that only qualified students advance to the next phase, phase by phase, to the end.

10. **Design — upgrade MCQ Exams, Class, and Placement Activities (Selection Phases) pages to a premium look** (keep current theme). Selection Phase cards look decent now but should be polished to premium; MCQ and Class pages need the premium pass too.

11. **BUG: Add/Edit Student modal overflows the screen and can't be closed.** The modal is taller than the viewport — the title is cut off at the top, there is no visible close (✕) button, and the Save/Cancel buttons + "Promote to Student Coordinator" are pushed below the fold so the user can't submit or close. Fix: constrain modal to viewport height with a scrollable body, a sticky header containing a visible ✕ close button, and a sticky footer with always-visible Save/Cancel. Apply the same fix to other tall modals. Premium look.

12. **PERMISSIONS: Teacher Coordinator can manage ONLY Students (not Teachers).** In the Teacher Coordinator portal, remove/hide the "Manage Teachers" tab and the "Add Teacher Record" / edit / delete teacher actions. Teacher Coordinators should only see and manage the Students side of User Management. (Update the permission matrix accordingly.)

13. **BUG: Header role subtitle always shows "Administrator".** In every portal the top-right subtitle under the user name reads "Administrator" regardless of role. Fix it to show the actual logged-in role: "Admin", "Teacher Coordinator", "Student Coordinator", or "Student".

14. **LOGIN: Remove the separate "Student Coordinator" login tab.** Students should have ONE login option ("Student") to avoid confusion. Coordinator privileges should be granted automatically based on the student's `isCoordinator` flag after they log in as a normal Student (a promoted student sees the coordinator features/portal). Login tabs become: Student, Teacher Coordinator, Admin. Teacher Coordinator and Admin can promote a student to (Student) Coordinator.

15. **BRANDING: background image + logos.** Image files are already in the project folder (exact names):
    - `Background.jpg` — use as the **login page background** (replace the current dark-blue background). Inside the portals, keep the current background as-is.
    - `Logo.jpg` — the college logo; replace the "CC" placeholder circle (on the login page, and ideally the sidebar brand).
    - `KVJ analytics Logo.png` — add a **"Powered by KVJ Analytics"** element on the login page (small logo + text, e.g. footer of the login card).
    Ensure images are referenced by these exact filenames and display crisply/responsively.

17. **Reports → Student-wise Report: remove the "Below Completion Threshold" filter option.** Marks are not being considered in programs, so drop that option from the status filter dropdown (keep All Students / Registered but Not Attended / Completed). (For discussion: whether to also remove the "Completion %" input, since completion would then just mean attended.)

19. **MCQ Exams — add Manage and Report actions.**
    - **Manage Exam button:** allow editing an existing exam (edit title, program, duration, pass mark, questions/options/answers) — currently exams can only be created/deleted.
    - **Report button:** clicking it must open and display the exam report — a per-exam list of students showing attempted / not-attempted and their result (pass/fail, and score if scoring is kept), with a **Course filter** and **search by student name**. (The button must actually render the report, not be a placeholder.)
    - **Answer explanations at the end of the exam:** after a student submits, show a review of each question — their answer, the correct answer, and an **explanation**. This means adding an optional "Explanation" field per question in the exam builder, shown in the student's post-submit review.

21. **MCQ — remove "Linked Training Program".** Remove the training-program link/dropdown from the exam builder; exams should not be tied to a training program. (For discussion: since exams were assigned to students via the linked program's registrants, decide the new way to assign an exam — e.g., to all students, by course, by class, or by manual selection.)

22. **MCQ — attend anytime, with an OPTIONAL completion timer.** "No time restriction" = students can start the exam at ANY time (remove any start/end availability window). BUT keep the **optional per-exam duration timer**: if the creator sets a duration, show a countdown + auto-submit; if not set, no timer. So: availability unrestricted, timer optional.

18. **Remove "Upload External Marks" (mark uploading).** Marks/scores are not used, so remove the external-marks Excel upload feature from MCQ Exams (and any Score columns that depend on uploaded marks). Completion is attendance-based only. (For discussion: whether the on-platform MCQ exam should still show its own pass/fail score for the exam itself, or drop scoring entirely.)

16. **UI BUG: Training page content overlaps the sidebar / horizontal overflow.** On the Training page the white "Training Programs" panel is shifted left and overlaps the dark sidebar (covering the nav items), and the page shows a horizontal scrollbar. The main content isn't respecting the 250px sidebar width. Fix the layout so content stays inside the main-content area with no horizontal overflow or overlap (check the Training tab / table container width, negative margins, and `overflow-x`). Verify on all admin tabs. (Note: the new college crest logo now appears in the sidebar — good.)

---

## Code Audit Findings (senior-dev cross-check)

**How it was checked:** cross-referenced every `onclick`/handler against defined functions, checked for references to removed elements, and simulated `admin.js`'s full init in a DOM stub.

- **A. No missing-function or init-crash bugs.** All `onclick` handlers resolve (logout is in `auth.js`, profile fns in `teacher.js`), and admin init runs to completion — so buttons are NOT dead from a JS error.

- **B. ROOT CAUSE of "many buttons not working": the data layer.** `js/db.js` points to an old Google Apps Script and writes with `fetch(..., { mode: 'no-cors' })`, which is opaque — the app can't detect success/failure and can't read data back from a write (reads happen only once at load). So Save/Add/Edit/Delete appear to "not work" because changes don't persist/return. **Fix (Antigravity): migrate the whole data layer to SUPABASE** (see Fixed context). Replace `db.js` entirely with the Supabase JS client doing real CRUD (insert/update/delete/select) with proper success/error responses, then surface those as toasts. This is the single change that makes the buttons reliably work.

- **C. MCQ Exams — verify & fix end-to-end** (create → assign → student takes → auto-grade → score saved), persisting to the new Exams sheet. (Currently doesn't persist → appears broken.)

- **D. Create Class / Class view empty.** Classes derive from the student `class` field, but seed students have no class value and the field doesn't persist to the backend, so the Class page always shows "No classes found." Ensure the `class` field saves to the sheet, the Class view populates, and class-incharge persists (ClassIncharge tab). Consider an explicit "manage classes" affordance.

- **E. Delete/action icon buttons** had an invisible white trash icon on a soft-pink background (already patched in CSS) — ensure this stays consistent across all tables after the premium redesign.

- **F. `css/style.css` has THREE stacked, conflicting style layers** (2 separate `:root` blocks with different `--primary-color` #000080 vs #1d4ed8; `.btn` and `.form-control` each defined twice; ~1731 lines). This is the real reason button/spacing/alignment looks inconsistent across pages. **Fix:** consolidate into ONE clean design system — a single `:root`, one definition per component (buttons, inputs, cards, tables, modals, tabs, badges) — keeping the current colors. Do NOT keep appending new layers.

- **G. MCQ timing (ties to #22).** `student.html` has `examTimer`, `startExamTimer`, `setInterval`, auto-submit. KEEP the countdown/auto-submit but make it **optional** (only when the exam has a duration set). Remove any start/end **availability window** so exams can be started anytime.

- **H. Exam assignment is coupled to the training-program link (ties to #21).** `studentExams()` finds exams via the student's program registrations. Once the program link is removed, define a new assignment model (all / by course / by class / manual) and rewrite `studentExams()` accordingly.

- **I. Heavy inline styles everywhere** make consistent premium styling hard and fight the stylesheet. Recommend moving repeated inline styles into shared classes during the redesign.

- **J. Leftover dead code** in `manage-training.html` (`renderSessions`, `renderStudentAttendance`, `populateSessionBatchDropdown`) after the tab removal — harmless but should be cleaned up.

---

## Animation Plan (to add — premium, tasteful, not flashy)

Add a cohesive motion layer (respect `prefers-reduced-motion`; keep current theme). Suggested set:

1. **Tab / page transitions** — content fades + slides up (~150–200ms) when switching sidebar tabs or inner tabs.
2. **Card & row entrance** — staggered fade-up for stat cards, table rows, and list cards on load.
3. **Buttons** — hover lift + shadow, active press (already partly there); optional subtle ripple on click for primary buttons.
4. **Modals** — scale+fade IN and OUT (currently only an entrance) with a backdrop fade.
5. **KPI / stat numbers** — count-up animation (0 → value) on dashboards and report summary cards.
6. **Attendance / progress bars** — animate width from 0 to the % on load (Student "Program Details", reports).
7. **Skeleton loaders** — shimmer placeholders for tables/cards while data loads from the Google Sheet (there's real network latency), instead of blank/empty flashes.
8. **Toast notifications** — slide-in success/error toasts for Save/Add/Edit/Delete (pairs with the new backend that can confirm writes).
9. **Sidebar** — active-item indicator slide + hover transition; logo subtle entrance.
10. **Micro-interactions** — smooth dropdown open, checkbox/badge state changes, hover on cards.
11. **Charts** — keep Chart.js built-in animations (already animate).

Keep durations short (120–250ms), easing consistent (e.g., cubic-bezier(.2,.8,.2,1)), and gate everything behind `@media (prefers-reduced-motion: reduce)` to disable for accessibility.
