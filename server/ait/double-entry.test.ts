import { describe, expect, it, beforeEach } from "vitest";
import {
  writeDoubleEntryJournalMem,
  getMemJournalForTests,
  resetMemJournalForTests,
} from "./double-entry";
import { resetMetrics, getCounter, MetricNames } from "../observability/metrics";

describe("AIT double-entry (mem)", () => {
  beforeEach(() => {
    resetMemJournalForTests();
    resetMetrics();
  });

  it("records balanced debit/credit amounts", () => {
    writeDoubleEntryJournalMem({ txId: "t1", delta: 50 });
    writeDoubleEntryJournalMem({ txId: "t2", delta: -20 });
    const journal = getMemJournalForTests();
    expect(journal).toHaveLength(2);
    expect(journal[0]).toEqual({ txId: "t1", debit: 50, credit: 50 });
    expect(journal[1]).toEqual({ txId: "t2", debit: 20, credit: 20 });
    expect(getCounter(MetricNames.aitJournalEntries)).toBe(2);
  });
});
