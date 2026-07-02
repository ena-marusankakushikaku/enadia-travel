// Guards against open-redirect: only allow same-origin, absolute paths as post-login targets.
export function getSafeRedirectPath(value: string | null, fallback = '/trips'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('://')) {
    return fallback;
  }
  return value;
}
