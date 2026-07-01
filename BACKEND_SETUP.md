# Backend Setup — Google Sheet + Apps Script (one-time)

The app works immediately in the browser (data cached locally). For the new fields to **persist to the cloud across devices**, make these one-time changes to your Google Sheet and Apps Script.

## 1. Students sheet — add a column
Add a header **`Class`** to the `Students` sheet (e.g., after `Department`). Existing rows can be left blank and filled later (manually or via the updated Excel template, which now includes a `Class` column).

A `scores` value (per-program exam marks) is also written to students. If your Apps Script writes by header, add a **`scores`** column too (it stores a small JSON like `{"TRN_001":78}`). If your Apps Script maps columns dynamically by object key, no change is needed.

## 2. New sheet: `ClassIncharge`
Create a sheet named **`ClassIncharge`** with headers: `className`, `incharge`.
The app upserts one row per class. (Until this exists, incharge still works and persists **locally** in the browser.)

## 3. Apps Script `save` handler
Your existing web app already handles `action=save` with `{sheet, data}`. Make sure it:
- **Upserts** `ClassIncharge` rows by `className` (update if the class already has a row, else append).
- Accepts the new `Class` / `scores` keys on `Students` rows.

If your `save` handler maps object keys to columns by matching header names, the new keys flow through automatically once the headers exist.

## 4. `readAll` handler
Have `readAll` also return the `ClassIncharge` tab, e.g. add to the response object:
```js
result["ClassIncharge"] = readSheetAsObjects("ClassIncharge");
```
The app reads `data["ClassIncharge"]` on load (falls back to local storage if absent).

## 5. New sheet: `Exams` (MCQ module — now built)
Create a sheet named **`Exams`** with headers: `id`, `title`, `programId`, `duration`, `passMark`, `negative`, `questions`.
The `questions` column stores a JSON array (question text, type, options, correct answers, marks). The app upserts by `id` and deletes by `id`. Have `readAll` also return this tab:
```js
result["Exams"] = readSheetAsObjects("Exams");
```
Student exam scores are written to the student **`scores`** map (step 1), so on-platform MCQ results and uploaded external marks both feed the per-program Score and marks-based completion.

Until the `Exams` sheet exists, exams still work and persist **locally** in the browser.
