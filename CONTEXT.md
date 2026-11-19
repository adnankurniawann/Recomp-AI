# Recomp AI

A web app that helps university students form competition teams by the roles a competition needs,
then prepare through courses and mentors. This glossary is the shared language of the docs, the
code and the issues. Each term gives the word used on screen (**UI**, Indonesian) and words to
avoid. Table and column names come from PRD §12.

## Language

### People

**Student**:
Anyone with an account. One student can lead one team, join others and take courses at the same
time. Table: `profiles`. UI: mahasiswa.
_Avoid_: user (too vague in issues), member (that's a team member)

**Leader**:
The student who created a team. Edits its roles, sees the ranking and sends invites. Column:
`teams.leader_id`. UI: Ketua.
_Avoid_: owner, admin, captain

**Team member**:
A student who has joined a team for one role. Table: `team_members`. UI: anggota.

**Candidate**:
A student shown in the ranking for an empty role, or one an invite is addressed to. Column:
`invites.candidate_id`. UI: kandidat.
_Avoid_: applicant (that's someone who applied), match

**Mentor**:
A person a team can book for a paid (simulated) session. Real mentors appear only after written
permission and admin verification. Table: `mentors`. UI: mentor.

**Admin**:
A student with `app_role = 'admin'`. Adds competitions, uploads guidebooks, reviews extractions,
manages mentors. UI: admin.

### Competitions and roles

**Competition**:
A hackathon or IT contest with an official guidebook. Table: `competitions`. UI: lomba.
_Avoid_: event, contest (in code), challenge

**Interest**:
A student marking a competition as one they want to join. Only interested students can appear in
its ranking. Table: `competition_interests`. UI: Tertarik.
_Avoid_: like, follow, bookmark

**Guidebook**:
The official PDF rules of a competition. UI: guidebook.

**Extraction**:
One run of the guidebook agent over a guidebook: summary, team size, deadlines, judging criteria
and suggested roles, each with a page number. Status `processing`, `draft`, `reviewed` or
`failed`. Table: `competition_extractions`. UI: ringkasan guidebook.
_Avoid_: parse, scan, summary (the summary is one part of it)

**Role**:
A position a team needs, with required skills and minimum levels, optional skills, hours per week
and a number of slots. Every role has a **Source**. Table: `team_roles`. UI: role.
_Avoid_: position, job

**Source**:
Where a role came from: `guidebook` (named in the guidebook), `criteria` (derived from a judging
criterion), `template` (category default) or `manual` (added by the leader). UI: "Dari guidebook
hal. 3", "Ditambah ketua".

**Slot**:
One seat in a role. A role is filled when its members equal its slots. UI: slot.

**Gap**:
The required skills of roles that are still empty. UI: "Skill wajib yang belum tertutup".
_Avoid_: missing skills (that's per candidate)

**Role template**:
Default roles for a competition category, used when a guidebook gives no hints. Table:
`role_templates`. UI: template.

### Skills and profiles

**Skill**:
An item from the fixed skill list. Students can't create new ones. Table: `skills`. UI: skill.

**Level**:
1 Dasar, 2 Menengah, 3 Mahir, 4 Ahli. UI: those four words.
_Avoid_: rating, stars

**Evidence**:
A link proving a skill or a past competition. Raises the skill's weight in the score. Column:
`evidence_url`. UI: bukti.

**Competition history**:
Past competitions a student joined, with result. Table: `competition_history`. UI: riwayat lomba.

**Portfolio item**:
A piece of work with a link. Table: `portfolio_items`. UI: portofolio.

**Contact**:
A student's WhatsApp and contact email. Private: visible only to themselves and teammates.
Table: `profile_contacts`. UI: kontak.

### Ranking

**Ranking**:
The ordered list of candidates for one empty role, after the required filters (PRD §7.2). UI:
kandidat.
_Avoid_: recommendation feed, suggestions

**Score**:
A number from 0 to 100 computed by `lib/matching` from five **Factors**. Never by an LLM. UI: skor.
_Avoid_: AI score, match percentage, compatibility

**Factor**:
One of the five parts of the score: coverage, level, availability, experience, fit. UI: Penutupan
role, Level skill, Ketersediaan, Pengalaman, Minat dan gaya.

**Reason**:
A one-line sentence built from a template in code that explains a factor, such as "Menutup semua
skill wajib: Figma". UI: alasan.
_Avoid_: explanation (too vague), AI reason

**Recommendation feedback**:
A leader's "Cocok" or "Kurang cocok" on a candidate, kept for the trial metrics. Table:
`recommendation_feedback`.

### Invites

**Invite**:
A leader asking a candidate to fill a role (`direction = 'invite'`). Status `pending`, `accepted`,
`declined`, `cancelled` or `expired`. Table: `invites`. UI: undangan.

**Application**:
A student asking a team to fill a role (`direction = 'apply'`). Same table as invites. Left for
Final Day. UI: lamaran, "Lamar".
_Avoid_: request, join request

**Draft**:
An invite message the recruiter agent wrote. It is sent only when the leader clicks "Kirim".
Table: `agent_actions`. UI: draf.

### Learning and mentors

**Course › Chapter › Lesson › Question**:
The learning content tree. A question is `mcq` or `case`. Tables: `courses`, `chapters`,
`lessons`, `questions`. UI: kursus, bab, materi, soal.
_Avoid_: module, class, quiz (a quiz is just the questions of one lesson)

**Attempt**:
One submitted answer. Multiple choice allows one attempt; a case study allows three. Table:
`attempts`.

**Booking**:
A team reserving a mentor service at a time slot. Status `pending_payment`, `paid`, `done`,
`cancelled`. Always simulated in this version. Table: `bookings`. UI: sesi mentor.

### Project

**Simulated**:
Data or payments that are fictional: seed profiles, mentors without permission, every payment.
Always `is_simulated = true` and a "Simulasi" badge.
_Avoid_: fake, dummy, mock (in on-screen words)

**Demo mode**:
`DEMO_MODE=true`: AI features use saved results instead of calling Gemini, for a safe demo.

**Final Day task**:
Work left on purpose for the STACK Final Day build session. Label `final-day`.

**Feature ID**:
`F-<EPIC>-<NN>` from PRD §6, such as `F-RNK-01`. Used in issue titles, branch names and pull
requests.
