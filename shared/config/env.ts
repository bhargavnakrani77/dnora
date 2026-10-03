/**
 * DNORA Luxury Lifestyle — Centralized Environment Configuration
 * Validates and exposes type-safe application configuration.
 */

export interface AppEnvConfig {
  databaseUrl: string;
  sessionSecret: string;
  adminEmail: string;
  adminPassword?: string;
  siteUrl: string;
  cloudinary: {
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
    isConfigured: boolean;
  };
  email: {
    resendApiKey?: string;
    emailFrom: string;
    isConfigured: boolean;
  };
  supabase: {
    url?: string;
    anonKey?: string;
    serviceRoleKey?: string;
    isConfigured: boolean;
  };
  isProduction: boolean;
  isDevelopment: boolean;
}

function getEnv(key: string, fallback = ""): string {
  return process.env[key] || fallback;
}

export const env: AppEnvConfig = {
  databaseUrl: getEnv("DATABASE_URL"),
  sessionSecret: getEnv(
    "SESSION_SECRET",
    getEnv("AUTH_SECRET", "dnora-luxury-secret-key-fallback-replace-in-prod-v1")
  ),
  adminEmail: getEnv("ADMIN_EMAIL", "admin@dnora.luxury"),
  adminPassword: getEnv("ADMIN_PASSWORD") || undefined,
  siteUrl: getEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  cloudinary: {
    cloudName: getEnv("CLOUDINARY_CLOUD_NAME") || undefined,
    apiKey: getEnv("CLOUDINARY_API_KEY") || undefined,
    apiSecret: getEnv("CLOUDINARY_API_SECRET") || undefined,
    isConfigured: Boolean(
      getEnv("CLOUDINARY_CLOUD_NAME") &&
      getEnv("CLOUDINARY_API_KEY") &&
      getEnv("CLOUDINARY_API_SECRET")
    ),
  },
  email: {
    resendApiKey: getEnv("RESEND_API_KEY") || undefined,
    emailFrom: getEnv("EMAIL_FROM", "DNORA Privé <concierge@dnora.luxury>"),
    isConfigured: Boolean(getEnv("RESEND_API_KEY") || getEnv("SMTP_HOST")),
  },
  supabase: {
    url: getEnv("NEXT_PUBLIC_SUPABASE_URL") || undefined,
    anonKey: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || undefined,
    serviceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY") || undefined,
    isConfigured: Boolean(getEnv("NEXT_PUBLIC_SUPABASE_URL") && getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
  },
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV !== "production",
};

/**
 * Validates critical environment variables at startup and emits safe diagnostics.
 */
export function validateEnvironment(): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!env.databaseUrl) {
    warnings.push("DATABASE_URL is missing. Database operations will fail.");
  }

  if (env.isProduction && env.sessionSecret.includes("fallback")) {
    warnings.push("SESSION_SECRET is using a default fallback in production. Set a 32+ character key.");
  }

  if (!env.cloudinary.isConfigured) {
    warnings.push("Cloudinary media upload is not configured. Media storage will fall back to local URLs.");
  }

  if (!env.email.isConfigured) {
    warnings.push("Email service (RESEND_API_KEY / SMTP) is not configured. Client emails will be simulated.");
  }

  return {
    isValid: Boolean(env.databaseUrl),
    warnings,
  };
}
