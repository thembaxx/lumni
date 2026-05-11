"use client";

import { useCallback, useState } from "react";
import { generateWithSystem } from "@/lib/ai/client";

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	type?: "text" | "voice" | "image";
	audioDataUrl?: string;
	imageUrl?: string;
	imageFileName?: string;
	imageFileSize?: number;
	processingStatus?: "idle" | "sending" | "success" | "error";
	error?: string | null;
	retryCount?: number;
}

const CHAT_SYSTEM_PROMPT = `You are a helpful study assistant and tutor. Your role is to help students understand their subjects, answer questions, explain concepts, and provide guidance on their studies. Be friendly, encouraging, and patient. Use clear explanations with examples when helpful. If you don't know something, admit it and try to help them find the answer.`;

export function useChat() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const sendMessage = useCallback(
		async (content: string) => {
			if (!content.trim()) return;

			const isVoice = content.startsWith("data:audio/");
			const userMessage: ChatMessage = {
				id: crypto.randomUUID(),
				role: "user",
				content: content.trim(),
				timestamp: new Date(),
				type: isVoice ? "voice" : "text",
				audioDataUrl: isVoice ? content.trim() : undefined,
			};

			setMessages((prev) => [...prev, userMessage]);
			setIsLoading(true);
			setError(null);

			try {
				const conversationHistory = messages
					.map((m) =>
						m.role === "user"
							? `User: ${m.content}`
							: `Assistant: ${m.content}`,
					)
					.join("\n\n");

				const fullPrompt = conversationHistory
					? `${conversationHistory}\n\nUser: ${content.trim()}\n\nAssistant:`
					: `User: ${content.trim()}\n\nAssistant:`;

				const result = await generateWithSystem(
					CHAT_SYSTEM_PROMPT,
					fullPrompt,
					{
						temperature: 0.7,
						maxTokens: 1024,
					},
				);

				if (!("available" in result) || !result.available) {
					const errorResult = result as { error?: string };
					throw new Error(errorResult.error || "AI service unavailable");
				}

				const assistantMessage: ChatMessage = {
					id: crypto.randomUUID(),
					role: "assistant",
					content:
						(result as { content?: string }).content ||
						"I apologize, I couldn't generate a response.",
					timestamp: new Date(),
				};

				setMessages((prev) => [...prev, assistantMessage]);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Something went wrong");
				const errorMessage: ChatMessage = {
					id: crypto.randomUUID(),
					role: "assistant",
					content: "Sorry, I hit a problem. Give me another try.",
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, errorMessage]);
			} finally {
				setIsLoading(false);
			}
		},
		[messages],
	);

	const clearChat = useCallback(() => {
		setMessages([]);
		setError(null);
	}, []);

	return {
		messages,
		setMessages,
		isLoading,
		setIsLoading,
		error,
		sendMessage,
		clearChat,
	};
}
