"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import MarkdownWidgetEditor from "./MarkdownWidgetEditor";
import { Widget } from "@/lib/types";
import { WidgetType } from "@/lib/enums";

const inputClass = "bg-bg p-1 rounded mt-1 border border-border outline-none";
const wideInputClass = `${inputClass} w-full`;

const statOptions = [
    { value: "played", label: "Played" },
    { value: "completed", label: "Completed" },
    { value: "backlog", label: "Backlog" },
    { value: "wishlisted", label: "Wishlisted" },
    { value: "hours", label: "Hours" },
    { value: "reviews", label: "Reviews" },
];

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= items.length) return items;

    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    return next;
}

function WidgetHeader({ widget, onChange, onRemove, onMoveUp, onMoveDown, first, last }: {
    widget: Widget;
    onChange: (patch: Partial<Widget>) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    first: boolean;
    last: boolean;
}) {
    return (
        <div className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
            <button type="button" onClick={() => onChange({ visible: !widget.visible })} className="cursor-pointer flex flex-row gap-2 items-center rounded p-2 text-text-muted hover:text-primary" aria-label={widget.visible ? "Hide widget" : "Show widget"} title={widget.visible ? "Hide widget" : "Show widget"}>
                {widget.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                <span>{widget.visible ? "Visible" : "Hidden"}</span>
            </button>
            <div className="flex items-center gap-1">
                <button type="button" onClick={onMoveUp} disabled={first} className="cursor-pointer rounded p-2 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40" aria-label="Move widget up" title="Move widget up">
                    <ChevronUp size={18} />
                </button>
                <button type="button" onClick={onMoveDown} disabled={last} className="cursor-pointer rounded p-2 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40" aria-label="Move widget down" title="Move widget down">
                    <ChevronDown size={18} />
                </button>
                <button type="button" onClick={onRemove} className="cursor-pointer rounded p-2 text-text-muted hover:text-error" aria-label="Remove widget" title="Remove widget">
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}

function StatsEditor({ widget, onChange }: { widget: Widget; onChange: (patch: Partial<Widget>) => void }) {
    const selectedStats = widget.stats;
    const availableStats = statOptions.filter((stat) => !selectedStats.includes(stat.value));

    return (
        <div className="mt-3 flex flex-col gap-3">
            <select value="" onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                onChange({ stats: [...selectedStats, value] });
            }} className="max-w-36 border border-border p-1 rounded pl-2">
                <option value="" disabled>Add stat</option>
                {availableStats.map((stat) => (
                    <option key={stat.value} value={stat.value}>{stat.label}</option>
                ))}
            </select>
            {selectedStats.length === 0 ? (
                <p className="text-sm text-text-muted">No stats selected.</p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
                    {selectedStats.map((stat, index) => (
                        <div key={stat} className="flex min-h-28 min-w-0 flex-col justify-center items-center gap-3 rounded border border-primary/80 bg-primary/5 p-3">
                            <p className="mt-2 truncate text-2xl font-semibold leading-tight text-text">000</p>
                            <p className="mt-2 truncate text-md font-semibold leading-tight text-text-muted">{statOptions.find((opt) => opt.value === stat)?.label ?? stat}</p>
                            <div className="flex items-center justify-end gap-1 pt-2">
                                <button type="button" onClick={() => onChange({ stats: moveItem(selectedStats, index, -1) })} disabled={index === 0} className="cursor-pointer rounded p-1.5 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40" aria-label="Move stat left" title="Move stat left">
                                    <ChevronLeft size={17} />
                                </button>
                                <button type="button" onClick={() => onChange({ stats: moveItem(selectedStats, index, 1) })} disabled={index === selectedStats.length - 1} className="cursor-pointer rounded p-1.5 text-text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40" aria-label="Move stat right" title="Move stat right">
                                    <ChevronRight size={17} />
                                </button>
                                <button type="button" onClick={() => onChange({ stats: selectedStats.filter((item) => item !== stat) })} className="cursor-pointer rounded p-1.5 text-text-muted hover:text-error" aria-label="Remove stat" title="Remove stat">
                                    <Trash2 size={17} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function GameListEditor({ widget, onChange }: { widget: Widget; onChange: (patch: Partial<Widget>) => void }) {
    return (
        <div className="mt-3 flex flex-col gap-3">
            <label>
                <span className="text-sm font-bold text-text-muted">Title</span>
                <input value={widget.title} onChange={(event) => onChange({ title: event.target.value })} className={wideInputClass} />
            </label>
            <div>
                <span className="text-sm font-bold text-text-muted">Games</span>
                <button type="button" disabled className="mt-2 flex min-h-28 w-full cursor-not-allowed items-center justify-center gap-2 border border-dashed border-border bg-bg p-4 text-text-muted opacity-70" title="Game search is not available yet">
                    <Plus size={20} />
                    Add game
                </button>
            </div>
        </div>
    );
}

export function WidgetEditor({ widget, index, total, onChange, onRemove, onMoveUp, onMoveDown }: {
    widget: Widget;
    index: number;
    total: number;
    onChange: (patch: Partial<Widget>) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {
    return (
        <div className="rounded bg-bg p-3">
            <WidgetHeader widget={widget} onChange={onChange} onRemove={onRemove} onMoveUp={onMoveUp} onMoveDown={onMoveDown} first={index === 0} last={index === total - 1} />
            {widget.type === WidgetType.STATS && <StatsEditor widget={widget} onChange={onChange} />}
            {widget.type === WidgetType.GAMELIST && <GameListEditor widget={widget} onChange={onChange} />}
            {widget.type === WidgetType.MARKDOWN && <MarkdownWidgetEditor value={widget.content} onChange={(content) => onChange({ content })} />}
        </div>
    );
}
