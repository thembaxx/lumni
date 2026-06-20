"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/headers/page-header";
import { Input } from "@/components/ui/input";

export function NotificationsClient() {
	const queryClient = useQueryClient();
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [url, setUrl] = useState("");
	const [subject, setSubject] = useState("");

	const sendMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/admin/notifications/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					body,
					url: url || undefined,
					subject: subject || undefined,
				}),
			});
			if (!res.ok) throw new Error("Failed to send");
			return res.json() as Promise<{
				success: boolean;
				sent: number;
				total: number;
			}>;
		},
		onSuccess: (_data) => {
			setTitle("");
			setBody("");
			setUrl("");
			setSubject("");
			queryClient.invalidateQueries();
		},
	});

	return (
		<div className="min-h-dvh bg-background">
			<PageHeader
				title="Broadcast Notification"
				subtitle="Send push notifications to users"
			/>
			<div className="mx-auto max-w-xl p-4">
				<Card>
					<CardHeader>
						<CardTitle>Compose Notification</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="notif-title"
								className="font-medium text-muted-foreground text-xs"
							>
								Title *
							</label>
							<Input
								id="notif-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Notification title"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="notif-body"
								className="font-medium text-muted-foreground text-xs"
							>
								Body *
							</label>
							<Input
								id="notif-body"
								value={body}
								onChange={(e) => setBody(e.target.value)}
								placeholder="Notification body text"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="notif-url"
								className="font-medium text-muted-foreground text-xs"
							>
								URL (optional)
							</label>
							<Input
								id="notif-url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="/dashboard"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="notif-subject"
								className="font-medium text-muted-foreground text-xs"
							>
								Subject filter (optional)
							</label>
							<Input
								id="notif-subject"
								value={subject}
								onChange={(e) => setSubject(e.target.value)}
								placeholder="mathematics"
							/>
						</div>
						<Button
							onClick={() => sendMutation.mutate()}
							disabled={!title || !body || sendMutation.isPending}
						>
							{sendMutation.isPending
								? "Sending…"
								: sendMutation.data
									? `Sent to ${sendMutation.data.sent} / ${sendMutation.data.total}`
									: "Send Notification"}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
