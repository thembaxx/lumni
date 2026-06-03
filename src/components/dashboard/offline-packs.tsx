"use client";

import {
	CloudDownloadIcon,
	CloudOffIcon,
	Delete02Icon,
	FileDownloadIcon,
	StoreIcon,
	Time03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentLock } from "@/components/ui/content-lock";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useQuizPacks } from "@/hooks/use-quiz-packs";
import { useSubjects } from "@/hooks/use-subjects";

function formatPackBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderPackStatusBadge(status: string): React.ReactNode {
	switch (status) {
		case "generating":
			return <Badge variant="outline">Generating…</Badge>;
		case "ready":
			return <Badge variant="default">Ready</Badge>;
		case "expired":
			return <Badge variant="secondary">Expired</Badge>;
		case "failed":
			return <Badge variant="destructive">Failed</Badge>;
		default:
			return null;
	}
}

export function OfflinePackManager() {
	const {
		packs,
		generating,
		storageBytes,
		storagePercentage,
		storageLimit,
		generate,
		remove,
	} = useQuizPacks();
	const { data: subjectsData } = useSubjects();
	const subjects = subjectsData?.subjects ?? [];
	const [selectedSubject, setSelectedSubject] = useState("");
	const [questionCount, setQuestionCount] = useState("10");

	const handleGenerate = async () => {
		if (!selectedSubject) return;
		await generate(
			selectedSubject,
			null,
			Number.parseInt(questionCount, 10) || 10,
		);
	};

	const formatBytes = formatPackBytes;

	const statusBadge = renderPackStatusBadge;

	return (
		<ContentLock feature="offline-quiz-packs">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="flex items-center gap-2 font-extrabold text-base tracking-tight">
						<HugeiconsIcon icon={CloudOffIcon} className="size-5" />
						Offline Quiz Packs
					</CardTitle>
					<div className="flex items-center gap-2">
						<Select
							value={selectedSubject}
							onValueChange={(value: string | null) =>
								setSelectedSubject(value ?? "")
							}
						>
							<SelectTrigger className="w-36">
								<SelectValue placeholder="Subject" />
							</SelectTrigger>
							<SelectContent>
								{(subjects ?? []).map((s: { name: string; code: string }) => (
									<SelectItem key={s.code} value={s.name}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Input
							type="number"
							min={5}
							max={30}
							value={questionCount}
							onChange={(e) => setQuestionCount(e.target.value)}
							className="w-16"
							placeholder="10"
						/>
						<Button
							size="sm"
							onClick={handleGenerate}
							disabled={generating || !selectedSubject}
						>
							<HugeiconsIcon
								icon={CloudDownloadIcon}
								data-icon="inline-start"
							/>
							{generating ? "Generating…" : "Download"}
						</Button>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<HugeiconsIcon
							icon={StoreIcon}
							className="size-4 text-muted-foreground"
						/>
						<Progress value={storagePercentage} className="h-1.5 flex-1" />
						<span className="shrink-0 text-muted-foreground text-xs">
							{formatBytes(storageBytes)} / {formatBytes(storageLimit)}
						</span>
					</div>

					{packs.length === 0 ? (
						<div className="flex items-center gap-3 rounded-xl bg-muted/30 p-2.5">
							<HugeiconsIcon
								icon={CloudOffIcon}
								className="size-4 text-muted-foreground"
							/>
							<p className="text-muted-foreground text-sm">
								No offline packs yet. Select a subject and download questions
								for offline study.
							</p>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							{packs.map((pack) => (
								<div
									key={pack.id}
									className="flex items-center gap-3 rounded-xl bg-muted/30 p-2.5"
								>
									<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[--system-accent]/10">
										<HugeiconsIcon
											icon={FileDownloadIcon}
											className="size-4 text-[--system-accent]"
										/>
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<p className="truncate font-semibold text-sm">
												{pack.title}
											</p>
											{statusBadge(pack.status)}
										</div>
										<p className="text-muted-foreground text-xs">
											{pack.questionCount} questions ·{" "}
											{formatBytes(pack.storageBytes)}
											{pack.expiresAt && (
												<>
													{" · "}
													<HugeiconsIcon
														icon={Time03Icon}
														className="inline size-3 align-middle"
													/>{" "}
													Expires{" "}
													{new Date(pack.expiresAt).toLocaleDateString()}
												</>
											)}
										</p>
									</div>
									{pack.status === "ready" && (
										<Button
											variant="ghost"
											size="icon"
											onClick={() => remove(pack.id)}
											aria-label="Delete pack"
										>
											<HugeiconsIcon icon={Delete02Icon} className="size-4" />
										</Button>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</ContentLock>
	);
}
