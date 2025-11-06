"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  username?: string;
  elo?: number;
}

export function Navbar({ username, elo }: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/lobby", label: "Lobby" },
    { href: "/local-play", label: "Local Play" },
    { href: "/players", label: "Players" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/match-history", label: "Match History" },
  ];

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/lobby" className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Courser</h1>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className={cn(
                      "font-medium",
                      pathname === item.href && "bg-secondary"
                    )}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {username && (
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">{username}</span>
                {elo && (
                  <span className="font-semibold text-foreground">
                    ELO: {elo}
                  </span>
                )}
              </div>
            )}
            <ThemeToggle />
            <Button variant="ghost" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
