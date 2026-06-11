import { RefObject } from "react";

export function rippleEffect(ref: RefObject<HTMLDivElement | null>, event: React.PointerEvent<HTMLDivElement>) {
    const obj = ref.current;
    if (!obj) return;

    const rect = obj.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
    const ripple = document.createElement("span");

    ripple.className = "pointer-events-none absolute rounded-full bg-primary/30";
    ripple.style.left = `${x - radius}px`;
    ripple.style.top = `${y - radius}px`;
    ripple.style.width = `${radius * 2}px`;
    ripple.style.height = `${radius * 2}px`;
    ripple.style.transform = "scale(0)";
    ripple.style.willChange = "transform, opacity";

    obj.appendChild(ripple);

    const animation = ripple.animate(
        [
            { opacity: 0.35, transform: "scale(0)" },
            { opacity: 0, transform: "scale(1)" },
        ],
        { duration: 520, easing: "cubic-bezier(0.2, 0, 0, 1)" },
    );

    animation.onfinish = () => ripple.remove();
    animation.oncancel = () => ripple.remove();
}