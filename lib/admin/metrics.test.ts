import { describe, expect, it } from "vitest";
import { formatMinutes, median, metricRows, percent, TrialMetrics } from "./metrics";

const side = (over: Record<string, unknown> = {}) => ({
  participants: 30,
  teams: 6,
  minutes_to_ranking: [4, 12.5, 30],
  feedback: { fit: 9, not_fit: 3 },
  invites: { accepted: 5, declined: 3, expired: 2, pending: 4 },
  intervention: { changed: 2, suggested: 16 },
  drafts: { sent: 4, total: 9 },
  ...over,
});

describe("percent", () => {
  it("rounds and explains, or shows a dash without data", () => {
    expect(percent(2, 3)).toEqual({ value: "67%", detail: "2 dari 3" });
    expect(percent(0, 0)).toEqual({ value: "–", detail: "Belum ada data" });
  });
});

describe("median and formatMinutes", () => {
  it("takes the middle value, or the mean of the two middle ones", () => {
    expect(median([30, 4, 12])).toBe(12);
    expect(median([4, 10, 20, 30])).toBe(15);
    expect(median([])).toBeNull();
  });

  it("uses minutes, then hours, then days", () => {
    expect(formatMinutes(12.4)).toBe("12 menit");
    expect(formatMinutes(90)).toBe("1,5 jam");
    expect(formatMinutes(60 * 72)).toBe("3 hari");
  });
});

describe("metricRows", () => {
  it("computes the five PRD §17 ratios per side, accepted rate without pending invites", () => {
    const data = TrialMetrics.parse({
      real: side(),
      simulated: side({ feedback: { fit: 0, not_fit: 0 } }),
    });
    const byKey = Object.fromEntries(metricRows(data).map((r) => [r.key, r]));
    expect(byKey.time!.real).toEqual({ value: "13 menit", detail: "median dari 3 tim" });
    expect(byKey.fit!.real.value).toBe("75%");
    expect(byKey.fit!.simulated.value).toBe("–");
    expect(byKey.accept!.real).toEqual({ value: "50%", detail: "5 dari 10" });
    expect(byKey.intervention!.real.value).toBe("13%");
    expect(byKey.drafts!.real).toEqual({ value: "44%", detail: "4 dari 9" });
  });

  it("accepts numeric strings from Postgres", () => {
    const parsed = TrialMetrics.parse({
      real: side({ participants: "30", minutes_to_ranking: ["4.5"] }),
      simulated: side(),
    });
    expect(parsed.real.participants).toBe(30);
    expect(parsed.real.minutes_to_ranking).toEqual([4.5]);
  });
});
