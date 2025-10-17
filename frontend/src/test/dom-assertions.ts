export class RequiredElementError extends Error {
  constructor(description: string) {
    super(`${description}が見つかりませんでした`);
    this.name = "RequiredElementError";
  }
}

/**
 * DOM クエリ結果から必ず要素を取得するためのヘルパー。
 * 未取得時は明示的な例外を投げ、テスト失敗時の原因を判別しやすくする。
 */
export const requireFirstElement = <T extends Element>(
  elements: readonly T[],
  description: string
): T => {
  const [first] = elements;
  if (!first) {
    throw new RequiredElementError(description);
  }

  return first;
};

/**
 * `screen.getAllByRole` 等の結果を安全に扱うためのショートカット。
 */
export const getFirstByRoleOrThrow = <T extends Element>(
  elements: readonly T[],
  roleDescription: string
): T => requireFirstElement(elements, `${roleDescription} (role)`);
