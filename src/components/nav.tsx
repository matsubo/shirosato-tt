import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <nav className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight">
            しろさとTT200
          </span>
          <span className="text-sm text-muted-foreground">Race Analytics</span>
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
