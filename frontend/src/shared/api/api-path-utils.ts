/**
 * API path utilities for consistent endpoint construction
 * Prevents common issues like duplicate /api prefixes
 */

// Regex patterns defined at module level for performance
const API_PREFIX_PATTERN = /^\/api\//;
const API_PREFIX_SIMPLE_PATTERN = /^\/api/;

/**
 * Ensures a path is relative (no leading /api)
 * Since axiosClient already has baseURL="/api", endpoints should be relative
 *
 * @example
 * ensureRelativePath("/api/news") → "/news"
 * ensureRelativePath("/news") → "/news"
 * ensureRelativePath("news") → "/news"
 */
export const ensureRelativePath = (path: string): string => {
  // Remove leading /api if present
  const withoutApiPrefix = path.replace(API_PREFIX_PATTERN, "/");

  // Ensure path starts with /
  return withoutApiPrefix.startsWith("/")
    ? withoutApiPrefix
    : `/${withoutApiPrefix}`;
};

/**
 * Validates that an API path doesn't contain /api prefix
 * Throws error in development to catch issues early
 *
 * @example
 * validateApiPath("/news") → "/news" (valid)
 * validateApiPath("/api/news") → throws error in dev
 */
export const validateApiPath = (path: string): string => {
  if (import.meta.env.DEV && path.startsWith("/api/")) {
    throw new Error(
      `API path "${path}" contains /api prefix. ` +
        `Since axiosClient has baseURL="/api", use relative path "${path.replace(API_PREFIX_SIMPLE_PATTERN, "")}" instead.`
    );
  }
  return path;
};

/**
 * Creates an API endpoint path with validation
 * Combines path segments safely and validates the result
 *
 * @example
 * createApiPath("/news") → "/news"
 * createApiPath("/news", "123") → "/news/123"
 * createApiPath("/news", "123", "publish") → "/news/123/publish"
 */
export const createApiPath = (...segments: Array<string | number>): string => {
  const path = segments
    .map((segment) => String(segment))
    .filter((segment) => segment.length > 0)
    .join("/")
    .replace(/\/+/g, "/"); // Remove duplicate slashes

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return validateApiPath(normalized);
};
