"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { User } from "next-auth";
import { ArrowRight, Bell, BellOff, Book, LogOut, Menu, Settings, User as UserIcon } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import MenuPanel from "@/components/ui/MenuPanel";
import ThemeSwitch from "@/components/ui/ThemeSwitch";
import AvatarPreview from "@/components/user/AvatarView";
import { logout } from "@/lib/actions/account/auth";
import { markNotificationsRead } from "@/lib/actions/social/social";
import { deferHook } from "@/lib/util/client/func";

type Notification = Readonly<{
	id: string;
	type: string;
	targetType: string | null;
	targetId: string | null;
	targetHref: string;
	readAt: Date | string | null;
	createdAt: Date | string;
	actor: {
		name: string | null;
	} | null;
}>;

type UserMenuProps = Readonly<{
	user: User;
	notifications: Notification[];
}>;

function Notifications({ notifications, onClose }: Readonly<{ notifications: Notification[]; onClose: () => void }>) {
	return notifications.length ? (
		notifications.map((notification) => (
			<Link
				key={notification.id}
				href={notification.targetHref}
				onClick={onClose}
				className="rounded px-3 py-3 text-text-muted transition-colors hover:bg-primary hover:text-text focus:bg-primary focus:text-text focus:outline-none md:py-2"
			>
				<p>{notificationText(notification)}</p>
				<p className="mt-1 text-xs opacity-75">{new Date(notification.createdAt).toLocaleDateString()}</p>
			</Link>
		))
	) : (
		<EmptyState icon={BellOff} message="No notifications yet." />
	);
}

function notificationText(notification: Notification) {
	const actor = notification.actor?.name ?? "Someone";

	if (notification.type === "COMMENT_REPLY") return `${actor} replied to your comment.`;
	if (notification.type === "COMMENTED_ON_PROFILE") return `${actor} commented on your profile.`;
	if (notification.type === "RECEIVED_LIKE") return `${actor} liked your post.`;
	if (notification.type === "FOLLOWED_USER") return `${actor} followed you.`;
	if (notification.type === "FOLLOWING_CREATED_LIST") return `${actor} created a new list.`;
	if (notification.type === "EARNED_BADGE") return "You earned a badge.";
	return "New notification.";
}

