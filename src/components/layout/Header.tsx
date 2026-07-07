import Link from "next/link";
import Container from "@/components/layout/Container";
import HeaderSearch from "@/components/layout/HeaderSearch";
import { PrimaryButton } from "@/components/ui/control/Button";
import ThemeSwitch from "@/components/ui/ThemeSwitch";
import UserMenu from "@/components/ui/UserMenu";
import { auth } from "@/lib/auth";
import { getUserNotifications } from "@/lib/data/social/social";
import { getUser } from "@/lib/data/social/user";

export default async function Header() {
	const session = await auth();
	const user = await getUser(session?.user);
	const notifications = user ? await getUserNotifications(user.id) : [];

	return (
		<header className="relative z-nav flex min-h-20 flex-row items-center justify-center border-b border-border bg-bg p-4 md:p-5">
			<Container className="flex flex-row items-center justify-between gap-3">
				<Link href="/" className="min-w-0 shrink-0">
					<h1 className="text-xl font-bold text-text md:text-2xl">
						Track<span className="text-primary">Games</span>
					</h1>
				</Link>

				<div className="flex flex-row items-center gap-2 md:gap-3">
					<HeaderSearch />
					<ThemeSwitch className="hidden md:grid" />
					{user ? (
						<UserMenu user={user} notifications={notifications} />
					) : (
						<PrimaryButton href="/login?mode=login" className="px-4 md:px-6">
							Login
						</PrimaryButton>
					)}
				</div>
			</Container>
		</header>
	);
}
