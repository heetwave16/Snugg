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
    <div className="min-h-screen bg-background pb-28 text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs font-medium text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "press flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-all",
                    active ? "bg-primary/15 text-primary" : "bg-transparent text-muted-foreground",
                  )}
                >
                  <Icon strokeWidth={active ? 2.2 : 1.8} className="size-5" />
                </div>
                <span className={cn("tracking-tight", active && "font-semibold")}>{label}</span>
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
    <div className="rise mt-3 flex flex-col items-center gap-2.5 rounded-3xl border border-border/60 bg-card/60 px-6 py-12 text-center backdrop-blur-sm">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
        <ImageUp className="size-6" strokeWidth={1.7} />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
