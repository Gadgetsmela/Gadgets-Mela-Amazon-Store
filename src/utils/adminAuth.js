export const ADMIN_SESSION_KEY = 'gadgets-mela-admin-authenticated';

export function getConfiguredAdminPassword() {
  return import.meta.env.VITE_ADMIN_PASSWORD || 'gadgets-mela-admin';
}

export function isAdminAuthenticated() {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}
