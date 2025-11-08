import LogoSvg from "@/assets/svg/logo";
import { cn } from "@/lib/utils";

const Logo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2.5", className)}>
    <LogoSvg className="size-8" />
    <span className="font-semibold text-xl">TeamDevelop Bravo</span>
  </div>
);

export default Logo;
