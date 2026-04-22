import type { NextConfig } from "next";

const LOCALHOST_API_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function resolveBackendUrl(): string {
  const configuredBackendUrl =
    process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  const normalizedBackendUrl = configuredBackendUrl.trim().replace(/\/$/, "");
  const isLocalhostBackend = LOCALHOST_API_PATTERN.test(normalizedBackendUrl);

  if (
    process.env.NODE_ENV === "production" &&
    (!normalizedBackendUrl || isLocalhostBackend)
  ) {
    throw new Error(
      "Production build requires BACKEND_URL (or NEXT_PUBLIC_API_URL) to be set to a public non-localhost API URL."
    );
  }

  if (normalizedBackendUrl) return normalizedBackendUrl;
  return "http://localhost:3001";
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    domains: [],
  },
  async rewrites() {
    const backendUrl = resolveBackendUrl();

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
