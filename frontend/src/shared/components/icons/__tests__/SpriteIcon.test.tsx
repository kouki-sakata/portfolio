import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SpriteIconName } from "../SpriteIcon";
import {
  ICON_SYMBOL_PREFIX,
  IconSpriteSheet,
  SpriteIcon,
  spriteIconDefinitions,
} from "../SpriteIcon";

describe("SVG sprite system", () => {
  it("スプライトシートに定義済みアイコンが含まれる", () => {
    render(<IconSpriteSheet />);

    const definedEntries = Object.entries(spriteIconDefinitions) as [
      SpriteIconName,
      (typeof spriteIconDefinitions)[SpriteIconName],
    ][];

    const symbols = screen.getAllByTestId(/sprite-symbol-/i);
    expect(symbols).toHaveLength(definedEntries.length);

    definedEntries.forEach(([name]) => {
      const symbolId = `${ICON_SYMBOL_PREFIX}${name}`;
      const symbol = screen.getByTestId(`sprite-symbol-${symbolId}`);
      expect(symbol.tagName.toLowerCase()).toBe("symbol");
    });
  });

  it("SpriteIconコンポーネントが指定したシンボルを使用する", () => {
    render(<SpriteIcon aria-label="通知" name="bell" />);

    const icon = screen.getByLabelText("通知");
    const useElement = icon.querySelector("use");

    expect(useElement?.getAttribute("href")).toBe(`#${ICON_SYMBOL_PREFIX}bell`);
  });
});
