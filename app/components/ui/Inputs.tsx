import { forwardRef, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const base = "bg-bg-secondary/80 p-1 rounded mt-1 pl-3 pr-3 border border-border outline-none";

function join(base: string, extra?: string) {
    return [base, extra].filter(Boolean).join(" ");
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
    return (
        <div className={className}>
            <h3>{label}</h3>
            {children}
            {hint && <p className="ml-1.5 text-[0.7rem] text-text-muted">{hint}</p>}
        </div>
    );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
    return <input ref={ref} {...props} className={join(`${base} w-full`, className)} />;
});

export const SuffixedInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { suffix: ReactNode; inputClassName?: string }>(function SuffixedInput({ className, inputClassName, suffix, disabled, ...props }, ref) {
    return (
        <span className={join(`mt-1 flex w-full overflow-hidden rounded border border-border bg-bg-secondary/80 outline-none focus-within:border-primary ${disabled ? "opacity-60" : ""}`, className)}>
            <input ref={ref} {...props} disabled={disabled} className={join("min-w-0 flex-1 bg-transparent px-3 py-1 outline-none disabled:cursor-not-allowed", inputClassName)} />
            <span className="flex shrink-0 items-center border-l border-border bg-bg px-3 py-1 text-text-muted select-none">
                {suffix}
            </span>
        </span>
    );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} {...props} className={join(`${base} w-full`, className)} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...props }, ref) {
    return <select ref={ref} {...props} className={join(base, className)} />;
});

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Checkbox({ className, type, ...props }, ref) {
    return (
        <input
            ref={ref}
            {...props}
            type={type ?? "checkbox"}
            className={join("size-4 shrink-0 cursor-pointer appearance-none rounded border border-border bg-bg transition checked:border-primary checked:bg-primary hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50", className)}
        />
    );
});
