import Image from "next/image";

function getBackgroundMediaType(src: string) {
    const pathname = src.split("?")[0].toLowerCase();

    if (/\.(mp4|webm|ogg|mov|m4v)$/.test(pathname)) {
        return "video";
    }

    return "image";
}

export default function ProfileBackground({ src }: { src: string | null }) {
    if (!src) {
        return <div className="pointer-events-none fixed inset-0 z-0 bg-bg" />;
    }

    const mediaType = getBackgroundMediaType(src);

    return (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-bg">
            {mediaType === "video" ? (
                <video
                    src={src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    suppressHydrationWarning
                    className="h-full w-full object-cover object-center"
                />
            ) : (
                <Image
                    src={src}
                    alt=""
                    fill
                    priority
                    quality={100}
                    sizes="100vw"
                    className="select-none object-cover object-center"
                />
            )}
            <div className="absolute inset-0 bg-bg/50" />
        </div>
    );
}
