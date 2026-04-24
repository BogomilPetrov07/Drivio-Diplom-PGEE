import {
  clampTime,
  computeBreakMinutesByPreset,
  distributeBreaks,
  generateSlots,
  getScheduleError,
  toTimeString,
  toMinutes,
} from "../../src/modules/dashboard/pages/instructor-schedule/logic";

describe("instructor schedule logic", () => {
  it("returns empty slots when endTime is before startTime", () => {
    const slots = generateSlots("10:00", "09:00", 30, "normal");
    expect(slots).toEqual([]);
  });

  it("returns a validation error when no day is selected", () => {
    const error = getScheduleError(
      "09:00",
      "17:00",
      [{ start: "09:00", end: "10:00" }],
      0
    );
    expect(error).toBe("Select at least one day.");
  });

  it("converts HH:mm string to minutes", () => {
    expect(toMinutes("07:30")).toBe(450);
    expect(toMinutes("21:00")).toBe(1260);
  });

  it("converts minutes to HH:mm string", () => {
    expect(toTimeString(450)).toBe("07:30");
    expect(toTimeString(1260)).toBe("21:00");
  });

  it("clamps time before system bounds", () => {
    expect(clampTime("05:30")).toBe("07:00");
  });

  it("returns no break minutes for preset none", () => {
    expect(computeBreakMinutesByPreset("09:00", "17:00", "none")).toBe(0);
  });

  it("distributes breaks according to gaps", () => {
    const breaks = distributeBreaks(20, 3, toMinutes("09:00"), "normal");
    expect(breaks.length).toBe(2);
    expect(breaks.reduce((a, b) => a + b, 0)).toBe(20);
  });

  it("generates one-hour slots for valid window", () => {
    const slots = generateSlots("09:00", "12:00", 0, "none");
    expect(slots.length).toBe(3);
    expect(slots[0]).toEqual({ start: "09:00", end: "10:00" });
    expect(slots[2]).toEqual({ start: "11:00", end: "12:00" });
  });
});
