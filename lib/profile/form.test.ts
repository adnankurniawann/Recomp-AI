import { describe, expect, it } from "vitest";
import { emptyHistory, emptyPortfolio, withSavedIds, type HistoryPortfolioValues } from "./form";

describe("withSavedIds", () => {
  it("fills the ids of new items in the order they were sent and keeps the React keys", () => {
    const kept = { ...emptyHistory(), id: "h-old", key: "h-old" };
    const fresh = emptyHistory();
    const portfolio = emptyPortfolio();
    const values: HistoryPortfolioValues = { history: [kept, fresh], portfolio: [portfolio] };

    const next = withSavedIds(values, { history: ["h-old", "h-new"], portfolio: ["p-new"] });

    expect(next.history.map((h) => h.id)).toEqual(["h-old", "h-new"]);
    expect(next.history[1]?.key).toBe(fresh.key);
    expect(next.portfolio[0]?.id).toBe("p-new");
    expect(next.portfolio[0]?.key).toBe(portfolio.key);
  });

  it("leaves items alone when the server sent fewer ids", () => {
    const values: HistoryPortfolioValues = { history: [emptyHistory()], portfolio: [] };
    expect(withSavedIds(values, { history: [], portfolio: [] }).history[0]?.id).toBeUndefined();
  });
});
