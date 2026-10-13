export const DEFAULT_ADMIN_EMAILS = [
  'jmjcko@gmail.com',
  'jan.mynar@gmail.com',
];

/**
 * Checks if a given email is whitelisted as an administrator.
 */
export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const envAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAILS
    ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
    : [];
  const allowed = [...DEFAULT_ADMIN_EMAILS, ...envAdmins].map((e) => e.toLowerCase());
  return allowed.includes(email.trim().toLowerCase());
}
