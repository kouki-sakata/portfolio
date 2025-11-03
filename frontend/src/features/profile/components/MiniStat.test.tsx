import { render, screen } from "@testing-library/react";
import { Clock } from "lucide-react";
import { describe, expect, it } from "vitest";

import { MiniStat } from "@/features/profile/components/MiniStat";

describe("MiniStat", () => {
  it("タイトルと値を表示する", () => {
    render(<MiniStat icon={Clock} title="月間総労働" value="165h" />);

    expect(screen.getByText("月間総労働")).toBeVisible();
    expect(screen.getByText("165h")).toBeVisible();
  });

  it("トレンド情報がある場合は表示する", () => {
    render(<MiniStat icon={Clock} title="月間残業" trend="+2h" value="10h" />);

    expect(screen.getByText("+2h")).toBeVisible();
  });

  it("variantに応じたスタイルを適用する", () => {
    const { container } = render(
      <MiniStat icon={Clock} title="遅刻回数" value={0} variant="success" />
    );

    const card = container.querySelector("[data-testid='mini-stat']");
    expect(card).toHaveClass("border-green-600/30");
  });

  it("数値も文字列も値として受け入れる", () => {
    render(<MiniStat icon={Clock} title="遅刻回数" value={0} />);

    expect(screen.getByText("0")).toBeVisible();
  });
});
