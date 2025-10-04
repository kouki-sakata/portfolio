import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  ICON_SYMBOL_PREFIX,
  IconSpriteSheet,
  SpriteIcon,
} from "@/shared/components/icons/SpriteIcon";

describe("IconSpriteSheet", () => {
  test("renders SVG symbols for each icon", () => {
    render(<IconSpriteSheet />);

    const sunSymbol = screen.getByTestId(
      `sprite-symbol-${ICON_SYMBOL_PREFIX}sun`
    );

    expect(sunSymbol).toBeInTheDocument();
    expect(sunSymbol).toHaveAttribute("id", `${ICON_SYMBOL_PREFIX}sun`);
  });
});

describe("SpriteIcon", () => {
  test("marks decorative icons as presentation", () => {
    const { container } = render(
      <>
        <IconSpriteSheet />
        <SpriteIcon decorative name="sun" />
      </>
    );

    const icon = container.querySelector("svg[role='presentation']");
    if (!icon) {
      throw new Error(
        "Expected decorative icon to render as presentation role"
      );
    }

    expect(icon).toHaveAttribute("aria-hidden", "true");

    const useElement = icon.querySelector("use");
    if (!useElement) {
      throw new Error("Icon sprite <use> element is missing");
    }

    expect(useElement).toHaveAttribute("href", `#${ICON_SYMBOL_PREFIX}sun`);
  });

  test("exposes labelled icons to assistive tech", () => {
    render(
      <>
        <IconSpriteSheet />
        <SpriteIcon aria-label="Profile" name="users" />
      </>
    );

    const icon = screen.getByLabelText("Profile");
    expect(icon).toHaveAttribute("role", "img");
    expect(icon).toHaveAttribute("aria-hidden", "false");
    expect(icon.classList.contains("inline-block")).toBe(true);
  });
});
