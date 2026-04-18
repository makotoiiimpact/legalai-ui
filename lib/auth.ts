const STORAGE_KEY = "legalai_auth";

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "ok";
}

export function setAuthed(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, "ok");
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function checkPasscode(input: string): boolean {
  const expected = process.env.NEXT_PUBLIC_PASSCODE;
  if (!expected) return false;
  return input === expected;
}
