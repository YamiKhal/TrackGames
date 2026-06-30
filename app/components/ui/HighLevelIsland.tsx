"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { deferEffect } from "@/lib/util/effects";

export default function HighLevelIsland({ children, className = "" }: { children: ReactNode; className?: string }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		return deferEffect(() => {
			setMounted(true);
		});
	}, []);

	if (!mounted) return null;

	return createPortal(<div className={`pointer-events-none fixed inset-0 z-1000 ${className}`}>{children}</div>, document.body);
}
