
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
        className="mr-6 flex items-center gap-2"
        aria-label="Back to homepage"
        >
        <FluxarLogo className="h-6 w-6 text-primary" />
        <span className="font-headline text-lg font-bold">Fluxar</span>
        </a>
    );
}


export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <Logo />
      <div className="ml-auto flex items-center gap-4">
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    </header>
  );
}
