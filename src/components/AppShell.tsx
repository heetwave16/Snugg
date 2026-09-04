import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, House, ImageUp, UserRound, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/home", label: "Home", icon: House },
  { to: "/groups", label: "New / Join", icon: UsersRound },
  { to: "/upload", label: "Upload", icon: ImageUp },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/profile", label: "You", icon: UserRound },
] as const;

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="paper min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 px-5 pb-3 pt-5 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {action}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "press flex flex-1 flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-2xl transition-colors",
                    active ? "bg-primary/12" : "bg-transparent",
                  )}
                >
                  <Icon strokeWidth={1.6} className="size-5" />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rise card-soft mt-2 flex flex-col items-center gap-2 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-xs text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}
