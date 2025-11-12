import { describe, expect, it } from "vitest";

import { EditStampSchema } from "../index";

const basePayload = {
  id: 1,
};

describe("EditStampSchema", () => {
  it("allows overnight ranges when night shift flag is set", () => {
    expect(() =>
      EditStampSchema.parse({
        ...basePayload,
        inTime: "22:00",
        outTime: "05:00",
        isNightShift: true,
      })
    ).not.toThrow();
  });

  it("rejects overnight ranges without night shift flag", () => {
    expect(() =>
      EditStampSchema.parse({
        ...basePayload,
        inTime: "22:00",
        outTime: "05:00",
      })
    ).toThrowError("時刻を正しく入力してください");
  });

  it("keeps enforcing forward times for day shifts", () => {
    expect(() =>
      EditStampSchema.parse({
        ...basePayload,
        inTime: "09:00",
        outTime: "18:00",
      })
    ).not.toThrow();
  });
});
