"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
	id?: number;
	assignmentId: string;
	senderId: string;
	senderRole: "teacher" | "student";
	content: string;
	createdAt: number;
}

interface AssignmentThreadProps {
	assignmentId: string;
}

export function AssignmentThread({ assignmentId }: AssignmentThreadProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [_loading, setLoading] = useState(true);
	const [newMessage, setNewMessage] = useState("");
	const [sending, setSending] = useState(false);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(`lumni_messages_${assignmentId}`);
			if (raw) setMessages(JSON.parse(raw));
		} catch {}
		setLoading(false);
	}, [assignmentId]);

	const sendMessage = async () => {
		if (!newMessage.trim()) return;
		setSending(true);
		const msg: Message = {
			assignmentId,
			senderId: "current",
			senderRole: "teacher",
			content: newMessage.trim(),
			createdAt: Date.now(),
		};
		const updated = [...messages, msg];
		localStorage.setItem(
			`lumni_messages_${assignmentId}`,
			JSON.stringify(updated),
		);
		setMessages(updated);
		setNewMessage("");
		setSending(false);
	};

	return (
		<div className="space-y-3">
			<div className="flex gap-2">
				<Textarea
					value={newMessage}
					onChange={(e) => setNewMessage(e.target.value)}
					placeholder="Type a message..."
					className="min-h-[40px] text-sm"
				/>
				<Button
					onClick={sendMessage}
					disabled={!newMessage.trim() || sending}
					size="sm"
					className="shrink-0"
				>
					{sending ? "Sending..." : "Send"}
				</Button>
			</div>
			<div className="max-h-64 space-y-2 overflow-y-auto">
				{messages.length === 0 ? (
					<p className="text-muted-foreground text-xs">No messages yet</p>
				) : (
					messages.map((msg, i) => (
						<div
							key={msg.id ?? i}
							className={`rounded-lg border p-3 ${msg.senderRole === "teacher" ? "bg-muted/30" : ""}`}
						>
							<p className="text-sm">{msg.content}</p>
							<p className="mt-1 text-[10px] text-muted-foreground">
								{msg.senderRole === "teacher" ? "Teacher" : "Student"} ·{" "}
								{new Date(msg.createdAt).toLocaleDateString()}
							</p>
						</div>
					))
				)}
			</div>
		</div>
	);
}
