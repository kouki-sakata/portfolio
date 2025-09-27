Run if [[-n $(git status --porcelain src/types/database.generated.ts)]]; then
Database types are out of sync!
diff --git a/src/types/database.generated.ts b/src/types/database.generated.ts
index 6b46db8..7c38fb7 100644
--- a/src/types/database.generated.ts
+++ b/src/types/database.generated.ts
@@ -709,7 +709,11 @@ export type Database = {
};
check_rls_status: {
Args: Record<PropertyKey, never> | { table_name: string };

-        Returns: boolean;

*        Returns: {
*          policy_count: number;
*          rls_enabled: boolean;
*          table_name: string;
*        }[];
         };
         check_table_sizes: {
           Args: Record<PropertyKey, never>;
  @@ -980,6 +984,12 @@ export type Database = {
  Args: Record<PropertyKey, never>;
  Returns: string;
  };
*      test_rls_as_user: {
*        Args: { p_query: string; p_user_id: string };
*        Returns: {
*          result: Json;
*        }[];
*      };
         test_rls_policies: {
           Args: Record<PropertyKey, never>;
           Returns: {
  Error: Process completed with exit code 1.
