const LOCALHOST_API_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export function getApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const normalizedConfiguredUrl = configuredUrl?.replace(/\/$/, "");

  if (!normalizedConfiguredUrl) return "/api";

  const isLocalhostApi = LOCALHOST_API_PATTERN.test(normalizedConfiguredUrl);

  if (typeof window === "undefined") {
    return isLocalhostApi ? "/api" : normalizedConfiguredUrl;
  }

  const isLocalhostBrowser =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocalhostApi && !isLocalhostBrowser) return "/api";

  return normalizedConfiguredUrl;
}
