import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  typedRoutes: true,
  turbopack: {
    root: __dirname
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload"
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
            "font-src 'self'",
            "connect-src 'self' https://api.stripe.com https://*.supabase.co https://*.ingest.sentry.io",
            "frame-src https://js.stripe.com https://hooks.stripe.com",
            "base-uri 'self'",
            "form-action 'self'"
          ].join("; ")
        }
      ]
    }
  ]
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true
});
