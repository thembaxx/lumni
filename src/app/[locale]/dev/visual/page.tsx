"use client";

import { useCallback, useReducer } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { VisualContent } from "@/components/visual/visual-content";
import { apiFetch, showBudgetToast } from "@/lib/shared/api-fetch";
import { STEM_SUBJECTS } from "@/lib/visual-engine";
import type { VisualContent as VisualContentType } from "@/lib/visual-engine/types";

const SUBJECTS = [...STEM_SUBJECTS].toSorted();
const ALL_SUBJECTS = [
	...SUBJECTS,
	"history",
	"english-home-language",
	"life-orientation",
	"MusicNote",
].toSorted();

interface DevVisualState {
	subject: string;
	topic: string;
	visual: VisualContentType | null;
	rawJson: string;
	isLoading: boolean;
	error: string;
}

const initialState: DevVisualState = {
	subject: "mathematics",
	topic: "algebra",
	visual: null,
	rawJson: "",
	isLoading: false,
	error: "",
};

type DevVisualAction =
	| { type: "SET_SUBJECT"; payload: string }
	| { type: "SET_TOPIC"; payload: string }
	| { type: "RESOLVE_START" }
	| {
			type: "RESOLVE_SUCCESS";
			payload: { visual: VisualContentType | null; rawJson: string };
	  }
	| { type: "RESOLVE_ERROR"; payload: string };

function devVisualReducer(
	state: DevVisualState,
	action: DevVisualAction,
): DevVisualState {
	switch (action.type) {
		case "SET_SUBJECT":
			return { ...state, subject: action.payload };
		case "SET_TOPIC":
			return { ...state, topic: action.payload };
		case "RESOLVE_START":
			return {
				...state,
				isLoading: true,
				error: "",
				visual: null,
				rawJson: "",
			};
		case "RESOLVE_SUCCESS":
			return {
				...state,
				isLoading: false,
				visual: action.payload.visual,
				rawJson: action.payload.rawJson,
			};
		case "RESOLVE_ERROR":
			return { ...state, isLoading: false, error: action.payload };
		default:
			return state;
	}
}

export default function DevVisualPage() {
	const [state, dispatch] = useReducer(devVisualReducer, initialState);
	const questionText =
		"Solve for x in the equation $x^2 - 5x + 6 = 0$. Show the parabola graph.";

	const handleResolve = useCallback(async () => {
		dispatch({ type: "RESOLVE_START" });
		try {
			const data = await apiFetch<{
				visual?: VisualContentType;
				error?: string;
			}>("/api/engine/visual", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					questionId: "dev-test",
					questionText,
					subject: state.subject,
					topic: state.topic,
				}),
			});
			dispatch({
				type: "RESOLVE_SUCCESS",
				payload: {
					visual: data.visual ?? null,
					rawJson: JSON.stringify(data, null, 2),
				},
			});
		} catch (err) {
			showBudgetToast(err);
			dispatch({
				type: "RESOLVE_ERROR",
				payload: err instanceof Error ? err.message : "Network error",
			});
		}
	}, [state.subject, state.topic]);

	return (
		<div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 bg-background p-4 pb-20">
			<h1 className="font-semibold text-xl">Visual Engine Test</h1>

			<div className="overflow-hidden rounded-card-lg bg-card shadow-level-2">
				<div className="flex flex-col gap-3 p-4">
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
						<Select
							value={state.subject}
							onValueChange={(v) =>
								v && dispatch({ type: "SET_SUBJECT", payload: v })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ALL_SUBJECTS.map((s) => (
									<SelectItem key={s} value={s}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Input
							value={state.topic}
							onChange={(e) =>
								dispatch({ type: "SET_TOPIC", payload: e.target.value })
							}
							placeholder="Topic (optional)"
						/>
						<Button
							onClick={handleResolve}
							disabled={state.isLoading}
							variant="default"
						>
							{state.isLoading ? "Resolving..." : "Resolve Visual"}
						</Button>
					</div>
				</div>
			</div>

			{state.error && (
				<div className="overflow-hidden rounded-card-lg border border-destructive bg-destructive/5">
					<div className="p-4 text-destructive text-sm">{state.error}</div>
				</div>
			)}

			{state.isLoading && <Skeleton className="h-48 w-full" />}

			{state.visual && (
				<>
					<div className="overflow-hidden rounded-card-lg bg-card shadow-level-2">
						<div className="p-4 pb-2">
							<h3 className="flex items-center gap-2 font-semibold text-sm tracking-tight">
								Rendered Visual
								<Badge variant="secondary" className="text-xs">
									{state.visual.type}
								</Badge>
								{state.visual.diagramType && (
									<Badge variant="outline" className="text-xs">
										{state.visual.diagramType}
									</Badge>
								)}
							</h3>
						</div>
						<div className="p-4 pt-0">
							<VisualContent visual={state.visual} />
						</div>
					</div>

					<div className="overflow-hidden rounded-card-lg bg-card shadow-level-2">
						<div className="p-4 pb-2">
							<h3 className="font-semibold text-sm tracking-tight">
								Raw Response
							</h3>
						</div>
						<div className="p-4 pt-0">
							<Textarea
								value={state.rawJson}
								readOnly
								className="min-h-[150px] font-mono text-xs"
							/>
						</div>
					</div>
				</>
			)}

			{!state.visual && !state.isLoading && !state.error && (
				<div className="overflow-hidden rounded-card-lg bg-card shadow-level-2">
					<div className="p-8 text-center text-muted-foreground text-sm">
						Enter a question above and click "Resolve Visual" to see the result.
					</div>
				</div>
			)}
		</div>
	);
}
