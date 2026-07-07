# Antigravity Prompt — Christ Placement Cell (Today's Changes)

> Paste everything below the line into Antigravity. It covers: (1) migrate the database to **Supabase**, (2) today's **MCQ module changes**, (3) **animations**. The user has NO coding skills — you (Antigravity) must do everything end-to-end, including all backend/database setup, and give plain-language steps for anything the user must click.

---

## ROLE & CONTEXT
You are a senior full-stack + UI/UX engineer. You are modifying an existing web app called **Christ Placement Cell** (plain HTML/CSS/JS in this folder: `index.html`, `admin.html`, `student.html`, `teacher.html`, `coordinator.html`, `manage-training.html`, `css/style.css`, `js/db.js`, `js/auth.js`, `js/permissions.js`, `js/admin.js`, `js/teacher.js`). Keep the current visual theme (navy sidebar, royal-blue accent, Inter font). The user cannot code — do 100% of the work and explain any manual step (like pasting a key) in simple language.

Do NOT break existing working features. After each part, confirm the app still loads and every button works.

---

## PART 1 — MIGRATE DATABASE TO SUPABASE (do this first; it's the foundation)

We are **dropping Google Sheets / Google Apps Script entirely** and moving to **Supabase** (hosted Postgres with an auto REST API). This is the fix for the current bug where many Save/Add/Edit/Delete buttons "don't work" — the old code writes with `fetch(..., {mode:'no-cors'})`, which can't confirm or read back writes.

**What to do:**
1. **Provide the SQL schema** for the user to paste into the Supabase SQL editor. Create tables (use `uuid`/text primary keys and `jsonb` for nested data):
   - `students` — id, name, register_number (unique), phone, email, course, department, class, gender, password, is_coordinator (bool)
   - `teachers` — id, name, phone, email, department, password, is_coordinator (bool)
   - `training_programs` — id, name, description, venue, date, end_date, days, is_registration_open, is_feedback_open, target (jsonb), registrations (jsonb array of reg numbers), sessions (jsonb), batches (jsonb), feedbacks (jsonb)
   - `placement_activities` — id, name, venue, date, last_date, description, type, target (jsonb), registrations (jsonb), phases (jsonb — each phase includes qualified[] and eliminated[] student lists)
   - `exams` — id, title, duration, pass_mark, negative, questions (jsonb — each question: text, type, options[], correct[], marks, explanation)
   - `exam_attempts` — id, exam_id, register_number, answers (jsonb), score, passed (bool), submitted_at
   - `class_incharge` — class_name (unique), incharge
   - `admin` — a single-row table or keep the hardcoded admin (username `admin`, password `Admin@1234`) — your choice, but document it.
2. **Rewrite `js/db.js`** to use the Supabase JS client (`@supabase/supabase-js` via CDN) instead of Apps Script. Every read = `select`, every create = `insert`, update = `update`, delete = `delete`. Return real success/error so the UI can show toasts (see Part 3). Keep the same method names the rest of the app calls (getStudents, addStudent, updateStudent, deleteStudent, getTrainingPrograms, addExam, etc.) so you don't have to rewrite every page — just re-implement their bodies against Supabase (make them async and update callers to await where needed).
3. **Config:** read the Supabase **Project URL** and **anon key** from a single obvious place (e.g., top of `db.js` or a `config.js`). 
4. **Row Level Security:** set simple, working policies (documented) so the app functions for a non-technical operator. If using anon key only, enable the needed policies; explain the trade-off in plain language.
5. **Plain-language setup steps** for the user: how to create a free Supabase project, open the SQL editor and run your SQL, find the Project URL + anon key (Settings → API), and paste them into the config. Include seeding a couple of sample rows so screens aren't empty.

**Acceptance:** creating/editing/deleting students, teachers, training programs, batches, sessions, attendance, placement phases, and exams all persist in Supabase and survive a page reload, with a success/error toast each time.

---

## PART 2 — MCQ MODULE CHANGES (today's requirements)

Rework the **MCQ Exams** module (admin/teacher-coordinator side in `admin.js`/`admin.html`; student side in `student.html`) to this spec:

