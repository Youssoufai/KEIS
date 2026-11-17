"use client";

import { useActionState, useState } from "react";
import { login } from "@/app/actions/auth";
import { Button, Field, Input } from "@/components/ui/Controls";
import { Notice } from "@/components/ui/Card";

const NOTICES = {
  "signed-out": "Your session has ended. Please sign in again.",
};

export function LoginForm({ next = "", reason = "", demo = false }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const notice = !state && NOTICES[reason];
  const fe = state?.fieldErrors || {};

  return (
    <form action={action} noValidate className="mt-5 space-y-4">
      <input type="hidden" name="next" value={next} />

      {state?.error && (
        <Notice tone="danger" className="text-[13px]">
          <span role="alert">{state.error}</span>
        </Notice>
      )}
      {notice && <Notice tone="info" className="text-[13px]">{notice}</Notice>}
      {demo && (
        <Notice tone="warning" className="text-[13px]">
          Demo mode: sign-in is open. Any email and password (or none) opens the platform as a demo administrator.
        </Notice>
      )}

      <Field label="Email or username" htmlFor="identifier">
        <Input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required={!demo}
          defaultValue={state?.values?.identifier ?? ""}
          aria-invalid={fe.identifier ? true : undefined}
          aria-describedby={fe.identifier ? "identifier-error" : undefined}
        />
        {fe.identifier && <p id="identifier-error" className="text-xs text-critical">{fe.identifier}</p>}
      </Field>

      <Field label="Password" htmlFor="password">
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required={!demo}
            className="pr-16"
            aria-invalid={fe.password ? true : undefined}
            aria-describedby={fe.password ? "password-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-brand hover:text-brand-strong"
            aria-controls="password"
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {fe.password && <p id="password-error" className="text-xs text-critical">{fe.password}</p>}
      </Field>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="remember"
          defaultChecked={state?.values?.remember ?? false}
          className="size-4 rounded-sm border-border accent-brand"
        />
        Keep me signed in for 30 days
      </label>

      <Button type="submit" className="w-full py-2.5" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-xs text-muted">
        Forgot your password or need an account? Contact your system administrator.
      </p>
    </form>
  );
}
