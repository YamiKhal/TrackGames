"use client";

import { ImageIdToURL } from "@/lib/external/igdb/util";
import Image from "next/image";
import { useState } from "react";
import HorizontalScroller from "./HorizontalScroller";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

type MediaItem =
	| {
			type: "video";
			id: string;
	  }
	| {
			type: "image";
			id: string;
	  };

export default function MediaGallery({ media }: Readonly<{ media: MediaItem[] }>) {
	const [mediaActive, setMediaActive] = useState(0);
	const activeItem = media[mediaActive];

	if (!activeItem) {
		return <div className="mb-4 aspect-video overflow-hidden rounded-md bg-black/50" />;
	}

	return (
		<div className="w-full max-w-full min-w-0 overflow-hidden">
			<div className="relative mb-4 aspect-video overflow-hidden rounded-md bg-black/50">
				{activeItem.type === "video" ? (
					<iframe src={`https://www.youtube-nocookie.com/embed/${activeItem.id}`} title="Game video" className="h-full w-full" allowFullScreen />
				) : (
					<Image
						src={`https://images.igdb.com/igdb/image/upload/t_screenshot_big/${activeItem.id}.jpg`}
						alt=""
						fill
						sizes="(min-width: 1024px) 768px, calc(100vw - 2rem)"
						className="object-cover"
					/>
				)}
				{mediaActive > 0 && (
					<button
						type="button"
						aria-label="Show previous media"
						onClick={() => setMediaActive(mediaActive - 1)}
						className="absolute top-1/2 left-3 z-10 grid size-10 -translate-y-1/2 cursor-pointer place-items-center"
					>
						<ChevronLeft size={30} strokeWidth={3} />
					</button>
				)}
				{mediaActive < media.length - 1 && (
					<button
						type="button"
						aria-label="Show next media"
						onClick={() => setMediaActive(mediaActive + 1)}
						className="absolute top-1/2 right-3 z-10 grid size-10 -translate-y-1/2 cursor-pointer place-items-center"
					>
						<ChevronRight size={30} strokeWidth={3} />
					</button>
				)}
			</div>

			<div className="pb-2">
				<HorizontalScroller className="w-full max-w-full min-w-0 gap-3 px-0" selectedIndex={mediaActive} onSelectedIndexChange={setMediaActive}>
					{media.map((item, index) => (
						<button
							key={`${item.type}-${item.id}`}
							type="button"
							onClick={() => setMediaActive(index)}
							className={`shrink-0 cursor-pointer snap-start overflow-hidden rounded-md border-2 transition ${
								mediaActive === index ? "border-primary" : "border-transparent opacity-80 hover:opacity-100"
							}`}
							aria-label={`Show media ${index + 1}`}
						>
							{item.type === "video" ? (
								<span className="relative block aspect-video w-24 bg-black sm:w-32">
									<Image src={`https://img.youtube.com/vi/${item.id}/hqdefault.jpg`} alt="" fill sizes="128px" className="object-cover" />
									<span className="absolute inset-0 flex items-center justify-center">
										<Play color="var(--secondary)" strokeWidth={3} size={24} />
									</span>
								</span>
							) : (
								<span className="relative block aspect-video w-24 sm:w-32">
									<Image src={ImageIdToURL(item.id, "screenshot_big") ?? ""} alt="" fill sizes="128px" className="object-cover" />
								</span>
							)}
						</button>
					))}
				</HorizontalScroller>
			</div>
		</div>
	);
}
