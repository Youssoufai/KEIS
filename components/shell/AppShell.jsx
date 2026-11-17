"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { NAV_ITEMS, breadcrumbsFor } from "@/lib/config/navigation";
import { useHydrated } from "@/lib/store/store";
import { cx } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { UserProvider } from "@/components/auth/UserProvider";
import { PrototypeBanner } from "./PrototypeBanner";
import { GlobalSearch } from "./GlobalSearch";
import { ProfileMenu } from "./ProfileMenu";

const COLLAPSE_KEY = "kogi-ren:nav-collapsed";
const collapseListeners = new Set();
function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}
function writeCollapsed(value) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
  } catch {}
  collapseListeners.forEach((l) => l());
}
function subscribeCollapsed(listener) {
  collapseListeners.add(listener);
  return () => collapseListeners.delete(listener);
}
/** Routes that use the whole workspace (no page padding, no page scroll). */
const FULL_BLEED = ["/map"];

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(href + "/");
}

function Brand({ collapsed }) {
  return (
    <Link href="/dashboard" className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/10 px-4">
      <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-white/10 text-white" aria-hidden>
        <Icon name="bolt" className="size-4" />
      </span>
      {!collapsed && (
        <span className="min-w-0 leading-tight">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">Kogi State</span>
          <span className="block truncate text-[13px] font-semibold text-white">Electrification Planning</span>
        </span>
      )}
    </Link>
  );
}

function Sidebar({ role, pathname, collapsed, onNavigate, onToggleCollapse }) {
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));
  return (
    <nav aria-label="Main" className="flex h-full flex-col bg-brand-strong text-slate-200">
      <Brand collapsed={collapsed} />
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cx(
                  "relative flex items-center gap-3 rounded-sm px-2.5 py-2 text-[13px] transition-colors",
                  active ? "bg-white/10 font-semibold text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-sky-300" aria-hidden />}
                <Icon name={item.icon} className="size-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
              {!collapsed && active && item.children && (
                <ul className="mb-1 ml-[22px] mt-0.5 border-l border-white/10 pl-3">
                  {item.children.map((c) => {
                    const childActive = pathname === c.href;
                    return (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          onClick={onNavigate}
                          aria-current={childActive ? "page" : undefined}
                          className={cx(
                            "block rounded-sm px-2 py-1.5 text-[12.5px]",
                            childActive ? "font-semibold text-white" : "text-slate-400 hover:text-white",
                          )}
                        >
                          {c.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <div className="border-t border-white/10 p-2">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cx("flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white", collapsed && "justify-center px-0")}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            <Icon name={collapsed ? "expand" : "collapse"} className="size-4" />
            {!collapsed && "Collapse"}
          </button>
        )}
      </div>
    </nav>
  );
}

function Breadcrumbs({ pathname }) {
  const trail = breadcrumbsFor(pathname);
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <li className="hidden shrink-0 text-muted sm:block">
          <Link href="/dashboard" className="hover:text-foreground">Kogi REN</Link>
        </li>
        {trail.map((c, i) => (
          <li key={c.href} className="flex min-w-0 items-center gap-1.5">
            <Icon name="chevronRight" className={cx("size-3.5 shrink-0 text-border-strong", i === 0 && "hidden sm:block")} />
            {i === trail.length - 1 ? (
              <span aria-current="page" className="truncate font-semibold text-foreground">{c.label}</span>
            ) : (
              <Link href={c.href} className="truncate text-muted hover:text-foreground">{c.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Authenticated application frame. `user` is verified on the server
 * (app/(internal)/layout.js); page access is enforced server-side by PageGuard.
 */
export function AppShell({ user, children }) {
  const pathname = usePathname();
  const role = user.role;
  const hydrated = useHydrated();
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const fullBleed = FULL_BLEED.includes(pathname);

  const toggleCollapse = () => writeCollapsed(!collapsed);

  return (
    <UserProvider user={user}>
    <div className="flex h-dvh flex-col overflow-hidden print:h-auto print:overflow-visible">
      <PrototypeBanner />
      <div className="flex min-h-0 flex-1">
        <aside className={cx("no-print hidden shrink-0 transition-[width] duration-150 lg:block", collapsed ? "w-16" : "w-60")}>
          <Sidebar role={role} pathname={pathname} collapsed={collapsed} onToggleCollapse={toggleCollapse} />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="absolute inset-0 bg-brand-strong/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-xl">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-2 top-3 z-10 rounded-sm p-1.5 text-white hover:bg-white/10"
                aria-label="Close menu"
              >
                <Icon name="close" className="size-5" />
              </button>
              <Sidebar role={role} pathname={pathname} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-sm p-1.5 text-foreground hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Icon name="menu" className="size-5" />
            </button>
            <Breadcrumbs pathname={pathname} />
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <GlobalSearch />
              <ProfileMenu />
            </div>
          </header>
          <main
            id="main"
            className={cx(
              "min-h-0 flex-1 print:overflow-visible",
              fullBleed ? "relative overflow-hidden" : "overflow-y-auto px-4 py-5 sm:px-6 lg:px-8",
            )}
          >
            {!hydrated ? (
              <p className="p-6 text-sm text-muted">Loading…</p>
            ) : fullBleed ? (
              children
            ) : (
              <div className="mx-auto max-w-[1400px]">{children}</div>
            )}
          </main>
        </div>
      </div>
    </div>
    </UserProvider>
  );
}
