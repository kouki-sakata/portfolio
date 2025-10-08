import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

const featureFlagHandler = http.get("/api/public/feature-flags", () =>
  HttpResponse.json({})
);

const featureFlagHandlerWithHost = http.get(
  "http://localhost/api/public/feature-flags",
  () => HttpResponse.json({})
);

export const mswServer = setupServer(
  featureFlagHandler,
  featureFlagHandlerWithHost
);
