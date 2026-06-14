"use client";

import { isVideoUrl } from "@/lib/util/safety";
import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type BackgroundViewProps = {
    src: string | null;
    size?: number;
    mdSize?: number;
    alt?: string;
    priority?: boolean;
    className?: string;
    fit?: "cover" | "contain";
    aspectRatio?: string;
    poster?: string;
};

export default function BackgroundView({ src, size, mdSize = size, alt = "", priority, className = "", fit = "cover", aspectRatio = "2 / 1", poster }: BackgroundViewProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [videoReady, setVideoReady] = useState(false);
    const desktopSize = mdSize ?? size;
    const isPreview = Boolean(size);
    const isVideo = Boolean(src && isVideoUrl(src));
    const style = size ? {
        "--background-size": `${size * 0.25}rem`,
        "--background-md-size": `${(desktopSize ?? size) * 0.25}rem`,
        aspectRatio,
    } as CSSProperties : undefined;
    const rootClassName = size
        ? `relative flex w-[var(--background-size)] shrink-0 items-center justify-center overflow-hidden bg-bg md:w-[var(--background-md-size)] ${className}`
        : `pointer-events-none fixed inset-0 z-0 overflow-hidden bg-bg ${className}`;
    const mediaClassName = `h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} object-center`;
    const imageSizes = size ? `${Math.round((desktopSize ?? size) * 4)}px` : "100vw";
    const shouldPrioritize = priority ?? !size;

    useEffect(() => {
        setVideoReady(false);

        const video = videoRef.current;

        if (!video || !isVideo) return;

        function markReady() {
            setVideoReady(true);
        }

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            markReady();
        }

        if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) {
            video.load();
        }
        const playAttempt = video.play();

        if (playAttempt) {
            playAttempt.catch(() => {
                if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                    markReady();
                }
            });
        }

        video.addEventListener("loadedmetadata", markReady);
        video.addEventListener("loadeddata", markReady);
        video.addEventListener("canplay", markReady);
        video.addEventListener("playing", markReady);

        return () => {
            video.removeEventListener("loadedmetadata", markReady);
            video.removeEventListener("loadeddata", markReady);
            video.removeEventListener("canplay", markReady);
            video.removeEventListener("playing", markReady);
        };
    }, [src, isVideo]);

    if (!src) {
        return (
            <div className={rootClassName} style={style}>
                {size && <ImageIcon size={24} />}
            </div>
        );
    }

    return (
        <div className={rootClassName} style={style}>
            {isVideo ? (
                <video
                    ref={videoRef}
                    src={src}
                    poster={poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    suppressHydrationWarning
                    disablePictureInPicture
                    onLoadedData={() => setVideoReady(true)}
                    onCanPlay={() => setVideoReady(true)}
                    onPlaying={() => setVideoReady(true)}
                    className={`transition-opacity duration-300 ${videoReady ? "opacity-100" : "opacity-0"} ${mediaClassName}`}
                />
            ) : (
                <Image
                    src={src}
                    alt={alt}
                    fill
                    priority={shouldPrioritize}
                    sizes={imageSizes}
                    className={`select-none ${mediaClassName}`}
                />
            )}
            {!isPreview && <div className="absolute inset-0 bg-bg/50" />}
        </div>
    );
}
