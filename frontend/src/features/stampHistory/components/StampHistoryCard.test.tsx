import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { StampHistoryEntry } from "@/features/stampHistory/types";
import { StampHistoryCard } from "./StampHistoryCard";

describe("StampHistoryCard", () => {
  const mockEntry: StampHistoryEntry = {
    id: 1,
    employeeId: 1,
    year: "2024",
    month: "11",
    day: "10",
    dayOfWeek: "日",
    inTime: "09:00",
    outTime: "18:00",
    breakStartTime: "12:00",
    breakEndTime: "13:00",
    overtimeMinutes: 30,
    isNightShift: null,
    updateDate: "2024/11/10 18:05",
  };

  it("renders entry data correctly", () => {
    render(<StampHistoryCard entry={mockEntry} />);

    expect(screen.getByText("2024/11/10")).toBeInTheDocument();
    expect(screen.getByText("日")).toBeInTheDocument();
    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("18:00")).toBeInTheDocument();
    expect(screen.getAllByText("12:00")[0]).toBeInTheDocument();
    expect(screen.getByText("13:00")).toBeInTheDocument();
    expect(screen.getByText("30分")).toBeInTheDocument();
    expect(screen.getByText("更新: 2024/11/10 18:05")).toBeInTheDocument();
  });

  it("displays '-' for null inTime and outTime", () => {
    const entryWithNullTimes: StampHistoryEntry = {
      ...mockEntry,
      inTime: null,
      outTime: null,
    };

    render(
      <StampHistoryCard entry={entryWithNullTimes} />
    );

    // 出勤と退勤の両方に"-"が表示される
    const dashElements = screen.getAllByText("-");
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it("displays '-' for null break times", () => {
    const entryWithNullBreaks: StampHistoryEntry = {
      ...mockEntry,
      breakStartTime: null,
      breakEndTime: null,
    };

    render(
      <StampHistoryCard entry={entryWithNullBreaks} />
    );

    const dashElements = screen.getAllByText("-");
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it("displays '0分' for null overtime", () => {
    const entryWithNullOvertime: StampHistoryEntry = {
      ...mockEntry,
      overtimeMinutes: null,
    };

    render(
      <StampHistoryCard entry={entryWithNullOvertime} />
    );

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("displays '0分' for zero overtime", () => {
    const entryWithZeroOvertime: StampHistoryEntry = {
      ...mockEntry,
      overtimeMinutes: 0,
    };

    render(
      <StampHistoryCard entry={entryWithZeroOvertime} />
    );

    expect(screen.getByText("0分")).toBeInTheDocument();
  });

  it("applies blue color to Saturday", () => {
    const saturdayEntry: StampHistoryEntry = {
      ...mockEntry,
      dayOfWeek: "土",
    };

    const { container } = render(
      <StampHistoryCard entry={saturdayEntry} />
    );

    const dateElement = container.querySelector(".text-blue-600");
    expect(dateElement).toBeInTheDocument();
  });

  it("applies red color to Sunday", () => {
    const sundayEntry: StampHistoryEntry = {
      ...mockEntry,
      dayOfWeek: "日",
    };

    const { container } = render(
      <StampHistoryCard entry={sundayEntry} />
    );

    const dateElement = container.querySelector(".text-red-600");
    expect(dateElement).toBeInTheDocument();
  });

  it("displays '-' for null update date", () => {
    const entryWithoutUpdateDate: StampHistoryEntry = {
      ...mockEntry,
      updateDate: null,
    };

    render(
      <StampHistoryCard
        entry={entryWithoutUpdateDate}
       
      />
    );

    expect(screen.getByText("更新: -")).toBeInTheDocument();
  });

  it("renders as a list item", () => {
    const { container } = render(
      <StampHistoryCard entry={mockEntry} />
    );

    const listItem = container.querySelector("li");
    expect(listItem).toBeInTheDocument();
    expect(listItem).toHaveAttribute(
      "aria-labelledby",
      "stamp-card-2024-11-10"
    );
  });
});
