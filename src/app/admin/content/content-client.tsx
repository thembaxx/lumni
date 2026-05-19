"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/headers/page-header";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface Flag {
	$id: string;
	questionId: string;
	userId: string;
	reason: string;
	details?: string;
	status: string;
	createdAt: string;
}

export function ContentClient() {
	const queryClient = useQueryClient();
	const [statusFilter, setStatusFilter] = useState<string>("pending");

	const { data, isLoading } = useQuery({
		queryKey: ["admin-content-flags"],
		queryFn: async () => {
			const res = await fetch("/api/admin/content");
			if (!res.ok) throw new Error("Failed to fetch flags");
			return res.json() as Promise<{ flags: Flag[] }>;
		},
	});

	const updateMutation = useMutation({
		mutationFn: async ({
			flagId,
			status,
		}: {
			flagId: string;
			status: string;
		}) => {
			const res = await fetch("/api/admin/content", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ flagId, status }),
			});
			if (!res.ok) throw new Error("Failed to update flag");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["admin-content-flags"],
			});
		},
	});

	const flags = (data?.flags || []).filter(
		(f) => statusFilter === "all" || f.status === statusFilter,
	);

	const reasonColors: Record<string, string> = {
		wrong: "destructive",
		offensive: "destructive",
		broken: "outline",
		other: "secondary",
	};

	return (
		<div className="min-h-[100dvh] bg-background">
			<PageHeader
				title="Content Moderation"
				subtitle="Review flagged questions"
			/>
			<div className="p-4 flex flex-col gap-4">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Flagged Questions</CardTitle>
							<div className="flex gap-2">
								{["pending", "resolved", "dismissed", "all"].map((s) => (
									<Button
										key={s}
										variant={statusFilter === s ? "default" : "outline"}
										size="sm"
										onClick={() => setStatusFilter(s)}
									>
										{s.charAt(0).toUpperCase() + s.slice(1)}
									</Button>
								))}
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Question ID</TableHead>
									<TableHead>Reason</TableHead>
									<TableHead>Reported by</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading && (
									<TableRow>
										<TableCell
											colSpan={6}
											className="text-center py-8 text-muted-foreground"
										>
											Loading...
										</TableCell>
									</TableRow>
								)}
								{!isLoading && flags.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={6}
											className="text-center py-8 text-muted-foreground"
										>
											No flags found
										</TableCell>
									</TableRow>
								)}
								{flags.map((flag) => (
									<TableRow key={flag.$id}>
										<TableCell className="font-mono text-xs">
											{flag.questionId.slice(0, 16)}...
										</TableCell>
										<TableCell>
											<Badge
												variant={
													(reasonColors[flag.reason] as
														| "destructive"
														| "outline"
														| "secondary") || "secondary"
												}
											>
												{flag.reason}
											</Badge>
										</TableCell>
										<TableCell className="font-mono text-xs">
											{flag.userId.slice(0, 12)}...
										</TableCell>
										<TableCell className="text-xs">
											{new Date(flag.createdAt).toLocaleDateString()}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													flag.status === "resolved"
														? "default"
														: flag.status === "dismissed"
															? "secondary"
															: "outline"
												}
											>
												{flag.status}
											</Badge>
										</TableCell>
										<TableCell>
											{flag.status === "pending" && (
												<div className="flex gap-2">
													<Button
														size="sm"
														variant="default"
														onClick={() =>
															updateMutation.mutate({
																flagId: flag.$id,
																status: "resolved",
															})
														}
													>
														Resolve
													</Button>
													<Button
														size="sm"
														variant="ghost"
														onClick={() =>
															updateMutation.mutate({
																flagId: flag.$id,
																status: "dismissed",
															})
														}
													>
														Dismiss
													</Button>
												</div>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
