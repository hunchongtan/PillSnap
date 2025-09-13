import { z } from "zod";

function requireEnv<T>(name: string, schema: z.ZodType<T>, hint?: string): T {
  const raw = process.env[name];
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => i.message).join(", ");
    const extra = hint ? ` ${hint}` : "";
    throw new Error(`Missing/invalid env ${name}: ${detail}.${extra}`);
  }
  return parsed.data;
}

// Lazily validate on access to avoid failing during build-time imports
export const env = {
  get OPENAI_API_KEY() {
    return requireEnv("OPENAI_API_KEY", z.string().min(1, "OPENAI_API_KEY is required"));
  },
  get ROBOFLOW_API_KEY() {
    return requireEnv("ROBOFLOW_API_KEY", z.string().min(1, "ROBOFLOW_API_KEY is required"));
  },
  get ROBOFLOW_MODEL_URL() {
    return requireEnv(
      "ROBOFLOW_MODEL_URL",
      z.string().url("ROBOFLOW_MODEL_URL must be a valid URL")
    );
  },
  get NEXT_PUBLIC_SUPABASE_URL() {
    return requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
    );
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
    );
  },
} as const;
