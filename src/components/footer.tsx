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
            href="https://github.com/sponsors/matsubo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline decoration-muted-foreground/40 hover:decoration-foreground hover:text-foreground transition-colors"
          >
            <span className="text-pink-400">&#9829;</span> Sponsor
          </a>
        </p>
        <p className="inline-flex items-center gap-1">
          This work is licensed under{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-muted-foreground/40 hover:decoration-foreground hover:text-foreground transition-colors"
          >
            CC BY-SA 4.0
          </a>
          <img
            src="/cc.svg"
            alt="Creative Commons"
            className="inline-block ml-0.5"
            style={{ maxWidth: "1em", maxHeight: "1em" }}
          />
          <img
            src="/by.svg"
            alt="Attribution"
            className="inline-block ml-0.5"
            style={{ maxWidth: "1em", maxHeight: "1em" }}
          />
          <img
            src="/sa.svg"
            alt="Share Alike"
            className="inline-block ml-0.5"
            style={{ maxWidth: "1em", maxHeight: "1em" }}
          />
        </p>
      </div>
    </footer>
  );
}
