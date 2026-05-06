// PT Storage utilities — placeholder
// TODO: Implement localStorage helpers in Day 5

export function saveSession(key: string, data: unknown): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export function loadSession<T>(key: string): T | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

export function clearSession(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
}
