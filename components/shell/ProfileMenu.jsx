"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ROLES } from "@/lib/config/constants";
import { can } from "@/lib/config/navigation";
import { resetDemoData } from "@/lib/store/store";
import { logout } from "@/app/actions/auth";
import { useCurrentUser } from "@/components/auth/UserProvider";
import { Icon } from "@/components/ui/Icon";

/** Signed-in user's menu: identity, settings, admin demo tools and sign-out. */
export function ProfileMenu() {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initials = user.name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const roleLabel = ROLES[user.role]?.label ?? user.role;

  useEffect(() => {
    const onDoc = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-sm px-1.5 py-1 hover:bg-slate-100"
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand text-xs font-semibold text-white">{initials}</span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-40 truncate text-[13px] font-medium">{user.name}</span>
          <span className="block text-[11px] text-muted">{ROLES[user.role]?.short}</span>
        </span>
        <Icon name="chevronDown" className="hidden size-4 text-muted md:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-72 rounded-sm border border-border bg-white py-2 shadow-lg">
          <div className="px-3 pb-2">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1.5 inline-block rounded-sm bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand-ink">{roleLabel}</p>
          </div>
          <div className="border-t border-border pt-1">
            <MenuLink href="/settings" icon="sliders" onClick={() => setOpen(false)}>Assumptions &amp; settings</MenuLink>
            {can(user.role, "resetDemoData") && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  if (window.confirm("Reset sample workflow data?\n\nChanges made in this browser to sample reports, verifications, assessments and assumptions are replaced with the original sample records. Geospatial data is not affected.")) {
                    resetDemoData();
                    setOpen(false);
                  }
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <Icon name="reset" className="size-4 text-muted" />
                Reset sample data
              </button>
            )}
          </div>
          <form action={logout} className="mt-1 border-t border-border pt-1">
            <button type="submit" role="menuitem" className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-slate-50">
              <Icon name="arrow" className="size-4 text-muted" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, children, onClick }) {
  return (
    <Link href={href} role="menuitem" onClick={onClick} className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50">
      <Icon name={icon} className="size-4 text-muted" />
      {children}
    </Link>
  );
}
