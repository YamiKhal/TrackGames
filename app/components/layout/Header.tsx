import { PrimaryButton } from "../ui/Buttons";
import { CircleQuestionMark } from "lucide-react";
import Container from "./Container";
import Link from "next/link";
import ThemeSwitch from "../ui/ThemeSwitch";
import { auth } from "@/lib/auth";
import { UserMenu } from "../ui/UserMenu";
import { getUser } from "@/lib/account/user";

export default async function Header() {
    const session = await auth();
    const user = await getUser(session?.user);

    return (
        <header className="relative z-20 flex min-h-20 flex-row items-center justify-center border-b border-border bg-bg p-4 sm:p-5">
            <Container className="flex flex-row justify-between items-center">
                <Link href="/" className="min-w-0">
                    <h1 className="text-xl font-bold text-text sm:text-2xl">Track<span className="text-primary">Games</span></h1>
                </Link>
                <div className="flex flex-row items-center gap-2 sm:gap-3 md:gap-8">
                    <button
                        type="button"
                        className="hidden cursor-pointer text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:grid"
                        aria-label="Help"
                    >
                        <CircleQuestionMark size={24} aria-hidden="true" />
                    </button>
                    <ThemeSwitch className="hidden md:grid" />
                    {user ? (
                        <UserMenu user={user} />
                    ) : (
                        <PrimaryButton href="/login?mode=login" className="px-4 sm:px-6">Login</PrimaryButton>
                    )}
                </div>
            </Container>
        </header>
    )
}
