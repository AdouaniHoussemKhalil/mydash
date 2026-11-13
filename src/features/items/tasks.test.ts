import { describe, expect, it } from "vitest";
import { dueDateSchema, formatDueDate, isOverdue, localToday, taskPatchSchema } from "./tasks";

describe("dueDateSchema", () => {
  it("accepte une vraie date, vide → null", () => {
    expect(dueDateSchema.parse("2026-12-01")).toBe("2026-12-01");
    expect(dueDateSchema.parse("")).toBeNull();
    expect(dueDateSchema.parse(null)).toBeNull();
  });

  it("refuse une date impossible ou mal formée", () => {
    expect(dueDateSchema.safeParse("2026-02-31").success).toBe(false);
    expect(dueDateSchema.safeParse("01/12/2026").success).toBe(false);
  });
});

describe("taskPatchSchema", () => {
  it("accepte un état ou une échéance, refuse le reste", () => {
    expect(taskPatchSchema.parse({ status: "doing" })).toEqual({ status: "doing" });
    expect(taskPatchSchema.safeParse({ status: "bloquée" }).success).toBe(false);
    expect(taskPatchSchema.safeParse({}).success).toBe(false);
    expect(taskPatchSchema.safeParse({ workspace_id: "x" }).success).toBe(false);
  });
});

describe("isOverdue", () => {
  it("échéance passée et non terminée", () => {
    expect(isOverdue("2026-11-10", "todo", "2026-11-13")).toBe(true);
    expect(isOverdue("2026-11-10", "done", "2026-11-13")).toBe(false);
    expect(isOverdue("2026-11-13", "doing", "2026-11-13")).toBe(false);
    expect(isOverdue(null, "todo", "2026-11-13")).toBe(false);
  });
});

describe("dates", () => {
  it("formate sans décalage de fuseau", () => {
    expect(formatDueDate("2026-12-01")).toBe("1 déc. 2026");
  });

  it("date locale du jour", () => {
    expect(localToday(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});
