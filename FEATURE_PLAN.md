# Christ Placement Cell — Feature Plan

A planning document covering what the app does today, what was recently added, the gaps, and a proposed full feature set with a build priority.

---

## 1. Current Architecture (what your teammate built)

| Layer | Technology |
|---|---|
| Frontend | Plain HTML + CSS + vanilla JavaScript (no framework) |
| Backend | Google Apps Script Web App (`script.google.com/.../exec`) |
| Database | Google Sheets (tabs: Students, Teacher, Training Program, Activity) |
| Auth | `sessionStorage` session + `localStorage` offline cache |
| Excel | SheetJS for bulk upload + template download |
| Charts | Chart library used on dashboards |

**Roles that exist in code today: 3** — Admin, Teacher, Student. (Login page has only these three tabs.)

**Roles you asked for: 4** — Admin, Teacher Coordinator, Student Coordinator, Student. So *Student Coordinator* and a distinct *Teacher Coordinator* permission level **do not exist yet** — this is the first gap to close.

---

## 2. Current Features (already in the folder)

### Admin (`admin.html` / `admin.js`)
- **Dashboard** — placement % overview, training % overview, activity course-wise attendance chart, "placed students by course & gender" chart, placed-students table with filters.
- **Student management** — add / edit / delete, search, filter by course & department, **Excel bulk upload + template download**.
- **Teacher management** — add / edit / delete, search.
- **Training management** — create / edit / delete programs, set target audience, add sessions, mark attendance, program calendar.
- **Placement management** — placement activities & recruitment drives; create/edit; **selection phases**; **selection funnel**; **student progress tracking** (Overview & Funnel / Phases / Student Tracking sub-tabs).
- **Calendar** — month view of programs.

### Student (`student.html`)
- View & **register** for Training Programs.
- View & **register** for Placement Activities.
- **My Attendance** view.
- **My Profile** with edit + password/security update.
- **Submit feedback / reviews**.

### Teacher (`teacher.html` / `teacher.js`)
- **Dashboard** (placement %, training %, placed table, activity attendance chart).
- **Program calendar**.
- Largely **read-only / monitoring** today.

### ⭐ NEW feature (added Jun 24 — `manage-training.html`)
A dedicated training-management workspace with six tabs:
1. **Sessions & Attendance** — create sessions, filter by batch.
2. **Students Attendance** — per-student attendance, batch filter.
3. **Registered Students** — list, batch filter, bulk assign.
4. **Manage Batches** — manual assign **+ Auto-Split** (by number of batches or by max size).
5. **Dashboard Analytics** — attended male / female / not-attended counts, batch filter.
6. **Student Reviews** — view feedback collected per program.

This batch + per-program analytics layer is the newest and most advanced part of the app.

---

## 3. Gaps & Weaknesses (honest assessment)

- **Missing roles** — no Student Coordinator, no Teacher Coordinator privilege tier.
- **Security** — passwords stored in plain text in Sheets; client-side login check; anyone can read the Apps Script data. Fine for a prototype, risky for real student data.
- **No notifications** — students aren't alerted to new drives, sessions, or deadlines (no email/SMS/in-app).
- **No resume / document handling** — placement cells live on resumes; there's no upload/store/share.
- **No company / recruiter management** — drives exist, but companies aren't first-class records (JD, eligibility criteria, package/CTC, contacts).
- **No eligibility automation** — eligibility (CGPA, backlog, branch, package cap "1 offer per student") is manual.
- **No reporting/export** — no PDF/Excel placement reports for management.
- **No audit trail** — no record of who changed what.
- **Limited teacher role** — mostly view-only; coordinators need to *act*.

---

## 4. Proposed Full Feature Set ("the best app")

### A. Foundation (cross-cutting)
- **4-role access control**: Admin → Teacher Coordinator → Student Coordinator → Student, with clear permission boundaries.
- **Notifications**: in-app bell + **email (free via Google Apps Script, ~1,500/day on a Workspace account)** for new drives, session schedules, deadlines, results. **WhatsApp is optional and paid** — needs a BSP (AiSensy/2Factor etc.), Meta template approval, and ~₹0.11–0.15 per utility message + GST; recommended as a Phase-3 add-on, not for v1.
- **Audit log** of key actions (who edited a student, changed a result, etc.).
- **Global search** across students, companies, drives.
- **Stronger auth**: hashed passwords, forced password reset on first login, OTP/email reset.

