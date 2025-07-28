
import Link from "next/link";

function FluxarLogo({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
        </svg>
    );
}

function Logo() {
    return (
        <a
        href="#"
        className="flex items-center gap-2"
        aria-label="Back to homepage"
        >
        <FluxarLogo className="h-6 w-6" />
        <span className="sr-only">Fluxar</span>
        </a>
    );
}

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-10 md:h-24 md:flex-row md:py-6">
        <div className="flex flex-col items-center gap-4 px-4 md:flex-row md:gap-2 md:px-0">
          <Logo />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 Fluxar. Todos os direitos reservados.
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sobre
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Blog
          </Link>
           <Link
            href="#"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Suporte
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Termos de Uso
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Política de Privacidade
          </Link>
        </nav>
      </div>
    </footer>
  );
}
