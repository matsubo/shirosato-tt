export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
      <div className="mx-auto max-w-7xl space-y-1.5">
        <p>
          Powered by AI TRI+{" "}
          <a
            href="https://x.com/ittriathlon"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/40 hover:decoration-foreground hover:text-foreground transition-colors"
          >
            @ittriathlon
          </a>
        </p>
        <p>
          公式サイト:{" "}
          <a
            href="https://shirosato-tt.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/40 hover:decoration-foreground hover:text-foreground transition-colors"
          >
            shirosato-tt.com
          </a>
        </p>
        <p>
          <a
            href="https://github.com/matsubo/shirosato-tt"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/40 hover:decoration-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </p>
        <p>&copy; 2026 しろさとTT200 TT Analytics</p>
      </div>
    </footer>
  );
}
