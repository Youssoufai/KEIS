import { Suspense } from "react";
import { APP_NAME } from "@/lib/config/constants";
import { PILOT_LGAS } from "@/lib/config/pilot";
import { Icon } from "@/components/ui/Icon";
import { LoginForm } from "@/components/auth/LoginForm";
import { DEMO_AUTH } from "@/lib/auth/mode";

export const metadata = { title: "Sign in" };

// "/" is the login page. Signed-in users are redirected to /dashboard by proxy.js.
export default function LoginPage({ searchParams }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-brand-strong text-white" aria-hidden>
              <Icon name="bolt" className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Kogi State Government</p>
              <p className="text-[15px] font-semibold text-foreground">Rural Electrification Planning Platform</p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface p-6 shadow-sm sm:p-7">
            <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted">For authorised personnel only.</p>
            <Suspense fallback={<div className="h-72" />}>
              <LoginFormFromParams searchParams={searchParams} />
            </Suspense>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-muted">
            {APP_NAME}. Pilot coverage: {PILOT_LGAS.map((l) => l.name).join(", ")} LGAs. Access is restricted to
            accounts issued by the system administrator; use of this system may be monitored.
          </p>
        </div>
      </main>
    </div>
  );
}

async function LoginFormFromParams({ searchParams }) {
  const { next, reason } = await searchParams;
  return <LoginForm demo={DEMO_AUTH} next={typeof next === "string" ? next : ""} reason={typeof reason === "string" ? reason : ""} />;
}
