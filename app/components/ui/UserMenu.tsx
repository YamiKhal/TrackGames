"use client";

import { logout } from "@/lib/actions/auth";
import ThemeSwitch from "./ThemeSwitch";
import { Book, CircleQuestionMark, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import type { User } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type UserMenuProps = {
    user: User;
};

export function UserMenu({ user }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        function closeOnOutsideClick(event: MouseEvent) {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("keydown", closeOnEscape);
        document.addEventListener("mousedown", closeOnOutsideClick);

        return () => {
            document.removeEventListener("keydown", closeOnEscape);
            document.removeEventListener("mousedown", closeOnOutsideClick);
        };
    }, [isOpen]);

    const avatar = user.image ? (
        <Image src={user.image} alt={user.name ?? ""} className="rounded-full object-cover" width={40} height={40} />
    ) : (
        <span className="grid size-10 place-items-center rounded-full bg-surface text-text-muted">
            <UserIcon size={22} aria-hidden="true" />
        </span>
    );

    return (
        <div ref={menuRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded border border-border bg-bg-secondary px-1.5 pr-3 text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:size-10 md:border-0 md:bg-transparent md:p-0"
                aria-label={isOpen ? "Close user menu" : "Open user menu"}
                aria-expanded={isOpen}
                aria-controls="user-menu"
            >
                {avatar}
                {isOpen ? <X size={18} className="md:hidden" aria-hidden="true" /> : <Menu size={18} className="md:hidden" aria-hidden="true" />}
            </button>

            <button
                type="button"
                aria-label="Close user menu"
                onClick={() => setIsOpen(false)}
                className={`fixed inset-0 z-40 bg-overlay transition-opacity md:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
            />

            <div
                id="user-menu"
                role="menu"
                className={`fixed inset-y-0 right-0 z-50 flex w-[min(21rem,calc(100vw-1.5rem))] origin-right flex-col border-l border-border bg-bg-secondary text-sm text-text shadow-main transition duration-150 ease-out md:absolute md:inset-auto md:right-0 md:top-full md:mt-3 md:w-72 md:origin-top-right md:rounded md:border md:p-1.5 ${isOpen
                    ? "translate-x-0 opacity-100 md:translate-y-0 md:scale-100"
                    : "pointer-events-none translate-x-full opacity-0 md:translate-x-0 md:-translate-y-1 md:scale-95"}`}
            >
                <div className="flex items-center justify-between border-b border-border p-4 md:hidden">
                    {avatar}
                    <div className="min-w-0">
                        <p className="truncate font-bold text-text">{user.name ?? "Signed in"}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="grid size-9 cursor-pointer place-items-center rounded border border-border bg-bg text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Close user menu"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-border p-3 md:hidden">
                    <button
                        type="button"
                        className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded border border-border bg-bg font-bold text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <CircleQuestionMark size={24} aria-hidden="true" />
                    </button>
                    <ThemeSwitch className="h-10 w-full gap-2 font-bold" variant="button" />
                </div>

                <div className="flex flex-1 flex-col p-3 md:p-0">
                    <Link
                        role="menuitem"
                        tabIndex={isOpen ? undefined : -1}
                        href="/library"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded px-3 py-3 font-medium text-text-muted transition-colors hover:bg-primary hover:text-text focus:bg-primary focus:text-text focus:outline-none md:py-2.5"
                    >
                        <Book size={17} aria-hidden="true" />
                        Library
                    </Link>
                    <Link
                        role="menuitem"
                        tabIndex={isOpen ? undefined : -1}
                        href="/account"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 rounded px-3 py-3 font-medium text-text-muted transition-colors hover:bg-primary hover:text-text focus:bg-primary focus:text-text focus:outline-none md:py-2.5"
                    >
                        <UserIcon size={17} aria-hidden="true" />
                        Account
                    </Link>

                    <form action={logout} className="mt-auto border-t border-border pt-2 md:mt-1 md:pt-1">
                        <button
                            role="menuitem"
                            type="submit"
                            tabIndex={isOpen ? undefined : -1}
                            className="flex w-full cursor-pointer items-center gap-3 rounded px-3 py-3 text-left font-medium text-error transition-colors hover:bg-error hover:text-text focus:bg-error focus:text-text focus:outline-none md:py-2.5"
                        >
                            <LogOut size={17} aria-hidden="true" />
                            Log out
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
