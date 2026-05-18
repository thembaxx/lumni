"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateWithSystem } from "@/lib/ai/client";
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";

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

const CHAT_STORAGE_KEY = "lumni_chat_history";

function serializeMessages(messages: ChatMessage[]): string {
	return JSON.stringify(
		messages.map((m) => ({
			id: m.id,
			role: m.role,
			content: m.content,
			type: m.type || "text",
			timestamp: m.timestamp.toISOString(),
		})),
	);
}

function deserializeMessages(data: string): ChatMessage[] {
	try {
		const parsed = JSON.parse(data);
		return parsed.map(
			(m: {
				id: string;
				role: "user" | "assistant";
				content: string;
				type?: string;
				timestamp: string;
			}) => ({
				...m,
				type: (m.type as ChatMessage["type"]) || "text",
				timestamp: new Date(m.timestamp),
			}),
		);
	} catch {
		return [];
	}
}

export function useChat() {
	const [messages, setMessages] = useState<ChatMessage[]>(() => {
		const saved = loadFromStorage<string>(CHAT_STORAGE_KEY, "");
		if (saved) {
			return deserializeMessages(saved);
		}
		return [];
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const messagesRef = useRef(messages);
	messagesRef.current = messages;

	useEffect(() => {
		const serialized = serializeMessages(messages);
		saveToStorage(CHAT_STORAGE_KEY, serialized);
	}, [messages]);

	const sendMessage = useCallback(async (content: string) => {
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

		const currentMessages = messagesRef.current;
		setMessages((prev) => [...prev, userMessage]);
		setIsLoading(true);
		setError(null);

		try {
			const conversationHistory = currentMessages
				.map((m) =>
					m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`,
				)
				.join("\n\n");

			const fullPrompt = conversationHistory
				? `${conversationHistory}\n\nUser: ${content.trim()}\n\nAssistant:`
				: `User: ${content.trim()}\n\nAssistant:`;

			const result = await generateWithSystem(CHAT_SYSTEM_PROMPT, fullPrompt, {
				temperature: 0.7,
				maxTokens: 1024,
			});

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
	}, []);

	const clearChat = useCallback(() => {
		setMessages([]);
		setError(null);
		localStorage.removeItem(CHAT_STORAGE_KEY);
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
