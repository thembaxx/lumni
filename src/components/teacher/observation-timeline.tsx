"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

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
		try {
			const raw = localStorage.getItem(`lumni_observations_${studentId}`);
			if (raw) setObservations(JSON.parse(raw));
		} catch {}
		setLoading(false);
	}, [studentId]);

	const addObservation = async () => {
		if (!newNote.trim()) return;
		setSaving(true);
		const obs: Observation = {
			studentId,
			teacherId: "current",
			content: newNote.trim(),
			createdAt: Date.now(),
		};
		const updated = [obs, ...observations];
		localStorage.setItem(
			`lumni_observations_${studentId}`,
			JSON.stringify(updated),
		);
		setObservations(updated);
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
					{saving ? "Saving..." : "Add"}
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
