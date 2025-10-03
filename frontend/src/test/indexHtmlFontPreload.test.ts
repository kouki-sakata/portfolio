import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));

const readIndexHtml = () => {
  const indexPath = resolve(currentDir, "..", "..", "index.html");
  return readFileSync(indexPath, "utf-8");
};

describe("index.html font preload", () => {
  it("フォントプリロードのlinkタグを含む", () => {
    const html = readIndexHtml();
    expect(html).toContain('rel="preload"');
    expect(html).toContain('as="style"');
    expect(html).toContain("fonts.gstatic.com");
  });
});
