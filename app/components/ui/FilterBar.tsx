"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Input, Select } from "./Inputs";

type Filter =
    | {
        type: "search";
        value: string;
        onChange: (value: string) => void;
        placeholder: string;
    }
    | {
        type: "select";
        label: string;
        value: string;
        onChange: (value: string) => void;
        options: { value: string; label: string }[];
    }
    | {
        type: "linkSelect";
        label: string;
        value: string;
        options: { value: string; label: string; href: string }[];
    };

type SelectFilter = Extract<Filter, { type: "select" }>;

function SelectFilter({ filter }: { filter: SelectFilter }) {
    return (
        <Select className="w-full rounded-none border-t-0 border-r-0 border-l-0 md:w-auto" value={filter.value} onChange={(event) => filter.onChange(event.target.value)} aria-label={filter.label}>
            {filter.options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </Select>
    );
}

export function FilterBar({ filters, actions, className }: { filters: Filter[]; actions?: ReactNode; className?: string; }) {
    const router = useRouter();
    className = ["grid gap-3 md:flex md:items-center md:justify-between", className].filter(Boolean).join(" ");

    return (
        <div className={className}>
            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] md:flex md:flex-row md:flex-wrap">
                {filters.map((filter) => {
                    if (filter.type === "search") {
                        return (
                            <div key={filter.placeholder} className="relative min-w-0 md:min-w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" size={17} />
                                <Input value={filter.value} onChange={(event) => filter.onChange(event.target.value)} placeholder={filter.placeholder} className="pl-9" />
                            </div>
                        );
                    }

                    if (filter.type === "select") return <SelectFilter key={filter.label} filter={filter} />;

                    return (
                        <Select key={filter.label} className="w-full rounded-none border-t-0 border-r-0 border-l-0 md:w-auto" value={filter.value} onChange={(event) => {
                            const option = filter.options.find((item) => item.value === event.target.value);
                            if (option) router.push(option.href);
                        }} aria-label={filter.label}>
                            {filter.options.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </Select>
                    );
                })}
            </div>
            {actions}
        </div>
    );
}
