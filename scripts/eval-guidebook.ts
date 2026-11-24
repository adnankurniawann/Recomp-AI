/**
 * Accuracy of the guidebook agent (PRD §8.1 "Evaluasi akurasi", §17): runs it on every guidebook
 * in eval/guidebooks.json and prints how many judging criteria it found with the right name and
 * page, against the answers written by hand.
 *
 *   pnpm eval:guidebook                       # live, needs GEMINI_API_KEY or OPENROUTER_API_KEY
 *   pnpm eval:guidebook --only stack-2026
 *   pnpm eval:guidebook --save eval/runs/2026-11-23   # also keep each extraction as JSON
 *   pnpm eval:guidebook --saved eval/runs/2026-11-23  # score saved extractions, no LLM
 *
 * Reads GEMINI_API_KEY or OPENROUTER_API_KEY, and GEMINI_MODEL, from the environment or .env.local.
 * The prompt gets no skill list or templates: they only shape suggested roles, not the criteria
 * scored here.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  ManualGuidebooks,
  overallAccuracy,
  scoreGuidebook,
  type GuidebookScore,
} from "@/lib/ai/eval";
import { getGemini } from "@/lib/ai/gemini";
import { runGuidebookAgent } from "@/lib/ai/guidebook";
import { GuidebookExtraction } from "@/lib/ai/schemas";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const { values } = parseArgs({
  options: {
    only: { type: "string" },
    save: { type: "string" },
    saved: { type: "string" },
  },
});

const books = ManualGuidebooks.parse(
  JSON.parse(readFileSync("eval/guidebooks.json", "utf8")),
).filter((b) => !values.only || b.id === values.only);
if (books.length === 0)
  throw new Error(`No guidebook with id "${values.only}" in eval/guidebooks.json`);

// DEMO_MODE turns AI off in the app; an evaluation is always meant to call the model.
delete process.env.DEMO_MODE;
const gemini = values.saved ? null : getGemini();
if (!values.saved && !gemini) {
  console.error(
    "No AI key: set GEMINI_API_KEY or OPENROUTER_API_KEY, or score saved extractions with --saved <dir>.",
  );
  process.exit(1);
}
if (values.save) mkdirSync(values.save, { recursive: true });

async function main() {
  const scores: GuidebookScore[] = [];
  for (const book of books) {
    let extraction: GuidebookExtraction;
    if (values.saved) {
      const file = join(values.saved, `${book.id}.json`);
      if (!existsSync(file)) {
        console.log(`- ${book.id}: skipped, no ${file}`);
        continue;
      }
      extraction = GuidebookExtraction.parse(JSON.parse(readFileSync(file, "utf8")));
    } else {
      const started = Date.now();
      const result = await runGuidebookAgent({
        pdf: new Uint8Array(readFileSync(book.pdf)),
        category: book.category,
        skillNames: [],
        templates: [],
        generate: gemini!.generateJson,
      });
      if (result.status === "failed") {
        console.log(`- ${book.id}: agent failed (${result.error}); all criteria count as wrong`);
        scores.push(scoreGuidebook(book, []));
        continue;
      }
      extraction = result.data;
      console.log(
        `- ${book.id}: ${((Date.now() - started) / 1000).toFixed(1)} s, ${result.attempts} attempt(s)`,
      );
      if (values.save) {
        writeFileSync(
          join(values.save, `${book.id}.json`),
          `${JSON.stringify(extraction, null, 2)}\n`,
        );
      }
    }

    const score = scoreGuidebook(book, extraction.judging_criteria);
    scores.push(score);
    console.log(
      `\n${book.name}: ${score.correct}/${score.total} correct, ${score.nameOnly} wrong page`,
    );
    console.table(
      score.rows.map((r) => ({
        expected: r.expected,
        found: r.found ?? "-",
        name: r.nameOk ? "ok" : "x",
        page: r.pageOk ? "ok" : "x",
        weight: r.weightOk ? "ok" : "x",
      })),
    );
    if (score.extra.length) console.log(`Not in the manual answer: ${score.extra.join(", ")}`);
  }

  const all = overallAccuracy(scores);
  console.log(
    `\nAccuracy: ${all.correct}/${all.total} criteria${all.percent === null ? "" : ` (${all.percent}%)`} ` +
      `over ${scores.length} guidebook(s)${gemini ? `, model ${gemini.model}` : ", saved extractions"}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
