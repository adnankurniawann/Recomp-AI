# Course content

Each folder here is one course. `pnpm seed:content` loads all of them into Supabase (PRD F-LRN-06).

## Adding a lesson

1. Write a Markdown file in the course folder, for example `05-validasi-pengguna.md`.
2. Add its file name to the right chapter in `course.json`. The order there is the order in the app.
3. Run `pnpm seed:content` and open the lesson in the player.

A lesson starts with YAML frontmatter, then the content in Markdown (Indonesian, casual but polite):

```markdown
---
title: Validasi pengguna
slug: validasi-pengguna # lowercase words joined by -, unique in the course
minutes: 8
questions:
  - type: mcq
    prompt: Pertanyaan?
    points: 5 # optional, default 5
    options:
      A: Jawaban pertama
      B: Jawaban kedua
    answer: B
    explanation: Kenapa B benar.
  - type: case # case studies only in chapters 2 and 3
    prompt: Tugas studi kasus.
    rubric:
      - criterion: Nama kriteria
        description: Apa yang dinilai
        max_score: 5
---

# Judul materi

Isi materi...
```

Rules from PRD F-LRN-06: 2 to 4 multiple-choice questions per lesson; chapters 2 and 3 each have one
case study. Chapters with `"free": true` are the free preview (the first chapter). The script checks
the format and stops with the file name if something is wrong. Rows keep stable ids, so fixing a
lesson and seeding again never loses students' answers.

Write everything yourself: no copied text, logos or images from other courses (AGENTS.md).
