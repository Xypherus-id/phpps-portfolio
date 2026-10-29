# PHPPS Holistic Student Portfolio: Prototype Brief

## Who I am and how to work with me

I am Idris, Year Head and Science HOD at a Singapore primary school. I am not a professional developer, but I am comfortable with Google Sheets and Google Apps Script. Explain decisions in plain language, build in small steps, and show me something working at the end of every milestone before moving on.

Writing conventions for anything I will read (UI text, docs, messages): formal, clean prose; no em dashes or hyphens used as dashes; no contractions; no emojis.

## What we are building

A working prototype of a P1 to P6 online student portfolio, scoped to ONE class with FAKE data. The full vision: every student keeps one portfolio across six years combining holistic growth (goals, check-ins, reflections, evidence) with academic learning (subject score targets, results and reflection on the gap). Teachers view and give feedback; leaders analyse by class, level and school; everything updates live.

The prototype exists to (1) let my school leader see and click through the experience, (2) test the data model and access rules, and (3) inform the choice of final platform (Google Sheets plus Apps Script, AppSheet, or a commercial tool).

## Hard rules

1. **Fake data only.** Never use real student or staff names. Generate fictional names. No NRIC or Birth Certificate numbers anywhere.
2. **Keep the data layer swappable.** Store data in tables that mirror the data model below exactly, so they can later become tabs in a Google Sheet. Put all data access in one module.
3. **Enforce the access matrix in code, not just in the UI.** Every data request checks the current user's role and scope.
4. **AI feedback is draft only.** AI drafts are created with release_status Draft and source "AI draft"; a teacher must approve before a student sees it. Only initials and student_id are ever sent to an AI service.
5. **Sensitive free text is scanned.** Any response to a prompt marked sensitive gets a scan_status. For the prototype, a simple keyword check is enough, clearly labelled as a placeholder.

## Stack (agreed)

**Google Sheets as the database, an Apps Script web app as the main front end, AppSheet as an optional comparison front end on the same Sheet.** This replaces the original Node.js suggestion: nothing needs installing on a school laptop, and the prototype tests the likely final platform directly.

- The Sheet is "PHPPS Portfolio Prototype (fictional data)" in the owner's Drive (id 1Aac9GIVfqO1Z9OYJs-6O58QuD-rfGrepYG_Y081xpos). `Seed.gs` > setupDemoData fills or resets it.
- The Sheet holds the eight tables as eight tabs, one per table, with the exact column names below. Only the owner (Idris) has access to the Sheet itself. Teachers and students reach data only through the web app, which runs as the owner and enforces the access matrix in server-side script.
- The Apps Script project is bound to the Sheet (Extensions > Apps Script). Source files live in `apps-script/` in this repository and are pasted into the Script editor.
- All Sheet reads and writes go through `Data.gs`. All permission decisions go through `Access.gs`.
- `dev/` holds a local harness that runs the same `.gs` files in Node.js against the seed data, for automated tests and screenshots. It is a development aid only.
- No real login: a **role switcher** at the top of the screen ("View as" role, then person). Identity is the person; the selected role is the role they are acting in. A real deployment would use Google sign-in and combine all of a person's roles.
- One-click **Export to Excel (.xlsx)** with access rules applied (Milestone 6).

## Decisions taken (October 2026)

1. Feedback.source values: Written by teacher, AI draft, AI draft approved.
2. Feedback.release_status: Draft (not checked), Approved (checked by a teacher, not yet visible), Released (visible to the student). A teacher's own comment may go straight to Released.
3. SENO and AYH are added to StaffRoles roles and seeded. SENO scope is School; SENO sees support_flags only, no portfolio sections.
4. Student IDs keep the form S2027-0001 as specified (a series label). entry_year is 2024 because a P4 student in 2027 entered P1 in 2024.
5. Feedback and Evidence gain two extra columns at the end: year and created_at.
6. Feedback.target_record uses the form `Table:ID` (for example `Academic:A0012`) or `Section:My Growth`.
7. "A (academic goals only)" means goal prompts with domain Academic plus Academic table rows, limited to the viewer's own subject.
8. Level Manager has no access to check-ins in the prototype (referral by the Year Head is a later feature).
9. Safety scan: on submit, a keyword match sets Flagged, otherwise Cleared. The level Year Head or School Leader can clear a Flagged item. Flagged text is hidden from everyone else, including the Form Teacher.
10. AI input: initials and student_id as identifiers, plus non-sensitive response text with capitalised names removed. Sensitive check-in answers are never sent.

## Fake data to seed

- One class: **4F1**, level P4, year 2027, 30 students with fictional, Singapore-plausible names, initials and student_ids in the form S2027-0001.
- Staff (fictional): 1 Form Teacher (also teaches English), subject teachers for Mathematics, Science and Mother Tongue, 1 Year Head (P4), 1 Level Manager (P4), 1 Assistant Year Head (P4), 1 Science HOD, 1 SENO, 1 School Leader, 1 System Admin.
- Prompts: about 12 coded prompts covering all six sections, including multiple choice, scale, short text, long text and photo types. Mark wellbeing check-in prompts as sensitive.
- Responses: Start of Year goals and Term 1 end reflections for most students; leave about 5 students incomplete so the "not yet submitted" view can be tested.
- Academic: targets, process goals and actual scores for English, Mathematics, Science and Mother Tongue for WA1, with a mix of students above and below target. Some gap reflections filled in.
- Evidence: a handful of placeholder images with captions.
- Feedback: a few released teacher comments, plus a few drafts awaiting approval.
- Include 2 or 3 responses that trigger the placeholder safety scan, so the Flagged workflow can be demonstrated.