export default function UserMenu({ user, notifications }: UserMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [view, setView] = useState<"menu" | "notifications">("menu");
	const [unread, setUnread] = useState(notifications.some((notification) => !notification.readAt));
	const [isSmallScreen, setIsSmallScreen] = useState(false);
	const [pending, startTransition] = useTransition();
	const buttonRef = useRef<HTMLButtonElement>(null);

	function update(event: MediaQueryListEvent | MediaQueryList) {
		return deferHook(() => {
			setIsSmallScreen(event.matches);
		});
	}

	useEffect(() => {
		const query = globalThis.matchMedia("(max-width: 767px)");

		update(query);

		query.addEventListener("change", update);

		return () => query.removeEventListener("change", update);
	}, []);

	function closeMenu() {
		setIsOpen(false);
		setView("menu");
	}

	function openNotifications() {
		setView("notifications");

		if (unread) {
			setUnread(false);
			startTransition(async () => {
				await markNotificationsRead();
			});
		}
	}

	return (
		<div className="relative">
			<button
				ref={buttonRef}
				type="button"
				onClick={() => setIsOpen((open) => !open)}
				className="relative grid size-11 cursor-pointer place-items-center text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none md:size-10 md:border-0 md:bg-transparent"
				aria-label="Manage user menu"
				aria-expanded={isOpen}
				aria-controls="user-menu"
			>
				<AvatarPreview image={user.image} size={7} priority alt={`${user.name ?? "user"} profile image`} className="hidden md:flex" />
				{isOpen ? <ArrowRight size={18} className="md:hidden" aria-hidden="true" /> : <Menu size={18} className="md:hidden" aria-hidden="true" />}
				{unread && (
					<span className="absolute top-0 right-0 left-8 grid size-5 place-items-center rounded-full bg-error text-text">
						<Bell size={12} aria-hidden="true" />
					</span>
				)}
			</button>
			<MenuPanel
				id="user-menu"
				open={isOpen}
				onClose={closeMenu}
				variant={isSmallScreen ? "drawer-right" : "anchored"}
				width={isSmallScreen ? "21rem" : undefined}
				role="menu"
				shouldShowClose={false}
				anchorRef={buttonRef}
				panelClassName="flex flex-col text-text md:w-72 md:p-1.5"
			>
				{view === "notifications" ? (
					<>
						<div className="flex items-center justify-between gap-2 border-b border-border p-3 md:p-2 md:pb-3">
							<h2 className="font-bold text-text">Notifications</h2>
							<button
								type="button"
								onClick={() => setView("menu")}
								className="grid size-9 cursor-pointer place-items-center rounded text-text-muted transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
								aria-label="Back to user menu"
							>
								<ArrowRight size={18} aria-hidden="true" />
							</button>
						</div>

						<div className="flex flex-1 flex-col overflow-y-auto p-3 md:max-h-96 md:p-1">
							<Notifications notifications={notifications} onClose={closeMenu} />
						</div>
					</>
				) : (
					<>
						<div className="flex items-center justify-between p-4 pb-2 md:hidden">
							<AvatarPreview image={user.image} size={12} priority alt={`${user.name ?? "user"} profile image`} />
							<div className="min-w-0">
								<p className="truncate font-bold text-text">{user.name ?? "Signed in"}</p>
							</div>
							<button
								type="button"
								onClick={closeMenu}
								className="grid size-9 cursor-pointer place-items-center text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
								aria-label="Close user menu"
							>
								<ArrowRight size={18} aria-hidden="true" />
							</button>
						</div>

						<div className="grid grid-cols-2 gap-2 border-b border-border p-3 md:hidden">
							<ThemeSwitch className="h-10 w-full gap-2 font-bold" variant="button" />
							<button
								type="button"
								disabled={pending}
								onClick={openNotifications}
								className="relative flex h-10 cursor-pointer items-center justify-center gap-2 rounded border border-border bg-bg font-bold text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
								aria-label="Show notifications"
							>
								<Bell size={18} aria-hidden="true" />
								{unread && <span className="absolute top-2 right-2 size-2 rounded-full bg-error" />}
							</button>
						</div>

						<div className="flex flex-1 flex-col p-3 md:p-0">
							<div className="text-md mb-2 hidden flex-row items-center justify-between rounded bg-surface p-1 pr-3 pl-3 text-center font-bold text-text sm:flex">
								<p>{user.name ?? "Signed in"}</p>
								<button
									type="button"
									disabled={pending}
									onClick={openNotifications}
									className="relative grid size-7 cursor-pointer place-items-center rounded text-text-muted transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-wait"
									aria-label="Show notifications"
								>
									<Bell size={17} aria-hidden="true" />
									{unread && <span className="absolute top-1 right-1 size-2 rounded-full bg-error" />}
								</button>
							</div>
							<Link
								role="menuitem"
								tabIndex={isOpen ? undefined : -1}
								href={`/library/${user.name}`}
								onClick={closeMenu}
								className="flex items-center gap-3 rounded px-3 py-3 font-medium text-text-muted transition-colors hover:bg-primary hover:text-text focus:bg-primary focus:text-text focus:outline-none md:py-2.5"
							>
								<Book size={17} aria-hidden="true" />
								Library
							</Link>
							<Link
								role="menuitem"
								tabIndex={isOpen ? undefined : -1}
								href={`/u/${encodeURIComponent(user.name ?? "who")}?tab=profile`}
								onClick={closeMenu}
								className="flex items-center gap-3 rounded px-3 py-3 font-medium text-text-muted transition-colors hover:bg-primary hover:text-text focus:bg-primary focus:text-text focus:outline-none md:py-2.5"
							>
								<UserIcon size={17} aria-hidden="true" />
								Profile
							</Link>
							<Link
								role="menuitem"
								tabIndex={isOpen ? undefined : -1}
								href={`/settings`}
								onClick={closeMenu}
								className="flex items-center gap-3 rounded px-3 py-3 font-medium text-text-muted transition-colors hover:bg-primary hover:text-text focus:bg-primary focus:text-text focus:outline-none md:py-2.5"
							>
								<Settings size={17} aria-hidden="true" />
								Settings
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
					</>
				)}
			</MenuPanel>
		</div>
	);
}
