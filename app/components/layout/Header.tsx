import { PrimaryButton } from "../ui/Buttons";
import Container from "./Container";
import Link from "next/link";
import ThemeSwitch from "../ui/ThemeSwitch";
import { auth } from "@/lib/auth";
import { UserMenu } from "../ui/UserMenu";
import { getUser } from "@/lib/account/user";
import HeaderSearch from "./HeaderSearch";
import { getUserNotifications } from "@/lib/data/social";

export default async function Header() {
	const session = await auth();
	const user = await getUser(session?.user);
	const notifications = user ? await getUserNotifications(user.id) : [];

	return (
		<header className="relative z-20 flex min-h-20 flex-row items-center justify-center border-b border-border bg-bg p-4 md:p-5">
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
