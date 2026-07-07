"use client";

import { Checkbox } from "@/components/ui/control/Checkbox";
import { NumberInput } from "@/components/ui/control/NumberInput";
import { TextArea } from "@/components/ui/control/TextArea";
import { TextInput } from "@/components/ui/control/TextInput";
import { useEntryEditor } from "./context";

export default function LogTab() {
	const { entry, saveLog, today } = useEntryEditor();

	return (
		<form id="entry-editor-log-form" action={saveLog} className="flex flex-col gap-3">
			<div className="grid gap-3 sm:grid-cols-2">
				<TextInput label="Date played" name="playedat" type="date" max={today} defaultValue={today} />
				<NumberInput label="Hours played" name="hours" type="number" min={0.1} step={0.1} suffix="h" />
			</div>
			<TextArea label="Log note" name="note" rows={4} />
			<div className="grid gap-2 text-sm font-bold text-text-muted sm:grid-cols-3">
				<Checkbox
					label="Finished"
					name="finished"
					defaultChecked={Boolean(entry.finishedAt || entry.timeFinished != null)}
					disabled={Boolean(entry.finishedAt || entry.timeFinished != null)}
					fieldClassName="rounded border border-border p-2"
				/>
				<Checkbox
					label="Mastered"
					name="mastered"
					defaultChecked={entry.timeMastered != null}
					disabled={entry.timeMastered != null}
					fieldClassName="rounded border border-border p-2"
				/>
				<Checkbox
					label={
						<>
							<p>Skip recap</p>
							<span title="This log still counts toward your game time. It will only be left out of recap features."></span>
						</>
					}
					name="skipRecap"
					fieldClassName="rounded border border-border p-2"
				/>
			</div>
		</form>
	);
}