## Portfolio sections

| Section | Holds | Written by | Starts at |
| --- | --- | --- | --- |
| About Me | Strengths, interests, values | Student | P1 |
| My Goals | Academic, character and personal goals for the year | Student | P1 (score targets from P3) |
| Check-ins | Termly multiple-choice and text entries on wellbeing | Student | P1 |
| My Learning | Subject targets, results, gap reflections | Student; results imported | P3 (learning goals in P1 and P2) |
| My Growth | Photos and records of work, CCA, VIA, achievements | Student | P1 |
| Feedback | Teacher comments across sections, kept across years | Staff | P1 |

Every score target must be paired with a process goal ("What I will do").

## Data model (eight tables, all linked by student_id)

**Students**: student_id, google_account, display_name, initials, entry_year, status (Active, Transferred out, Graduated), support_flags (restricted).

**Enrolments**: enrolment_id, student_id, year, level, class, start_date, end_date.

**StaffRoles**: staff_email, staff_name, year, role (Form Teacher, Subject Teacher, YH, AYH, HOD, LM, SENO, School Leader, Admin), scope_type (Class, Level, Subject, School), scope_value, subject.

**Prompts**: prompt_code, section, domain (Character, Academic, Personal, Wellbeing), prompt_text, response_type (Multiple choice, Scale, Short text, Long text, Photo), options, levels, cycle (Start of year, Term 1 end to Term 4 end, End of year), sensitive (Yes or No).

**Reflections**: response_id, student_id, year, cycle, prompt_code, response_value, response_text, submitted_at, scan_status (Not needed, Pending, Cleared, Flagged).

**Academic**: record_id, student_id, year, level, subject, assessment (WA1, WA2, EYE), target_score, process_goal, actual_score, max_score, gap_reflection, learning_goal.

**Evidence**: evidence_id, student_id, section, file_path, caption, linked_goal, year, created_at.

**Feedback**: feedback_id, student_id, target_record, author_email, author_role, comment_text, source (Written by teacher, AI draft, AI draft approved), release_status (Draft, Approved, Released), year, created_at.

Principles: one row per response (long format); prompts are coded and reused across years; class membership lives in Enrolments, never on the student; views are filters on live data, never copies.

## Access matrix

E = create and edit own entries; V = view; C = view and give feedback; A = academic goals only; None = no access.

| Role | Scope | About Me | My Goals | Check-ins | My Learning | My Growth | Feedback | Export |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Student | Own portfolio | E | E | E | E | E | V (Released only) | None |
| Form Teacher | Own class | C | C | C | C | C | E (own) | Own class |
| Subject Teacher | Own classes, own subject | V | A | None | C (own subject) | V | E (own) | Own classes, own subject |
| Year Head / AYH | Own level | C | C | C | V | C | E (own) | Own level |
| Level Manager | Own level | V | V | None (YH referral) | V | V | V | Own level |
| HOD | Own subject, all levels | None | A | None | V (own subject) | None | V (own subject) | Own subject |
| School Leader | Whole school | V | V | V | V | V | V | Whole school |
| System Admin | Structure only | None | None | None | None | None | None | Rosters and roles |

Additional rules: Flagged check-in text is visible only to the level Year Head and School Leader until cleared; support_flags visible only to YH, SENO and School Leader; exports use initials and student_id except a Form Teacher exporting their own class; students never see other students.

## Milestones (build and demo one at a time)

1. **Foundation.** Project setup, database, the eight tables, seed script with fake data, role switcher. Demo: I can switch roles and see a list of students.
2. **Student experience.** A child-friendly portfolio page with the six sections; submit goals, multiple-choice and scale answers, reflections, and a photo upload. Demo: a student completes Start of Year goals.
3. **Form teacher view.** Class dashboard (who has submitted, who has not), drill into any student's full portfolio, write feedback. Demo: I review 4F1 and comment on three portfolios.
4. **Access rules.** Enforce the matrix for every role, with automated tests that prove, for example, that a Mathematics teacher cannot see check-ins and a student cannot see another student. Demo: I switch roles and see the differences.
5. **Academic layer.** Targets with process goals, bulk import of actual scores from a CSV, gap reflections, and a simple class view of target versus actual by subject.
6. **Export and analysis.** Export to .xlsx by class with the access rules applied; a simple class summary page (completion rates, goal domains, scale averages).
7. **Feedback workflow and AI.** Draft, Approve, Release workflow. A "Draft feedback with AI" button that first works with a mock response; only after I agree, connect it to the Claude API, sending initials and student_id only.
8. **Safety scan placeholder.** Keyword flagging, a Year Head queue of Flagged items, and a Cleared action.
9. **Demo polish.** A short guided demo script for presenting to my school leader.

## Not in scope for the prototype

Parent access; real Google sign-in; multiple classes or levels (the model must support them, but seed only 4F1); real student data.
