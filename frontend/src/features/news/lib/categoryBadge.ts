export type NewsCategoryBadgeVariant = "destructive" | "default" | "secondary";

export const getNewsCategoryBadgeVariant = (
  category: string
): NewsCategoryBadgeVariant => {
  if (category === "重要") {
    return "destructive";
  }
  if (category === "システム") {
    return "default";
  }
  return "secondary";
};
