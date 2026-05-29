"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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

interface AdminUser {
	$id: string;
	email: string;
	name: string;
	status: boolean;
	registration: string;
	accessedAt: string | null;
}

export function UsersClient() {
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ["admin-users"],
		queryFn: async () => {
			const res = await fetch("/api/admin/users");
			if (!res.ok) throw new Error("Failed to fetch users");
			return res.json() as Promise<{ users: AdminUser[] }>;
		},
	});

	const updateMutation = useMutation({
		mutationFn: async ({
			userId,
			action,
		}: {
			userId: string;
			action: string;
		}) => {
			const res = await fetch("/api/admin/users", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, action }),
			});
			if (!res.ok) throw new Error("Failed to update user");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
		},
	});

	const users = useMemo(() => data?.users ?? [], [data?.users]);
	const [formattedDates, setFormattedDates] = useState<
		Record<string, { registered: string; accessed: string }>
	>({});

	useEffect(() => {
		const nextDates: Record<string, { registered: string; accessed: string }> =
			{};
		users.forEach((user) => {
			nextDates[user.$id] = {
				registered: new Date(user.registration).toLocaleDateString(),
				accessed: user.accessedAt
					? new Date(user.accessedAt).toLocaleDateString()
					: "—",
			};
		});
		setFormattedDates(nextDates);
	}, [users]);

	return (
		<div className="min-h-dvh bg-background" suppressHydrationWarning>
			<PageHeader title="User Management" subtitle="Manage registered users" />
			<div className="flex flex-col gap-4 p-4">
				<Card>
					<CardHeader>
						<CardTitle>All Users ({users.length})</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Email</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Registered</TableHead>
									<TableHead>Last Active</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading && (
									<TableRow>
										<TableCell
											colSpan={6}
											className="py-8 text-center text-muted-foreground"
										>
											Loading…
										</TableCell>
									</TableRow>
								)}
								{!isLoading && users.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={6}
											className="py-8 text-center text-muted-foreground"
										>
											No users found
										</TableCell>
									</TableRow>
								)}
								{users.map((user) => (
									<TableRow key={user.$id}>
										<TableCell className="font-mono text-xs">
											{user.email}
										</TableCell>
										<TableCell>{user.name || "—"}</TableCell>
										<TableCell>
											<Badge variant={user.status ? "default" : "destructive"}>
												{user.status ? "Active" : "Suspended"}
											</Badge>
										</TableCell>
										<TableCell className="text-xs">
											{formattedDates[user.$id]?.registered ?? "..."}
										</TableCell>
										<TableCell className="text-xs">
											{formattedDates[user.$id]?.accessed ?? "—"}
										</TableCell>
										<TableCell>
											<Button
												size="sm"
												variant={user.status ? "destructive" : "default"}
												onClick={() =>
													updateMutation.mutate({
														userId: user.$id,
														action: user.status ? "suspend" : "activate",
													})
												}
											>
												{user.status ? "Suspend" : "Activate"}
											</Button>
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
