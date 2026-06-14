import { forwardRef, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const base = "bg-bg p-1 rounded mt-1 border border-border outline-none";

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

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} {...props} className={join(`${base} w-full`, className)} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...props }, ref) {
    return <select ref={ref} {...props} className={join(base, className)} />;
});

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Checkbox({ className, type, ...props }, ref) {
    return <input ref={ref} {...props} type={type ?? "checkbox"} className={join("size-4 rounded border border-border bg-bg accent-primary", className)} />;
});
