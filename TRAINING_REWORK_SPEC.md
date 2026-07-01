# Training & Class Module — Rework Spec (from requirements)

Captured from the latest requirements. ⚠️ = needs clarification (see bottom).

## 1. Training Page (Admin list)
Training Program table columns:
`Program | Date & No. of Days | Registration Status | No. Registered | No. Attended | No. Not Attended | No. Completed | Actions`
*(Venue dropped from this table per the column list.)*

## 2. Manage Program page (manage-training.html) — tabs

### Registered Students Tab
- **Overview cards**: No. Registered · No. Batches · No. Assigned · No. Not Assigned
- **Details table**: Reg No · Name · Department · Course · Batch

### Manage Batch Tab
- **Auto-assign methods (4)**: by Number of Batches · by Max students per batch · **by Class** · **by Department**
- **Created batches list** — each batch shows: No. of Students, No. of Attended Students, **Details** button
  - **Details popup** (per student): Reg No · Name · Course · Attendance · Score · **Transfer to another batch**
- Each batch has an **expandable dropdown** to:
  - Create **Sessions** with **Date, Time, Venue**  ⚠️ (sessions become per-batch, sessions gain a Venue field)
  - Show **Attendance %**, **No. of Not Attended Students** (→ popup listing not-attended names)

### Dashboard Analytics Tab — keep as is.

### Report Tab
- Metrics: No. Registered · Batches · Attendance % · No. Not Attended · Completed
- Filters: existing + **Batch filter** (add)

### Student Review Tab — keep as is.

## 3. NEW Main Tab: "Class"  ⚠️ (placement: portal-level nav vs sub-tab?)
- A **card per class**. Page filters: Course, Department, **Year** ⚠️
- **Class card** shows: Class Name · **Class Incharge** ⚠️ · No. of Students
- Card-level metric filters: No. Registered, No. Attended, Not Attended, etc.
- **Two reports:**
  - **Report 1** (student-wise): Reg No · Student Name · #Trainings Registered · #Attended · #Not Attended · #Completed · **Details** (per-program breakdown)
  - **Report 2** (program-wise): filter by Program + Registration Status → Student Name · Registration Status; **show Registered first, then Not Registered**

## 4. Student portal change
- Replace the **"My Attendance"** tab with **"Program Details"** — showing the student's program details ⚠️ (exact content to confirm).

---

## Data-model implications
- Students need a **Class/Section** field (e.g., `1 BCA A`) — already planned.
- Students need a **Year** (new) — or derive from class name. ⚠️
- A **Class → Incharge (teacher)** mapping (new). ⚠️
- Sessions gain a **Venue** field and become **batch-scoped**. ⚠️
- **Score** per student per program (already planned) — needed for batch Details popup & "Completed". ⚠️ (no score-entry UI exists yet)

## Decisions (confirmed)
1. **Class tab = new MAIN nav item** in Admin + Coordinator portals (portal-level, across all programs).
2. **Class Incharge = manual** — assign a teacher per class in the UI (Class→Teacher mapping, editable).
3. **Year = derived from Class name** (e.g., `1 BCA A` → Year 1). No new field.
4. **Score comes from exams, two sources:**
   - **NEW MAIN TAB: "MCQ"** — Admin & Teacher Coordinator can **create and assign** MCQ exams; on-platform auto-graded score feeds completion.
   - **External exams** — upload marks via Excel template (map by Reg No).
   - **Completion** is therefore: attendance-based (default) OR marks-based (when a training uses MCQ/external marks), set per program.

## Confirmed scope additions
- **MCQ main tab** (Admin/Teacher Coordinator create & assign exams; students take them; auto-grade → score).
- **External marks Excel upload** per program.
- **Class main tab** (cards + incharge + 2 reports).
- **Student field: Class** (Excel + manual); **Year** derived from it.
- **Sessions**: add Venue; created per batch.
- **Score**: per student per program, populated by MCQ or Excel upload.
