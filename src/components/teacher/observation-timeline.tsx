"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { dexieDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";

interface Observation {
	id?: number;
	studentId: string;
	teacherId: string;
	content: string;
	subject?: string;
	createdAt: number;
}

interface ObservationTimelineProps {
	studentId: string;
}

export function ObservationTimeline({ studentId }: ObservationTimelineProps) {
	const [observations, setObservations] = useState<Observation[]>([]);
	const [loading, setLoading] = useState(true);
	const [newNote, setNewNote] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		let cancelled = false;
		dexieDataAccess.teacherObservations
			.where("studentId")
			.equals(studentId)
			.toArray()
			.then((all) => {
				if (cancelled) return;
				all.sort((a, b) => b.createdAt - a.createdAt);
				setObservations(all);
			})
			.catch((err) => logError("ObservationTimelineLoad", err))
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [studentId]);

	const addObservation = async () => {
		if (!newNote.trim()) return;
		setSaving(true);
		await dexieDataAccess.teacherObservations.add({
			studentId,
			teacherId: "current",
			content: newNote.trim(),
			createdAt: Date.now(),
		} as Observation);
		const all = await dexieDataAccess.teacherObservations
			.where("studentId")
			.equals(studentId)
			.toArray();
		all.sort((a, b) => b.createdAt - a.createdAt);
		setObservations(all);
		setNewNote("");
		setSaving(false);
	};

	if (loading) return <Skeleton className="h-32 rounded-lg" />;

	return (
		<div className="space-y-3">
			<div className="flex gap-2">
				<Textarea
					value={newNote}
					onChange={(e) => setNewNote(e.target.value)}
					placeholder="Add observation note..."
					className="min-h-[60px] text-sm"
				/>
				<Button
					onClick={addObservation}
					disabled={!newNote.trim() || saving}
					size="sm"
					className="shrink-0"
				>
					{saving ? "Saving…" : "Add"}
				</Button>
			</div>
			{observations.length === 0 ? (
				<p className="text-muted-foreground text-xs">No observations yet</p>
			) : (
				<div className="space-y-2">
					{observations.map((obs, i) => (
						<div key={obs.id ?? i} className="rounded-lg border p-3">
							<p className="text-sm">{obs.content}</p>
							<p className="mt-1 text-[10px] text-muted-foreground">
								{new Date(obs.createdAt).toLocaleDateString()}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
