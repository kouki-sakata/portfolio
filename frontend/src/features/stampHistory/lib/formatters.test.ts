import { describe, expect, it } from "vitest";

import {
  getDayOfWeekColor,
  getOvertimeBadgeVariant,
  renderBreakTimeCell,
  renderOptionalTime,
  renderOvertimeCell,
} from "./formatters";

describe("formatters", () => {
  describe("renderOptionalTime", () => {
    it("returns the time value when provided", () => {
      expect(renderOptionalTime("09:00")).toBe("09:00");
      expect(renderOptionalTime("18:30")).toBe("18:30");
    });

    it("returns '-' for null", () => {
      expect(renderOptionalTime(null)).toBe("-");
    });

    it("returns '-' for empty string", () => {
      expect(renderOptionalTime("")).toBe("-");
    });

    it("returns '-' for whitespace only string", () => {
      expect(renderOptionalTime("   ")).toBe("-");
    });
  });

  describe("renderBreakTimeCell", () => {
    it("returns the time value when provided", () => {
      expect(renderBreakTimeCell("12:00")).toBe("12:00");
      expect(renderBreakTimeCell("13:00")).toBe("13:00");
    });

    it("returns '-' for null", () => {
      expect(renderBreakTimeCell(null)).toBe("-");
    });

    it("returns '-' for empty string", () => {
      expect(renderBreakTimeCell("")).toBe("-");
    });

    it("returns '-' for whitespace only string", () => {
      expect(renderBreakTimeCell("   ")).toBe("-");
    });
  });

  describe("renderOvertimeCell", () => {
    it("returns formatted minutes for positive values", () => {
      expect(renderOvertimeCell(30)).toBe("30分");
      expect(renderOvertimeCell(60)).toBe("60分");
      expect(renderOvertimeCell(120)).toBe("120分");
    });

    it("returns '0分' for zero", () => {
      expect(renderOvertimeCell(0)).toBe("0分");
    });

    it("returns '0分' for negative values", () => {
      expect(renderOvertimeCell(-10)).toBe("0分");
      expect(renderOvertimeCell(-30)).toBe("0分");
    });

    it("returns '-' for null", () => {
      expect(renderOvertimeCell(null)).toBe("-");
    });

    it("returns '-' for undefined", () => {
      expect(renderOvertimeCell(undefined as unknown as null)).toBe("-");
    });

    it("returns '0分' for non-finite values", () => {
      expect(renderOvertimeCell(Number.POSITIVE_INFINITY)).toBe("0分");
      expect(renderOvertimeCell(Number.NEGATIVE_INFINITY)).toBe("0分");
      expect(renderOvertimeCell(Number.NaN)).toBe("0分");
    });
  });

  describe("getDayOfWeekColor", () => {
    it("returns blue color for Saturday", () => {
      expect(getDayOfWeekColor("土")).toBe("text-blue-600");
    });

    it("returns red color for Sunday", () => {
      expect(getDayOfWeekColor("日")).toBe("text-red-600");
    });

    it("returns default color for weekdays", () => {
      expect(getDayOfWeekColor("月")).toBe("text-foreground");
      expect(getDayOfWeekColor("火")).toBe("text-foreground");
      expect(getDayOfWeekColor("水")).toBe("text-foreground");
      expect(getDayOfWeekColor("木")).toBe("text-foreground");
      expect(getDayOfWeekColor("金")).toBe("text-foreground");
    });

    it("returns default color for null", () => {
      expect(getDayOfWeekColor(null)).toBe("text-foreground");
    });

    it("returns default color for unknown values", () => {
      expect(getDayOfWeekColor("Unknown")).toBe("text-foreground");
    });
  });

  describe("getOvertimeBadgeVariant", () => {
    it("returns 'destructive' for positive overtime", () => {
      expect(getOvertimeBadgeVariant(1)).toBe("destructive");
      expect(getOvertimeBadgeVariant(30)).toBe("destructive");
      expect(getOvertimeBadgeVariant(60)).toBe("destructive");
    });

    it("returns 'secondary' for zero overtime", () => {
      expect(getOvertimeBadgeVariant(0)).toBe("secondary");
    });

    it("returns 'secondary' for negative overtime", () => {
      expect(getOvertimeBadgeVariant(-10)).toBe("secondary");
    });

    it("returns 'secondary' for null", () => {
      expect(getOvertimeBadgeVariant(null)).toBe("secondary");
    });
  });
});
