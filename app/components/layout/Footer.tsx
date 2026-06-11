import Link from "next/link";
import Container from "./Container";

export default function Footer() {
    const links = [
        { href: "/about", label: "About" },
        { href: "/games", label: "Games" },
        { href: "/account", label: "Account" },
        { href: "/contact", label: "Contact" },
        { href: "/privacy", label: "Privacy" },
        { href: "/terms", label: "Terms" },
    ];

    return (
        <footer className="relative z-20 border-t border-border bg-bg">
            <Container className="flex min-h-20 flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-text">Track<span className="text-primary">Games</span></h1>
                    <p className="max-w-xs text-xs text-text-faint">Game data and imagery provided by IGDB</p>
                </div>
                <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-medium text-text-muted">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href} className="transition-colors hover:text-text">
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </Container>
            <div className="border-t border-border p-5">
                <p className="text-center text-xs text-text-faint">
                    @ 2026 TrackGames - <span className="text-bold">v1.0</span>
                </p>
            </div>
        </footer>
    )
}
