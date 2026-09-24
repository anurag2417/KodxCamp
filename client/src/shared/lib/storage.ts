const STORAGE_PREFIX = 'kodxcamp:';

export function readStoredValue<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return value === null ? null : (JSON.parse(value) as T);
  } catch {
    return null;
  }
}

export function writeStoredValue<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Storage can be unavailable or full; code execution should still work.
  }
}