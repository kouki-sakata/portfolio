import {
  forwardRef,
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
  maxHeight?: string;
}

const PX_MAX_HEIGHT_REGEX = /^([0-9]+(?:\.[0-9]+)?)px$/;

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      autoResize = false,
      maxHeight,
      minLength: minLengthProp,
      maxLength: maxLengthProp,
      onInput,
      style,
      value,
      defaultValue,
      ...restProps
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const previousValueRef = useRef<unknown>(undefined);
    const resolvedMinLength = minLengthProp ?? 1;
    const resolvedMaxLength = maxLengthProp ?? 1000;

    const assignRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref]
    );

    const parseMaxHeightPx = useCallback((): number | null => {
      if (!maxHeight) {
        return null;
      }

      const match = PX_MAX_HEIGHT_REGEX.exec(maxHeight.trim());
      if (!match || !match[1]) {
        return null;
      }
      return Number.parseFloat(match[1]);
    }, [maxHeight]);

    const resizeTextarea = useCallback(
      (element: HTMLTextAreaElement) => {
        element.style.height = "auto";
        const newHeight = element.scrollHeight;

        const limit = parseMaxHeightPx();
        if (limit !== null) {
          const clamped = Math.min(newHeight, limit);
          element.style.height = `${clamped}px`;
        } else {
          element.style.height = `${newHeight}px`;
        }
      },
      [parseMaxHeightPx]
    );

    const handleInput = useCallback(
      (event: React.FormEvent<HTMLTextAreaElement>) => {
        if (autoResize) {
          resizeTextarea(event.currentTarget);
        }

        onInput?.(event);
      },
      [autoResize, onInput, resizeTextarea]
    );

    useEffect(() => {
      if (!autoResize) {
        return;
      }

      const element = internalRef.current;
      if (!element) {
        return;
      }

      const signature = value ?? defaultValue ?? element.value;
      if (previousValueRef.current === signature) {
        return;
      }

      previousValueRef.current = signature;
      resizeTextarea(element);
    }, [autoResize, defaultValue, resizeTextarea, value]);

    const resizeClass = autoResize
      ? maxHeight
        ? "resize-none overflow-auto"
        : "resize-none overflow-hidden"
      : "resize-y";
    const combinedStyle = maxHeight ? { ...style, maxHeight } : style;

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "break-words", // 長文の折り返し対応
          resizeClass,
          className
        )}
        defaultValue={defaultValue}
        maxLength={resolvedMaxLength}
        minLength={resolvedMinLength}
        onInput={handleInput}
        ref={assignRef}
        style={combinedStyle}
        value={value}
        {...restProps}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
