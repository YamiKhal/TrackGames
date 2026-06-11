import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    href?: string;
    variant?: "primary" | "secondary" | "ghost";
};

const classes: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
        "flex items-center gap-5 justify-center bg-primary text-text px-6 py-2 rounded cursor-pointer font-bold transition-colors hover:bg-primary-hover",
    secondary:
        "flex items-center gap-5 justify-center bg-secondary text-text-inverse px-6 py-2 rounded cursor-pointer font-bold transition-colors hover:bg-secondary-hover",
    ghost:
        "flex items-center gap-5 justify-center bg-primary/0 border-text-faint border text-text-muted px-6 py-2 rounded cursor-pointer font-bold hover:border-primary hover:text-primary transition-colors",
};

function joinClass(base: string, extra?: string) {
    return [base, extra].filter(Boolean).join(" ");
}

export function Button({ children, href, className, variant = "primary", ...props }: ButtonProps) {
    const cls = joinClass(classes[variant], className);
    if (href) return (
        <Link href={href} className={cls}>
            {children}
        </Link>
    );

    return (
        <button {...props} className={cls}>
            {children}
        </button>
    );
}

export const PrimaryButton = (p: ButtonProps) => <Button {...p} variant="primary" />;
export const SecondaryButton = (p: ButtonProps) => <Button {...p} variant="secondary" />;
export const GhostButton = (p: ButtonProps) => <Button {...p} variant="ghost" />;
