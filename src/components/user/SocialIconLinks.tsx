"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { socialPlatformIcons } from "@/components/config";
import type { SocialLink } from "@/lib/types";
import { LinkType } from "@/lib/types";
import { joinClass } from "@/lib/util/client/func";
import { getSocialPlatform } from "@/lib/util/parse/socials";

export default function SocialIconLinks({ socials }: Readonly<{ socials: SocialLink[] }>) {
	const [copiedKey, setCopiedKey] = useState<string | null>(null);

	if (socials.length === 0) return null;

	async function manageCopyClick(social: SocialLink, key: string) {
		await navigator.clipboard.writeText(social.value);
		setCopiedKey(key);
		globalThis.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1600);
	}

	return (
		<div className="flex flex-wrap items-center md:pt-1" aria-label="Social links">
			{socials.map((social, index) => {
				const platform = getSocialPlatform(social.platform, social.kind);

				if (!platform) return null;

				const Icon = socialPlatformIcons[platform.id as keyof typeof socialPlatformIcons];
				const key = `${social.platform}-${social.kind}-${index}`;
				const copied = copiedKey === key;

				if (social.kind === LinkType.COPY) {
					return (
						<button
							key={key}
							type="button"
							onClick={() => manageCopyClick(social, key)}
							className={joinClass(
								"relative flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors",
								copied ? "text-success" : "text-text-muted hover:text-primary",
							)}
							aria-label={`Copy Username`}
							title={copied ? "Copied" : `Copy Username`}
						>
							{copied ? <Check size={16} aria-hidden className="shrink-0" /> : <Icon size={16} title="" aria-hidden className="shrink-0" />}
							{copied && (
								<span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-success px-2 py-0.5 text-[0.65rem] font-bold whitespace-nowrap text-bg shadow-main">
									Copied!
								</span>
							)}
						</button>
					);
				}

				return (
					<a
						key={key}
						href={social.value}
						target="_blank"
						rel="noopener noreferrer"
						className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:text-primary"
						aria-label={platform.label}
						title={`Open ${platform.label}`}
					>
						<Icon size={16} title="" aria-hidden className="shrink-0" />
					</a>
				);
			})}
		</div>
	);
}
