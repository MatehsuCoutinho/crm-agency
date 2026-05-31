const SEVEN_DAYS = 7 * 24 * 60 * 60;

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(
  name: string,
  value: string,
  maxAge: number = SEVEN_DAYS
) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}
