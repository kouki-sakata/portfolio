import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Button, buttonVariants } from "@/components/ui/button";

describe("buttonVariants", () => {
  test("composes variant and size classes", () => {
    const classes = buttonVariants({ variant: "destructive", size: "sm" });

    expect(classes).toContain("bg-destructive");
    expect(classes).toContain("h-8");
  });
});

describe("Button", () => {
  test("renders a native button by default", () => {
    render(<Button>Submit</Button>);

    const button = screen.getByRole("button", { name: "Submit" });
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button.className).toContain("inline-flex");
    expect(button.className).toContain("bg-primary");
  });

  test("supports rendering as child component", () => {
    render(
      <Button asChild size="icon" variant="ghost">
        <a href="#profile">Profile</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: "Profile" });
    expect(link.tagName).toBe("A");
    expect(link.className).toContain("hover:bg-accent");
    expect(link.className).toContain("size-9");
  });
});
