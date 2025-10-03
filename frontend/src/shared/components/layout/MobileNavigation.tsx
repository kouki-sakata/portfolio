import type React from "react";
import { useState } from "react";

import { SpriteIcon } from "@/shared/components/icons/SpriteIcon";
import { cn } from "@/shared/utils/cn";

import { AppSidebar } from "./AppSidebar";

type MobileNavigationProps = {
  className?: string;
};

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen((previous) => !previous);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
        className={cn(
          "rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "transition-colors duration-200",
          "lg:hidden",
          className
        )}
        onClick={toggleSidebar}
        type="button"
      >
        {isOpen ? (
          <SpriteIcon className="h-6 w-6" decorative name="x" />
        ) : (
          <SpriteIcon className="h-6 w-6" decorative name="menu" />
        )}
      </button>

      <AppSidebar
        className="lg:hidden"
        isOpen={isOpen}
        onClose={closeSidebar}
      />
    </>
  );
};
