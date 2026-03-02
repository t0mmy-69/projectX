export function getAuthHeaders(includeContentType: boolean = true): Record<string, string> {
  if (typeof window === 'undefined') return includeContentType ? { 'Content-Type': 'application/json' } : {};

  const stored = localStorage.getItem('narrativeOS_auth');
  if (!stored) return includeContentType ? { 'Content-Type': 'application/json' } : {};

  try {
    const u = JSON.parse(stored);
    return {
      ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${u.token}`,
      'x-user-id': u.id,
    };
  } catch {
    return includeContentType ? { 'Content-Type': 'application/json' } : {};
  }
}
