import { ReminderPreset, type Assignment } from "../../../types";
import { prepareAssignmentUpdates } from "../../../utils/assignmentUpdate";
import { describe, expect, it } from "vitest";

describe("prepareAssignmentUpdates", () => {
  const deleteToken = Symbol("delete");
  const createDeleteToken = () => deleteToken;

  it("resets reminder.sentAt when dueDate/reminder changes and reminder stays enabled", () => {
    const updates: Partial<Assignment> = {
      dueDate: "2026-03-10T12:00:00.000Z",
      reminder: {
        enabled: true,
        preset: ReminderPreset.OneHour,
        sentAt: "2026-03-09T12:00:00.000Z",
      },
    };

    const result = prepareAssignmentUpdates(updates, createDeleteToken);

    expect(result.dueDate).toBe("2026-03-10T12:00:00.000Z");
    expect(result["reminder.enabled"]).toBe(true);
    expect(result["reminder.preset"]).toBe(ReminderPreset.OneHour);
    expect(result["reminder.sentAt"]).toBe(deleteToken);
  });

  it("does not force sentAt reset when reminder is disabled", () => {
    const updates: Partial<Assignment> = {
      dueDate: "2026-03-10T12:00:00.000Z",
      reminder: {
        enabled: false,
        preset: ReminderPreset.OneDay,
        sentAt: "2026-03-09T12:00:00.000Z",
      },
    };

    const result = prepareAssignmentUpdates(updates, createDeleteToken);

    expect(result["reminder.sentAt"]).toBe("2026-03-09T12:00:00.000Z");
  });

  it("maps top-level undefined values to delete tokens", () => {
    const updates: Partial<Assignment> = {
      examType: undefined,
    };

    const result = prepareAssignmentUpdates(updates, createDeleteToken);

    expect(result.examType).toBe(deleteToken);
  });

  it("maps nested reminder undefined values to delete tokens", () => {
    const updates: Partial<Assignment> = {
      reminder: {
        enabled: true,
        preset: ReminderPreset.Custom,
        customTime: undefined,
      },
    };

    const result = prepareAssignmentUpdates(updates, createDeleteToken);

    expect(result["reminder.enabled"]).toBe(true);
    expect(result["reminder.preset"]).toBe(ReminderPreset.Custom);
    expect(result["reminder.customTime"]).toBe(deleteToken);
  });
});
