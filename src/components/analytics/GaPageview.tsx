"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const DYNAMIC_PREFIXES = ["game", "library", "playlist", "u"];

function normalizePath(path: string) {
	const collapsed = path.replace(new RegExp(`^/(${DYNAMIC_PREFIXES.join("|")})/[^/]+.*$`), "/$1/:id");
	return collapsed.replace(/\/+$/, "") || "/";
}

export default function GaPageview() {
	const pathname = usePathname();

	useEffect(() => {
		if (typeof window.gtag !== "function") return;
		const page = normalizePath(pathname);
		window.gtag("event", "page_view", {
			page_path: page,
			page_location: `${window.location.origin}${page}`,
			page_title: document.title,
		});
	}, [pathname]);

	return null;
}
