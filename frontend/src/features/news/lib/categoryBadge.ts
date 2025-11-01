export type NewsCategoryBadgeVariant = "destructive" | "default" | "secondary";

const IMPORTANT_VALUES = new Set(["IMPORTANT", "重要"]);
const SYSTEM_VALUES = new Set(["SYSTEM", "システム"]);

export const getNewsCategoryBadgeVariant = (
  label: string
): NewsCategoryBadgeVariant => {
  if (IMPORTANT_VALUES.has(label)) {
    return "destructive";
  }
  if (SYSTEM_VALUES.has(label)) {
    return "default";
  }
  return "secondary";
};
