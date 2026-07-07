"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { WidgetEditor } from "@/app/(user)/settings/WidgetEditors";
import { GhostButton } from "@/components/ui/control/Button";
import { type SecuredUser } from "@/lib/data/social/user";
import type { Widget } from "@/lib/types";
import { WidgetType } from "@/lib/types";
import { parseWidgets, serializeWidgets } from "@/lib/util/parse/widgets";

export default function WidgetsSettingsForm({ profile }: Readonly<{ profile: SecuredUser }>) {
	const [widgets, setWidgets] = useState(() => parseWidgets(profile.widgets));
	const widgetPayload = useMemo(() => serializeWidgets(widgets), [widgets]);

	function updateWidget(id: string, patch: Partial<Widget>) {
		setWidgets((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
	}

	function moveWidget(id: string, direction: -1 | 1) {
		setWidgets((items) => {
			const index = items.findIndex((item) => item.id === id);
			const targetIndex = index + direction;

			if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return items;

			const next = [...items];
			[next[index], next[targetIndex]] = [next[targetIndex], next[index]];
			return next;
		});
	}

	return (
		<div className="flex flex-col">
			<input type="hidden" name="widgets" value={widgetPayload} />
			<div className="flex flex-wrap gap-2">
				{[WidgetType.GAMELIST, WidgetType.MARKDOWN, WidgetType.STATS].map((type) => (
					<GhostButton
						variant="outline"
						key={type}
						type="button"
						onClick={() => {
							setWidgets((items) => [
								...items,
								{
									id: `${Date.now()}-${type}`,
									type,
									title: type === WidgetType.GAMELIST ? "Game list" : "",
									visible: true,
									content: "",
									stats: type === WidgetType.STATS ? ["played", "completed", "backlog"] : [],
									games: [],
								},
							]);
						}}
					>
						<Plus size={16} />
						{getWidgetTitle(type)}
					</GhostButton>
				))}
			</div>
			{widgets.length === 0 ? (
				<p className="text-sm text-text-muted">No widgets configured.</p>
			) : (
				widgets.map((widget, index) => (
					<WidgetEditor
						key={widget.id}
						widget={widget}
						index={index}
						total={widgets.length}
						onChange={(patch) => updateWidget(widget.id, patch)}
						onRemove={() => {
							setWidgets((items) => widgetFilter(items, widget));
						}}
						onMoveUp={() => moveWidget(widget.id, -1)}
						onMoveDown={() => moveWidget(widget.id, 1)}
					/>
				))
			)}
		</div>
	);
}

function getWidgetTitle(type: WidgetType): string {
	switch (type) {
		case WidgetType.GAMELIST:
			return "Game list";
		case WidgetType.STATS:
			return "Stats";
		default:
			return "Markdown";
	}
}

function widgetFilter(items: Widget[], widget: Widget) {
	return items.filter((item) => item.id !== widget.id);
}
