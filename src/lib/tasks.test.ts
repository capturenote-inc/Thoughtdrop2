import { describe, expect, it } from "vitest";
import { isTaskDate, isTaskPriority, isTaskStatus } from "@/lib/tasks";

describe("task helpers", () => {
  it("accepts only the supported status and priority values", () => {
    expect(isTaskStatus("todo")).toBe(true);
    expect(isTaskStatus("doing")).toBe(true);
    expect(isTaskStatus("done")).toBe(true);
    expect(isTaskStatus("blocked")).toBe(false);
    expect(isTaskPriority("high")).toBe(true);
    expect(isTaskPriority("urgent")).toBe(false);
  });

  it("accepts real ISO calendar dates only", () => {
    expect(isTaskDate("2026-07-15")).toBe(true);
    expect(isTaskDate("2026-02-29")).toBe(false);
    expect(isTaskDate("15-07-2026")).toBe(false);
  });
});