1. **Remove "Linked Training Program"** from the exam builder — exams are NOT tied to a training program anymore. Replace assignment with: **assign an exam to students by Course and/or Class** (multi-select), defaulting to **All students** if none chosen. Rewrite the student-side `studentExams()` so a student sees exams whose target matches their course/class (or "all").
2. **No availability restriction, but an OPTIONAL completion timer.**
   - **Attend anytime:** remove any start/end date window or scheduling restriction — the exam is always available to its assigned students until it is closed/deleted.
   - **Optional per-exam timer (KEEP this):** the exam creator can optionally set a **duration** (minutes to complete once the student starts). If a duration is set, show a countdown and auto-submit when it runs out. If left blank/off, there is no timer and the student can take as long as they want. So: timer optional, availability unrestricted.
3. **Remove "Upload External Marks"** and any external-marks flow. Marks are NOT used for program completion (program completion is **attendance-based only**). Keep the exam's OWN auto-graded **pass/fail result** for the exam itself (needed for the report) — just don't feed it into training completion. Also remove any "Score" columns in training reports that came from uploaded marks.
4. **Answer explanations after submit** — add an optional **Explanation** field per question in the exam builder. After a student submits, show a review: each question with the student's answer, the correct answer, and the explanation.
5. **Manage Exam (edit)** — add a "Manage/Edit" action per exam so an existing exam can be edited (title, duration, pass mark, questions/options/correct answers/explanations), not just created or deleted.
6. **Report button (must actually render a report)** — per-exam report listing students with **attempted / not-attempted** and **pass/fail**, plus a **Course filter** and **search by student name**.

Also (related report tweak): **remove the "Below Completion Threshold" option** from the Training Reports → Student-wise Report status filter (marks aren't considered). Keep: All Students / Registered but Not Attended / Completed.

**Acceptance:** create an exam → assign by course/class (or all) → a matching student sees and takes it any time → submits → sees per-question explanations and pass/fail → admin opens the exam Report and sees who attempted and passed, filterable by course and searchable by name. Everything persists in Supabase.

---

## PART 2.5 — UI FIX (#16): content overlaps the sidebar / horizontal overflow
On the Training page (and check all admin tabs), the white content panel is shifted left and **overlaps the dark sidebar** (covering the nav items) and the page shows a **horizontal scrollbar**. The main content isn't respecting the 250px fixed sidebar width. Fix the layout so content stays inside the main-content area with **no horizontal overflow or overlap** — check the tab/table container width, any negative margins, and `overflow-x`. Verify on every admin tab (Dashboard, User Management, Training, Class, MCQ, Calendar, Placement). Keep the current theme.

---

## PART 3 — ANIMATIONS (premium, tasteful, not flashy)

Add a cohesive motion layer. Keep the current theme. Gate everything behind `@media (prefers-reduced-motion: reduce)` (disable motion for accessibility). Durations short (120–250ms), consistent easing (e.g. `cubic-bezier(.2,.8,.2,1)`).

1. **Tab / page transitions** — content fades + slides up when switching sidebar tabs and inner tabs.
2. **Card & row entrance** — staggered fade-up for stat cards, table rows, and list cards on load.
3. **Buttons** — hover lift + shadow, active press; subtle ripple on click for primary buttons.
4. **Modals** — scale+fade IN and OUT with a backdrop fade (not just an entrance).
5. **KPI / stat numbers** — count-up animation (0 → value) on dashboards and report summary cards.
6. **Progress bars** — animate width from 0 to the % (Student "Program Details", reports).
7. **Skeleton loaders** — shimmer placeholders for tables/cards while Supabase data loads (avoid blank flashes).
8. **Toast notifications** — slide-in success/error toasts for every Save/Add/Edit/Delete (pairs with the Supabase responses from Part 1).
9. **Sidebar** — active-item indicator slide + hover transition; logo subtle entrance.
10. **Micro-interactions** — smooth dropdown open, checkbox/badge state changes, card hover.

*(Note: `css/style.css` has accumulated overlapping style layers. While adding animations, feel free to keep the current colors but avoid stacking yet another conflicting layer — prefer one consistent set of rules.)*

---

## DELIVERY
- Do it in the order above (Supabase first, then MCQ, then animations). Keep the app runnable after each part.
- For anything the user must do by hand (create Supabase project, run SQL, paste URL/anon key), give numbered, plain-language steps.
- After finishing, give a short summary of files changed and a simple test checklist the non-technical user can follow to confirm each part works.
