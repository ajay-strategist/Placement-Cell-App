# Christ Placement Cell — Complete Features & Tab-by-Tab Guide

This is the full target feature set for the platform (current + planned), written for easy reading. Legend: ✅ = already in the app, 🆕 = planned/new.

---

## PART A — COMPLETE FEATURE LIST (by module)

### 1. Accounts & Roles
- ✅ Login for Student, Teacher, Admin
- 🆕 Two new roles: **Teacher Coordinator** and **Student Coordinator** (4 roles total)
- 🆕 4-tab login (Student / Student Coordinator / Teacher Coordinator / Admin)
- 🆕 Promote any teacher → Teacher Coordinator, any student → Student Coordinator
- 🆕 Capability-based permissions (who can do what)
- 🆕 Hardened auth: hashed/masked passwords, first-login reset, email password reset

### 2. Student Records
- ✅ Add / edit / delete students, search, filter by course & department
- ✅ Bulk upload via Excel + downloadable template
- 🆕 New **Class / Section** field (e.g. `1 BCA A`) — from Excel template + manual edit
- 🆕 View full student profile (training history, attendance, scores, placement status)
- 🆕 Resume / document upload per student
- 🆕 Placement-readiness score (attendance + scores + profile completeness)

### 3. Teacher Records
- ✅ Add / edit / delete teachers, search
- ✅ Coordinator flag ("Coord" badge)
- 🆕 Consistent coordinator badge + dedicated coordinators view/filter

### 4. Training Programs (core)
- ✅ Create / edit / delete programs, set venue/dates, target audience (all / course / department)
- ✅ Open/close registration, enable/disable feedback
- 🆕 **Programs list summary stats**: registered, batches, attended, completed
- 🆕 **Two completion modes per program**: by **Attendance %** or by **Marks** (or both)
- 🆕 Fix duration/days display and render rich-text description properly

