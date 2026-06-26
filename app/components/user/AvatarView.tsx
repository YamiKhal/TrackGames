import { UserIcon } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

export default function AvatarPreview({ image, size = 24, mdSize = size*1.5, iconSize, alt = "User profile image", priority = false, className = "" }: 
    {image: string | null | undefined; size?: number; mdSize?: number; iconSize?: number; alt?: string; priority?: boolean; className?: string;}) 
    {
    const desktopSize = mdSize ?? size;
    const style = {
        "--avatar-size": `${size * 0.25}rem`,
        "--avatar-md-size": `${desktopSize * 0.25}rem`,
    } as CSSProperties;
    const imageSize = Math.round(desktopSize * 8);

    return (
        <div
            className={`relative flex aspect-square h-(--avatar-size) w-(--avatar-size) shrink-0 items-center justify-center overflow-hidden bg-bg md:h-(--avatar-md-size) md:w-(--avatar-md-size) ${className}`}
            style={style}
        >
            {image ?
                <Image
                    src={image}
                    alt={alt}
                    fill
                    preload={priority}
                    sizes={`${imageSize}px`}
                    className="pointer-events-none select-none object-cover object-center"
                />
                :
                <UserIcon size={iconSize ?? Math.round(size * 2)} aria-hidden="true" />
            }
        </div>
    )
}
