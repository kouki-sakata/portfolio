import { createRoot } from "react-dom/client";

import { AppProviders } from "@/app/providers/AppProviders";
import { setupZodErrorMap } from "@/shared/lib/zod-error-map";

// グローバルにZodエラーマップを適用（アプリケーション起動前に実行）
setupZodErrorMap();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find root element");
}

createRoot(rootElement).render(<AppProviders />);
