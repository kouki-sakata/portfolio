import { z } from "zod";

type Env = {
  readonly VITE_API_BASE_URL?: string;
};

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().optional(),
});

const parsedEnv = envSchema.parse(import.meta.env as Env);

export const getEnv = () => ({
  apiBaseUrl: parsedEnv.VITE_API_BASE_URL ?? "/api",
});
