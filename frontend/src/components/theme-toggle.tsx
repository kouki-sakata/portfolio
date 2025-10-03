import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      onClick={() => {
        setTheme(theme === "light" ? "dark" : "light");
      }}
      size="icon"
      variant="ghost"
    >
      <SpriteIcon
        className="dark:-rotate-90 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0"
        decorative
        name="sun"
      />
      <SpriteIcon
        className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        decorative
        name="moon"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
