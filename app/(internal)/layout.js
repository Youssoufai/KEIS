import { Suspense } from "react";
import { requireUser } from "@/lib/auth/dal";
import { AppShell } from "@/components/shell/AppShell";

// Every route in this group requires a signed-in user. proxy.js redirects
// visitors without a session to the login page; requireUser() re-checks the
// account on the server. Per-page role checks are done by <PageGuard>.

export default function InternalLayout({ children }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}

async function AuthenticatedShell({ children }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}

function ShellFallback() {
  return (
    <div className="flex h-dvh">
      <div className="hidden w-60 shrink-0 bg-brand-strong lg:block" />
      <div className="flex-1 p-6 text-sm text-muted">Loading…</div>
    </div>
  );
}
