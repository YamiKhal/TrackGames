import { type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { joinClass } from "@/lib/util/client/func";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	children: ReactNode;
	href?: string;
	variant?: "primary" | "secondary" | "ghost";
};

type FloatedSquareButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	children: ReactNode;
	label?: ReactNode;
	labelClassName?: string;
};

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	icon: ReactNode;
	label: string;
	pressed?: boolean;
};

const classes: Record<NonNullable<ButtonProps["variant"]>, string> = {
	primary: "flex items-center gap-5 justify-center bg-primary text-text px-6 py-2 rounded cursor-pointer font-bold transition-colors hover:bg-primary-hover",
	secondary: "flex items-center gap-5 justify-center bg-secondary text-text-inverse px-6 py-2 rounded cursor-pointer font-bold transition-colors hover:bg-secondary-hover",
	ghost: "flex items-center gap-5 justify-center bg-primary/0 border-text-faint border text-text-muted px-6 py-2 rounded cursor-pointer font-bold hover:border-primary hover:text-primary transition-colors",
};

export function Button({ children, href, className, variant = "primary", ...props }: ButtonProps) {
	const cls = joinClass(classes[variant], className);
	if (href)
		return (
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

export function AdvancedFilterButton({ onClick, filterCount }: { onClick: () => void; filterCount: number }) {
	return (
		<GhostButton
			onClick={onClick}
			className={joinClass("h-9 border-border", filterCount ? "border-primary text-primary" : "border-border text-text-muted")}
			aria-label="Advanced filters"
		>
			<SlidersHorizontal size={17} aria-hidden="true" />
			Filter{filterCount ? ` (${filterCount})` : ""}
		</GhostButton>
	);
}

export function IconButton({ icon, label, pressed, className, ...props }: IconButtonProps) {
	return (
		<button
			type="button"
			{...props}
			aria-label={label}
			aria-pressed={pressed}
			className={joinClass(
				"grid size-7 cursor-pointer place-items-center rounded text-text-faint transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50",
				pressed && "text-primary",
				className,
			)}
		>
			{icon}
		</button>
	);
}

export function FloatedSquareButton({ children, className, label, labelClassName, ...props }: FloatedSquareButtonProps) {
	return (
		<div className="relative grid size-12 place-items-center text-xs font-bold">
			<button
				{...props}
				className={joinClass("grid size-12 cursor-pointer place-items-center rounded border transition disabled:cursor-wait disabled:opacity-60", className)}
			>
				{children}
			</button>
			<span className={joinClass("absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap", labelClassName)}>{label}</span>
		</div>
	);
}
