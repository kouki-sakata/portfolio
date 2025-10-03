import type { IconNode } from "lucide-react";
import { __iconNode as arrowDown } from "lucide-react/dist/esm/icons/arrow-down";
import { __iconNode as arrowUp } from "lucide-react/dist/esm/icons/arrow-up";
import { __iconNode as bell } from "lucide-react/dist/esm/icons/bell";
import { __iconNode as check } from "lucide-react/dist/esm/icons/check";
import { __iconNode as chevronDown } from "lucide-react/dist/esm/icons/chevron-down";
import { __iconNode as chevronLeft } from "lucide-react/dist/esm/icons/chevron-left";
import { __iconNode as chevronRight } from "lucide-react/dist/esm/icons/chevron-right";
import { __iconNode as chevronUp } from "lucide-react/dist/esm/icons/chevron-up";
import { __iconNode as chevronsLeft } from "lucide-react/dist/esm/icons/chevrons-left";
import { __iconNode as chevronsRight } from "lucide-react/dist/esm/icons/chevrons-right";
import { __iconNode as chevronsUpDown } from "lucide-react/dist/esm/icons/chevrons-up-down";
import { __iconNode as circle } from "lucide-react/dist/esm/icons/circle";
import { __iconNode as alertCircle } from "lucide-react/dist/esm/icons/circle-alert";
import { __iconNode as clock } from "lucide-react/dist/esm/icons/clock";
import { __iconNode as download } from "lucide-react/dist/esm/icons/download";
import { __iconNode as fileText } from "lucide-react/dist/esm/icons/file-text";
import { __iconNode as history } from "lucide-react/dist/esm/icons/history";
import { __iconNode as home } from "lucide-react/dist/esm/icons/house";
import { __iconNode as loader2 } from "lucide-react/dist/esm/icons/loader-circle";
import { __iconNode as logOut } from "lucide-react/dist/esm/icons/log-out";
import { __iconNode as menu } from "lucide-react/dist/esm/icons/menu";
import { __iconNode as moon } from "lucide-react/dist/esm/icons/moon";
import { __iconNode as refreshCw } from "lucide-react/dist/esm/icons/refresh-cw";
import { __iconNode as settings } from "lucide-react/dist/esm/icons/settings";
import { __iconNode as slidersHorizontal } from "lucide-react/dist/esm/icons/sliders-horizontal";
import { __iconNode as edit } from "lucide-react/dist/esm/icons/square-pen";
import { __iconNode as sun } from "lucide-react/dist/esm/icons/sun";
import { __iconNode as trash2 } from "lucide-react/dist/esm/icons/trash-2";
import { __iconNode as alertTriangle } from "lucide-react/dist/esm/icons/triangle-alert";
import { __iconNode as users } from "lucide-react/dist/esm/icons/users";
import { __iconNode as x } from "lucide-react/dist/esm/icons/x";
import { createElement, type SVGAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export const ICON_SYMBOL_PREFIX = "icon-" as const;

const DEFAULT_VIEW_BOX = "0 0 24 24";

type IconNodeAttributes = Record<string, string | number | undefined> & {
  key?: string | number;
  d?: string;
  x?: string | number;
};

const sanitizeAttributes = (attributes: IconNodeAttributes) => {
  const { key: _omitKey, ...rest } = attributes;
  return rest;
};

const symbolAttributes: SVGAttributes<SVGSymbolElement> = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
};

const spriteIconDefinitionsInternal = {
  "alert-circle": alertCircle,
  "alert-triangle": alertTriangle,
  "arrow-down": arrowDown,
  "arrow-up": arrowUp,
  bell,
  check,
  "chevron-down": chevronDown,
  "chevron-left": chevronLeft,
  "chevron-right": chevronRight,
  "chevron-up": chevronUp,
  "chevrons-left": chevronsLeft,
  "chevrons-right": chevronsRight,
  "chevrons-up-down": chevronsUpDown,
  circle,
  clock,
  download,
  edit,
  "file-text": fileText,
  history,
  home,
  "loader-2": loader2,
  "log-out": logOut,
  menu,
  moon,
  "refresh-cw": refreshCw,
  settings,
  "sliders-horizontal": slidersHorizontal,
  sun,
  "trash-2": trash2,
  users,
  x,
} as const satisfies Record<string, IconNode>;

export type SpriteIconName = keyof typeof spriteIconDefinitionsInternal;

export const spriteIconDefinitions: Record<SpriteIconName, IconNode> =
  spriteIconDefinitionsInternal;

const renderIconNode = (node: IconNode) =>
  node.map(([tagName, attributes]) => {
    const normalizedAttributes = attributes as IconNodeAttributes;
    const candidateKey =
      normalizedAttributes.key ??
      normalizedAttributes.d ??
      normalizedAttributes.x ??
      tagName;
    const elementKey =
      typeof candidateKey === "string" || typeof candidateKey === "number"
        ? candidateKey
        : tagName;

    return createElement(tagName, {
      ...sanitizeAttributes(normalizedAttributes),
      key: elementKey,
    });
  });

export const IconSpriteSheet = () => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute h-0 w-0 overflow-hidden"
    focusable="false"
  >
    <defs>
      {(
        Object.entries(spriteIconDefinitions) as [SpriteIconName, IconNode][]
      ).map(([name, iconNode]) => (
        <symbol
          data-testid={`sprite-symbol-${ICON_SYMBOL_PREFIX}${name}`}
          id={`${ICON_SYMBOL_PREFIX}${name}`}
          key={name}
          viewBox={DEFAULT_VIEW_BOX}
          {...symbolAttributes}
        >
          {renderIconNode(iconNode)}
        </symbol>
      ))}
    </defs>
  </svg>
);

export type SpriteIconProps = {
  name: SpriteIconName | (string & {});
  decorative?: boolean;
} & Omit<SVGAttributes<SVGSVGElement>, "name">;

export const SpriteIcon = ({
  name,
  decorative = false,
  className,
  "aria-label": ariaLabel,
  ...props
}: SpriteIconProps) => {
  const isAriaHidden = decorative || !ariaLabel;

  return (
    <svg
      aria-hidden={isAriaHidden}
      aria-label={ariaLabel}
      className={cn("inline-block", className)}
      role={isAriaHidden ? "presentation" : "img"}
      {...props}
    >
      <use href={`#${ICON_SYMBOL_PREFIX}${name}`} />
    </svg>
  );
};
