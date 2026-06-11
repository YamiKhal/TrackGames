"use client";

import Image from "next/image";
import { useState } from "react";
import HorizontalScroller from "./HorizontalScroller";

type MediaItem =
    | {
        type: "video";
        id: string;
    }
    | {
        type: "image";
        id: string;
    };

export default function MediaGallery({ media }: { media: MediaItem[] }) {
    const [mediaActive, setMediaActive] = useState(0);
    const activeItem = media[mediaActive];

    if (!activeItem) {
        return (
            <div className="aspect-video bg-black/50 rounded-md overflow-hidden mb-4" />
        );
    }

    return (
        <div className="w-full min-w-0 max-w-full overflow-hidden">
            <div className="relative aspect-video bg-black/50 rounded-md overflow-hidden mb-4">
                {activeItem.type === "video" ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${activeItem.id}`}
                        title="Game video"
                        className="w-full h-full"
                        allowFullScreen
                    />
                ) : (
                    <Image
                        src={`https://images.igdb.com/igdb/image/upload/t_screenshot_big/${activeItem.id}.jpg`}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 768px, 100vw"
                        className="object-cover"
                    />
                )}
            </div>

            <div className="pb-2">
                <HorizontalScroller className="w-full min-w-0 max-w-full gap-3 px-0">
                    {media.map((item, index) => (
                        <button
                            key={`${item.type}-${item.id}`}
                            type="button"
                            onClick={() => setMediaActive(index)}
                            className={`snap-start shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition ${mediaActive === index
                                    ? "border-primary"
                                    : "border-transparent opacity-80 hover:opacity-100"
                                }`}
                            aria-label={`Show media ${index + 1}`}
                        >
                            {item.type === "video" ? (
                                <span className="relative block w-24 sm:w-32 aspect-video bg-black">
                                    <Image
                                        src={`https://img.youtube.com/vi/${item.id}/hqdefault.jpg`}
                                        alt=""
                                        fill
                                        sizes="128px"
                                        className="object-cover"
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <span className="bg-black/60 rounded-full p-2 text-white text-lg">
                                            Play
                                        </span>
                                    </span>
                                </span>
                            ) : (
                                <span className="relative block w-24 sm:w-32 aspect-video">
                                    <Image
                                        src={`https://images.igdb.com/igdb/image/upload/t_original/${item.id}.jpg`}
                                        alt=""
                                        fill
                                        sizes="128px"
                                        className="object-cover"
                                    />
                                </span>
                            )}
                        </button>
                    ))}
                </HorizontalScroller>
            </div>
        </div>
    );
}