### B. Admin
- Everything today **plus**: manage coordinators & assign their scope (department/batch), company/recruiter master, placement-policy settings (e.g. max offers per student, min CGPA), institute-wide reports & exports (PDF/Excel), backup/restore, audit log viewer.

### C. Teacher Coordinator
- Owns one or more **departments/batches**: approve student profiles, manage training programs & attendance for their scope, monitor at-risk/unplaced students, post announcements, generate department placement reports.

### D. Student Coordinator (student leader)
- Help-desk role: post/relay announcements, assist registrations, mark on-ground attendance for drives, collect feedback, raise queries to coordinators, view (not edit) progress dashboards for their group.

### E. Student
- Everything today **plus**: **resume/document upload**, **eligibility-aware drive listing** (only see drives they qualify for), **application tracker** (applied → shortlisted → interview → offer), offer letters & status, interview schedule with reminders, **placement readiness score** (training attendance + feedback + profile completeness), company browser with JD/CTC, query/ticket to coordinators.

### F-0. Activity Attendance — Registered-Only + Live OTP / QR (NEW requirement)
- **Registration gate**: a student can be marked present for an activity/session **only if they are registered** for it. Non-registered students cannot check in.
- **Live check-in code**: the coordinator opens a session and the screen shows a **QR code + a 6-digit OTP that rotates every ~30 seconds**. (Rotating codes stop a student sharing one code with friends who aren't in the room.)
- **Student check-in**: student scans the QR (or types the current OTP) inside their portal → system verifies (a) they're registered and (b) the code is the currently-valid one → marks them present with a timestamp.
- **Coordinator live view**: real-time count of who has checked in vs. registered-but-absent; manual override (mark present/absent) still available as a fallback.
- **Anti-proxy**: code expires in 30s; optional one-device-per-student and check-in window (e.g. only valid for first 15 min of session).

*Stack note:* QR can be generated client-side with a small JS QR library; the rotating OTP is derived from a session secret + current 30s time-window (TOTP-style) so the student's code is validated against the server (Apps Script) without storing every code.

### F. Recruitment / Drive Engine
- Company master (JD, CTC, eligibility, role, location, contacts).
- Eligibility rules auto-filter eligible students.
- Multi-phase pipeline (Applied → Aptitude → Technical → HR → Offer) with per-phase attendance and results.
- Offer management + "1-offer-per-student" / dream-company policy enforcement.
- Selection funnel & conversion analytics per company.

### F-1. Training Module 2.0 — full student tracking (NEW, high priority)
The core ask: **track every student completely across all training programs** — who registered, who actually attended, who's falling behind, organized by batch and by class. Breaks into four layers:

**(a) Training Programs list page — summary stats per program**
Each program row/card shows at a glance:
- No. of Registered Students
- No. of Batches
- No. of Attended Students (attended ≥1 session, or per the completion rule)
- No. of Completed Students (met the completion threshold — see open question)

**(b) Per-program student data**
- Student table with **Attendance %** (sessions attended ÷ total sessions) and **Marks/Score**.
- A clear **"Registered but Not Attended"** list (registered, 0 attendance).
- **Batch-wise Not-Attended view**: for each batch, who registered but didn't attend, plus a count of students per batch.

**(c) Batch management (upgraded)**
- Create named batches — free text like `Batch 1`, `Batch 2`, **or** `BCA 1`, `BCA A`, etc.
- Inside a batch: see each student's details (attendance %, marks, class).
- **Transfer a student to another batch** (move, with the from→to logged).
- **Assign batch by Class** — bulk-assign all students of a class (e.g. `1 BCA A`) into a batch in one action.

**(d) Class-wise tracking (new "Class" dimension)**
- Introduce a **Class / Section** field on every student, e.g. `1 BCA A`, `2 BCA B`, `1 BCom A`.
- A class-wise view listing students with: Name, **No. of Trainings Registered**, **No. of Trainings Attended**, **No. Not Attended**, **Score**.
- **Filter by Training Program.**
- **Highlight** students who attended **no program at all**, or who fall **below a configurable threshold** (e.g. attended fewer than N programs / below X% attendance) — so coordinators instantly see who to chase.

**Data-model additions this requires:**
- Student record: add `class` (e.g. "1 BCA A") and optionally `year`/`semester`.
- Training Program: per-registered-student **marks/score** and a **completion flag** (or derive completion from attendance %).
- Batch: already exists (`batches[]` with `students[]`); add transfer support and class-based bulk assign.
- Attendance: already per-session; compute % from sessions attended ÷ total sessions in the program (or in the student's batch, if sessions are batch-specific).

**Decisions (confirmed):**
1. **Completion has TWO modes — set per training program:**
   - **Attendance-based** — Completed when attendance ≥ a configurable threshold % (default 75%, editable).
   - **Marks-based** — Completed when the student's score ≥ a configurable pass mark. Used for trainings that end in an exam/test.
   - (A program can optionally require **both** attendance AND marks.) The coordinator picks the mode when creating/editing the program.
2. **"Score/Marks" = one final score per student per program**, and that score can come from **either**:
   - an **on-platform MCQ exam** (auto-graded — see Section F-2), or
   - an **external/offline exam** whose marks are **uploaded via a specified Excel template** (mapped to students by register number).
3. **Class/Section source = Excel upload + manual.** Add a `Class` column to the bulk-upload template AND allow editing the class per student in the UI.

### F-2. MCQ Exam Engine (NEW — on-platform tests + external marks upload)
Conduct MCQ exams inside the platform, auto-grade them, and feed the score into mark-based training completion. Also support exams held **outside** the platform by uploading marks via template.

**Two exam sources (both produce a final score per student per program):**
- **On-platform exam** — student takes the MCQ test in their portal; auto-graded instantly.
- **External/offline exam** — coordinator uploads marks via a **specified Excel template** (columns e.g. `RegNo, Score, MaxScore`); system maps by register number and records the score.

**MCQ question types supported (all types):**
- Single-correct (one right answer / radio)
- Multiple-correct (more than one right / checkboxes)
- True / False
- Fill-in-the-blank (short text, auto-graded against accepted answers)
- Match the following
- Assertion–Reason
- Comprehension / passage-based (a passage with several sub-questions)
- Image-based questions (question and/or options include an image)
- Numeric answer (exact or within a tolerance)

**Exam authoring (Admin / Coordinator):**
- **Question bank** reusable across exams; tag by topic/difficulty.
- Create an exam, attach it to a training program; set total marks, marks per question, **negative marking**, **pass mark**, duration/timer, start–end window, and number of attempts.
- **Randomize** question order and option order per student; optional pick-N-from-pool.
- Import questions via Excel template; preview before publishing.

**Taking the exam (Student):**
- Only **registered/assigned** students can attempt; eligibility + exam window enforced.
- Countdown timer with **auto-submit**; resume-safe if connection drops.
- Anti-cheating: shuffled questions/options, single attempt, optional tab-switch/full-screen-exit warnings, one-device lock.

**Grading & results:**
- Auto-grade objective types instantly; show score (and review answers if the coordinator allows).
- **Result analytics**: score distribution, pass/fail counts, average, and **question-level analysis** (which questions most got wrong).
- Score flows into the program's **mark-based completion** automatically.
- Export results to Excel.

**Data-model additions:**
- `Questions` (bank): `{id, type, text, media, options[], correct[], marks, topic, difficulty}`.
- `Exams`: `{id, programId, title, totalMarks, passMark, negativeMark, durationMin, startAt, endAt, attempts, randomize, questionIds[]/pool}`.
- `ExamAttempts`: `{id, examId, regNo, answers, score, submittedAt, status}`.
- External marks upload reuses the score field on the program registration.

### G. Analytics & Reporting
- Institute dashboard: placement %, highest/avg/median CTC, recruiters count, branch-wise & gender-wise breakdown, year-on-year trend.
- Training effectiveness: attendance vs. placement correlation.
- **Training tracking reports**: per-program and class-wise attendance/score exports; "students below threshold" / "never attended" lists exportable to Excel for follow-up.
- Exportable reports (PDF/Excel) for NAAC/NBA/management.

---

## 5. Suggested Build Priority

**Phase 1 — Close the role gap (you asked for this first)**
1. Add Student Coordinator + Teacher Coordinator roles + login + permission scoping.
2. Department/batch scoping so coordinators only see their students.

**Phase 2 — Training Module 2.0 (full student tracking — top priority per latest requirements)**
3. Add `class`/`section` to students (+ Excel template column); add marks/score + completion flag to program registrations.
4. Training Programs list summary stats (registered / batches / attended / completed).
5. Per-program student table with attendance % + marks + "registered but not attended".
6. Upgraded batches: named batches, transfer student between batches, assign-by-class, batch-wise not-attended view.
7. Class-wise tracking view (trainings registered/attended/not-attended/score, filter by program, highlight never-attended / below-threshold).
8. Two-mode completion (attendance / marks) + external marks upload template.

**Phase 2.5 — MCQ Exam Engine (Section F-2)**
9. Question bank + exam authoring (all MCQ types, randomize, negative marking, timer).
10. Student exam-taking flow (eligibility, timer, auto-submit, anti-cheat) + auto-grading.
11. Result analytics + score feeds mark-based completion.

**Phase 3 — Make it useful day-to-day**
12. **Registered-only attendance with live rotating OTP + QR check-in for activities** (Section F-0).
13. Notifications (in-app + email).
14. Resume/document upload for students.
15. Company/recruiter master + eligibility-aware drive listing.
16. Student application tracker.

**Phase 4 — Make it impressive for management**
17. Offer management + placement-policy enforcement.
18. Institute analytics + exportable PDF/Excel reports (incl. training tracking exports).
19. Audit log + hardened auth.

---

---

## 6. Role Model (decided)

Four roles, **full access for both coordinators** (no department/batch scoping — every coordinator can act on every student). Hierarchy is by *capability*, not by data slice:

| | Admin | Teacher Coordinator | Student Coordinator | Student |
|---|---|---|---|---|
| Manage other users (add/edit/delete admins & coordinators) | ✅ | ❌ | ❌ | ❌ |
| Add / edit / delete students | ✅ | ✅ | ❌ | ❌ |
| Add / edit / delete teachers | ✅ | ✅ | ❌ | ❌ |
| Bulk Excel upload of students | ✅ | ✅ | ❌ | ❌ |
| Create / edit / delete training programs | ✅ | ✅ | ❌ | ❌ |
| Manage sessions, batches & attendance | ✅ | ✅ | ✅ | ❌ |
| Create / edit / delete placement drives | ✅ | ✅ | ❌ | ❌ |
| Manage selection phases & results | ✅ | ✅ | ✅ (mark/update only) | ❌ |
| Company / recruiter master | ✅ | ✅ | view | ❌ |
| Post announcements / notifications | ✅ | ✅ | ✅ | ❌ |
| View all dashboards & analytics | ✅ | ✅ | ✅ | own only |
| Export reports (PDF/Excel) | ✅ | ✅ | ✅ | ❌ |
| Placement-policy & system settings | ✅ | ❌ | ❌ | ❌ |
| Audit log | ✅ | view | ❌ | ❌ |
| Register for drives/training, upload resume, track applications | ❌ | ❌ | ❌ | ✅ |

**One-line summary of each role**
- **Admin** — owns the system: users, settings, policy, full data, audit.
- **Teacher Coordinator** — full operational control of students, training & drives; cannot manage other staff accounts or system settings.
- **Student Coordinator** — execution helper: runs attendance, updates phase results, posts announcements, views everything; cannot create/delete core records or manage users.
- **Student** — self-service: register, upload resume, track own applications and progress.

## 7. Screen Map (what each role sees)

**Login** — one page, 4 tabs (Student / Student Coordinator / Teacher Coordinator / Admin). Student Coordinators log in with their student credentials + elevated role flag; Teacher Coordinators with phone+password.

**Admin portal** — Dashboard · User Management (Admins/Coordinators, Students, Teachers) · Training · Placement/Drives · Companies · Calendar · Reports · Settings · Audit Log.

**Teacher Coordinator portal** — Dashboard · Students · Teachers · Training · Placement/Drives · Companies · Calendar · Reports · Announcements.

**Student Coordinator portal** — Dashboard · Training (sessions/attendance/batches) · Drives (mark phase results & attendance) · Announcements · Reports (view/export). No create/delete of master records.

**Student portal** — My Dashboard (readiness score) · Training Programs · Placement Drives (eligibility-filtered) · My Applications (tracker) · My Attendance · My Resume/Documents · My Profile · Notifications.

## 8. Open Questions for Later
- Student Coordinator login: reuse the student account with a flag, or a separate account list? (Recommend: flag on the student record.)
- Notification channel: in-app only first, or add email immediately?
- Resume storage: Google Drive folder via Apps Script (fits current stack) vs. another store.

---

*This is the refined plan. When you're ready to build, we start at Phase 1 (the two new roles) using the permission matrix in Section 6.*
