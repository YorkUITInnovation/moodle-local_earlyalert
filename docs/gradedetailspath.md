# `[gradedetails]` placeholder path (local_earlyalert)

`[gradedetails]` is a literal token in an etemplate message. It is replaced by
`helper::replace_grade_details_placeholder()` with `(Details: <assignment names joined by ', '>)`.
etemplate's `email::replace_message_placeholders()` does not know the token and passes it through unchanged,
so earlyalert replaces it as a separate step **after** the etemplate placeholders.

## Key code

| Piece | Location |
|---|---|
| Replace / format / normalize | `classes/helper.php` (`replace_grade_details_placeholder`, `format_grade_details_text`, `normalize_grade_details`) |
| Compose / per-student preview | `classes/external/course_grades_ws.php::get_student_preview_template` |
| Save log + initial snapshot | `classes/external/record_log_ws.php` |
| Send + final snapshot | `classes/task/process_mail_queue.php` |
| Saved-alert preview (course overview AND student lookup) | `classes/external/course_overview_ws.php::get_message` |
| Log model | `classes/email_report_log.php` (`get_grade_details`, `get_subject_snapshot`, `get_message_snapshot`) |
| JS | `amd/src/filter_students_grade.js` (compose), `amd/src/course_overview_updating.js` (saved preview) |

## Stored data (`local_earlyalert_report_log`)

- `grade_details_json`: `{"assignments":[...], "average_type":"any|average|weighted"}`
- `subjectjson` / `messagejson`: snapshots with `raw` (placeholders intact), `rendered`, `values`, `context`, `resolvedat`
  - `values`: `grade_details`, `assignmenttitle`, `custommessage`, `grade`
  - `context`: `courseid`, `instructorid`, `assignmentname`
- `snapshot_status`: `pending` -> `sent` / `failed`

## Flow

1. **Compose preview** (step 3 and per-student preview)
   - JS calls `local_earlyalert_get_student_preview_template` with the current `grade_details_json` from UI state.
   - Server: `email::replace_message_placeholders` -> `helper::replace_grade_details_placeholder`.
   - Returns `message` (rendered) and `raw_message` (token intact).
2. **Save** (`record_log_ws::insert_email_log`)
   - Normalizes and stores `grade_details_json`.
   - Writes the initial snapshot: `raw` = JS `raw_message`, `rendered` = JS `message`, status `pending`.
3. **Send** (`process_mail_queue`)
   - Rebuilds the body from the template message, then applies etemplate placeholders and `[gradedetails]`.
   - Overwrites the snapshots: `raw` = template message (token intact), `rendered` = final body. Status becomes `sent` or `failed`.
4. **Course overview and student lookup "preview message"**
   - Both screens use `.btn-early-alert-preview-message` and the same AMD module `course_overview_updating`.
   - It calls `local_earlyalert_get_message` -> `course_overview_ws::get_message`, which renders `local_earlyalert/preview_student_email`.
   - `get_message` logic:
     1. Details come from `$LOG->get_grade_details()` (`grade_details_json`), falling back to snapshot `values['grade_details']`.
     2. If snapshots exist, it rebuilds from `raw` using the snapshot `values`/`context` through `email::replace_message_placeholders`, then `replace_grade_details_placeholder`.
        It no longer trusts the saved `rendered` text.
     3. If the details text is still missing from the result and `raw` exists, it replaces the token directly in `raw` as a last resort.
     4. If there are no snapshots (legacy rows), it loads the `local_et_email` template by `templateid` and runs the same two replacements.

So both screens read the saved `grade_details_json` and snapshot at view time. They do not use live JS state.

## Fallback rules

- Empty assignments list: `[gradedetails]` renders as an empty string. The assignment title is NOT used as a fallback.
- Nothing available: the token is replaced with an empty string.

## Known risks / things to check

- **Pending rows** depend on JS `raw_message` being the token-intact text. An older JS build that sends the replaced text as `raw_message` leaves no token, so no details can be rebuilt. Sent rows are fine, because `process_mail_queue` stores the template text as `raw`.
- The last-resort fallback (step 3) replaces from `raw` without other placeholder substitution.
- `record_log_ws` defaults `assignment_name` to `0` when missing. This can show "Details: 0" in the course-level fallback. Treat `0` as empty if it appears.
- `gradedetails_*` lang strings exist only in `lang/en`. There are no `fr` strings.

## Debug checklist

1. Check `grade_details_json` for the log id is non-empty.
2. Check that `messagejson.raw` contains `[gradedetails]`.
3. Check `snapshot_status` and that `messagejson.rendered` contains `(Details: ...)`.
4. Purge caches / rebuild AMD if the JS payload looks stale.

