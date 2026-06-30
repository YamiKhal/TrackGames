"use client";

import { deferEffect } from "@/lib/util/effects";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeSwitchProps = Readonly<{
	className?: string;
	shouldShowLabel?: boolean;
	variant?: "plain" | "button";
}>;

export default function ThemeSwitch({ className = "", variant = "plain" }: ThemeSwitchProps) {
	const [dark, setDark] = useState(true);

	function toggleTheme() {
		const html = document.documentElement;

		html.classList.toggle("dark");

		const newDark = html.classList.contains("dark");

		setDark(newDark);

		localStorage.setItem("theme", newDark ? "dark" : "light");
	}

	useEffect(() => {
		const isDark = document.documentElement.classList.contains("dark");

		const deferSetter = deferEffect(() => {
			setDark(isDark);
		});

		const saved = localStorage.getItem("theme");

		if (saved === "light") {
			document.documentElement.classList.remove("dark");
			return deferEffect(() => {
				setDark(false);
				deferSetter();
			});
		}

		if (saved === "dark") {
			document.documentElement.classList.add("dark");
			return deferEffect(() => {
				setDark(true);
				deferSetter();
			});
		}
	}, []);

	const Icon = dark ? Sun : Moon;
	const classes =
		variant === "button"
			? "grid size-10 cursor-pointer place-items-center rounded border border-border bg-bg text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
			: "grid size-10 cursor-pointer place-items-center text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

	return (
		<button type="button" onClick={toggleTheme} className={`${classes} ${className}`} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
			<Icon size={24} aria-hidden="true" />
		</button>
	);
}