### 5. Sessions & Attendance
- ✅ Add / edit / delete sessions, mark attendance, upload attendance via Excel
- ✅ Per-student attendance list (Present/Absent)
- 🆕 **Registered-only attendance** (non-registered can't be marked present)
- 🆕 **Live check-in: rotating 30-sec OTP + QR code**, student self-check-in, anti-proxy
- 🆕 Attendance % auto-calculated per student

### 6. Batches
- ✅ Create batches, manual assign, **auto-split** (by count or size)
- 🆕 Custom batch names (`Batch 1`, `BCA A`, …)
- 🆕 **Transfer a student** from one batch to another
- 🆕 **Assign an entire class** to a batch in one click
- 🆕 Batch-wise **"registered but not attended"** list + student count per batch
- 🆕 Inside-batch student detail (attendance %, marks, class)

### 7. Student Tracking (cross-program)
- 🆕 **Class-wise view**: per student — trainings registered, attended, not-attended, score
- 🆕 Filter by training program
- 🆕 **Highlight** students who never attended, or fall **below a threshold**
- 🆕 "Registered but not attended" lists everywhere relevant

### 8. MCQ Exam Engine 🆕
- **Question bank** (reusable, tagged by topic/difficulty)
- **All MCQ types**: single-correct, multiple-correct, true/false, fill-in-the-blank, match-the-following, assertion–reason, comprehension/passage, image-based, numeric
- Exam setup: total marks, marks/question, **negative marking**, **pass mark**, timer, start–end window, attempts, **randomize** questions & options
- Student exam-taking: eligibility check, countdown + auto-submit, anti-cheating (shuffle, single attempt, tab-switch warning)
- **Auto-grading** + instant results + answer review (if allowed)
- **Result analytics**: score distribution, pass/fail, question-level analysis
- Score feeds **mark-based completion**
- **External exam support**: upload offline marks via specified Excel template (map by RegNo)

### 9. Placement Activities & Recruitment
- ✅ Create placement activities & recruitment drives, target audience
- ✅ Selection **phases**, **selection funnel**, **student progress tracking**
- 🆕 **Company / recruiter master** (JD, CTC, role, location, eligibility, contacts)
- 🆕 **Eligibility-aware listing** (students see only drives they qualify for)
- 🆕 **Application tracker** (Applied → Shortlisted → Interview → Offer/Rejected)
- 🆕 Offer management + placement policy (e.g. 1 offer per student / dream company)

### 10. Calendar
- ✅ Month view of programs/activities

### 11. Dashboards & Analytics
- ✅ Placement status overview, training status overview
- ✅ Activity course-wise attendance, placed students by course & gender, placed-students table
- ✅ Per-program analytics (attended male/female, not-attended, gender/dept charts)
- 🆕 Institute dashboard (placement %, highest/avg/median CTC, recruiters, trends)
- 🆕 Training tracking reports + "below threshold / never attended" exports

### 12. Notifications 🆕
- In-app notification bell (unread count)
- Email (free via Google Apps Script) for new drives, sessions, deadlines, results
- WhatsApp — optional/paid, added later

### 13. Reviews & Feedback
- ✅ Students submit feedback/reviews per program; coordinators view them

### 14. Reports & Exports 🆕
- Export students, attendance, exam results, placement reports to Excel/PDF

### 15. System 🆕
- Settings (completion thresholds, placement policy, etc.)
- Audit log (who changed what)

---

## PART B — TAB BY TAB (per role)

### 🔵 ADMIN PORTAL
1. **Dashboard** — KPI cards (students, trainings, activities, recruitments); placement & training overview rings; attendance & placement charts; placed-students table.
2. **User Management**
   - *Manage Students* — records, filters, search, Excel upload/template, 🆕 Class field, 🆕 promote to Student Coordinator
   - *Manage Teachers* — records, search, 🆕 promote to Teacher Coordinator
   - 🆕 *Coordinators* — view/manage all coordinators
3. **Training** — programs list 🆕 with summary stats; create/edit/delete; open/close registration; per-program **Manage** opens:
   - Sessions & Attendance (✅ + 🆕 OTP/QR live check-in)
   - Students Attendance
   - Registered Students (🆕 transfer / assign-by-class)
   - Manage Batches (✅ auto-split + 🆕 named batches/transfer)
   - 🆕 **Exams** (create/grade MCQ + upload external marks)
   - Dashboard Analytics
   - Student Reviews
   - 🆕 Completion (attendance/marks mode + thresholds)
4. **Program Calendar** — month view.
5. **Placement Activities** — drives, phases, funnel, tracking; 🆕 companies, eligibility, offers.
6. 🆕 **Reports** — exportable reports.
7. 🆕 **Settings** — thresholds, policies, system config.
8. 🆕 **Audit Log**.

### 🟢 TEACHER COORDINATOR PORTAL
*(Same as Admin minus user-account management, Settings, and Audit edit.)*
1. **Dashboard**
2. **Students** (add/edit/manage, Class field) & **Teachers**
3. **Training** (full management incl. sessions, batches, 🆕 exams, completion)
4. **Placement Activities** (drives, phases, companies, offers)
5. **Program Calendar**
6. 🆕 **Reports**
7. 🆕 **Announcements**

### 🟡 STUDENT COORDINATOR PORTAL 🆕
*(Execution helper — run things, view everything, no create/delete of master records or user management.)*
1. **Dashboard** (view all analytics)
2. **Training** — manage **sessions, attendance (incl. OTP/QR), batches**
3. 🆕 **Exams** — run/proctor exams, upload external marks
4. **Placement Activities** — update phase results & attendance
5. 🆕 **Announcements** — post/relay
6. 🆕 **Reports** — view & export

### ⚪ STUDENT PORTAL
1. **My Dashboard** 🆕 — readiness score, upcoming sessions/exams, notifications
2. **Training Programs** — view & register
3. 🆕 **My Exams** — take MCQ exams, view scores
4. **Placement Activities** — view & register (🆕 eligibility-filtered)
5. 🆕 **My Applications** — application/offer tracker
6. **My Attendance**
7. 🆕 **My Resume / Documents**
8. **My Profile** — edit, security/password
9. 🆕 **Notifications**

---

*Companion docs: `FEATURE_PLAN.md` (rationale, data model, build phases) and `ISSUES.md` (bugs to fix).*
