"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/headers/page-header";
import { Input } from "@/components/ui/input";

export function NotificationsClient() {
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
		onSuccess: (data) => {
			setTitle("");
			setBody("");
			setUrl("");
			setSubject("");
		},
	});

	return (
		<div className="min-h-[100dvh] bg-background">
			<PageHeader
				title="Broadcast Notification"
				subtitle="Send push notifications to users"
			/>
			<div className="p-4 max-w-xl mx-auto">
				<Card>
					<CardHeader>
						<CardTitle>Compose Notification</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-medium text-muted-foreground">
								Title *
							</label>
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Notification title"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-medium text-muted-foreground">
								Body *
							</label>
							<Input
								value={body}
								onChange={(e) => setBody(e.target.value)}
								placeholder="Notification body text"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-medium text-muted-foreground">
								URL (optional)
							</label>
							<Input
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="/dashboard"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-medium text-muted-foreground">
								Subject filter (optional)
							</label>
							<Input
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
								? "Sending..."
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
