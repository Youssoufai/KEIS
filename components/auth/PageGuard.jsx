import { checkPageAccess } from "@/lib/auth/dal";
import { ROLES } from "@/lib/config/constants";
import { ButtonLink } from "@/components/ui/Controls";

/**
 * Server-side page authorisation. Wrap each authenticated page's content:
 * the content is only rendered (and sent to the browser) when the signed-in
 * user's role may open `path` (lib/config/navigation.js).
 */
export async function PageGuard({ path, children }) {
  const { user, allowed } = await checkPageAccess(path);
  if (allowed) return children;
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-md border border-border bg-surface px-6 py-10 text-center">
      <p className="text-lg font-semibold">You don&apos;t have access to this section</p>
      <p className="mt-2 text-sm text-muted">
        Your account role (<strong>{ROLES[user.role]?.label}</strong>) does not include this module. If you need access,
        ask a System Administrator to update your account.
      </p>
      <ButtonLink href="/dashboard" variant="secondary" className="mt-5">
        Back to overview
      </ButtonLink>
    </div>
  );
}
