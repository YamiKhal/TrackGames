import { ArrowRight } from "lucide-react";
import { Dispatch, ReactNode } from "react";

export default function SubTabs({tabs, active, setter, viewAll, viewAllHref, children}: { tabs: { id: string; label: string; }[]; active: any; setter: Dispatch<any> | Function; viewAll?: boolean; viewAllHref?: string; children?: ReactNode}) {
    if (!tabs.length) {
        return null;
    }

    return (
        <div className="min-w-0">
            <nav className="mb-5 flex min-w-0 flex-row items-center gap-2 border-b border-border" aria-label="Related games">
                {tabs.map((tab) => {
                    const isActive = tab.id === active;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setter(tab.id)}
                            className={`rounded-t border-b-2 px-4 py-3 text-xl font-bold transition-colors ${isActive
                                ? "border-primary text-text bg-linear-to-b from-transparent to-primary/25 bg-no-repeat"
                                : "border-transparent text-text-muted hover:bg-bg-secondary/60 hover:text-text"
                                }`}
                            aria-pressed={isActive}
                        >
                            {tab.label}
                        </button>
                    );
                })}
                {viewAll && (
                    <button
                        type="button"
                        className="group ml-auto  cursor-pointer flex shrink-0 items-center gap-2 px-1 py-2 text-sm font-bold text-text-muted transition-colors hover:text-text"
                    >
                        View all
                        <span className="grid size-7 place-items-center border border-border bg-bg-secondary rounded-2xl text-text-muted transition-colors group-hover:border-primary/50 group-hover:text-primary">
                            <ArrowRight size={14} />
                        </span>
                    </button>
                )}
            </nav>

            {children}
        </div>
    )
}