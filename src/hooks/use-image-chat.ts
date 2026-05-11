"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "@/hooks/use-chat";
import { useChat } from "@/hooks/use-chat";
import { useUploadThing } from "@/lib/uploadthing";
import { formatBytes } from "@/lib/utils/format";

export type ImageProcessingStatus =
	| "idle"
	| "reading"
	| "uploading"
	| "sending"
	| "success"
	| "error";

export interface ImageProcessingState {
	status: ImageProcessingStatus;
	progress: number;
	progressMessage: string;
	error: string | null;
}

export interface ImageData {
	dataUrl: string;
	blob: Blob;
	fileName: string;
	fileSize: number;
	uploadedUrl: string | null;
}

interface UseImageChatOptions {
	onProcessingChange?: (state: ImageProcessingState) => void;
}

const DATA_URL_SIZE_LIMIT = 500 * 1024;

export function useImageChat(options: UseImageChatOptions = {}) {
	const { onProcessingChange } = options;
	const [processingState, setProcessingState] = useState<ImageProcessingState>({
		status: "idle",
		progress: 0,
		progressMessage: "",
		error: null,
	});

	const cleanupFnsRef = useRef<Array<() => void>>([]);

	const updateState = useCallback(
		(state: Partial<ImageProcessingState>) => {
			setProcessingState((prev) => {
				const next = { ...prev, ...state };
				onProcessingChange?.(next);
				return next;
			});
		},
		[onProcessingChange],
	);

	const cleanup = useCallback(() => {
		cleanupFnsRef.current.forEach((fn) => {
			try {
				fn();
			} catch {
				// Ignore cleanup errors
			}
		});
		cleanupFnsRef.current = [];
	}, []);

	const readFileAsDataURL = useCallback(
		(file: File): Promise<{ dataUrl: string; blob: Blob }> => {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				const totalSize = file.size;
				let lastReportedPercent = -1;

				reader.onprogress = (event) => {
					if (event.lengthComputable) {
						const loaded = event.loaded;
						const percent = Math.round((loaded / totalSize) * 100);
						if (percent !== lastReportedPercent) {
							lastReportedPercent = percent;
							updateState({
								progress: percent,
								progressMessage: `Preparing... ${formatBytes(loaded)} / ${formatBytes(totalSize)}`,
							});
						}
					}
				};

				reader.onload = () => {
					const dataUrl = reader.result as string;
					const blob = new Blob([file], { type: file.type });
					updateState({
						progress: 100,
						progressMessage: "File ready",
					});
					resolve({ dataUrl, blob });
				};

				reader.onerror = () => {
					reject(new Error("Failed to read file"));
				};

				reader.onabort = () => {
					reject(new Error("File reading was cancelled"));
				};

				reader.readAsDataURL(file);
			});
		},
		[updateState],
	);

	const processImage = useCallback(
		async (file: File): Promise<ImageData> => {
			cleanup();

			updateState({
				status: "reading",
				progress: 0,
				progressMessage: `Preparing ${file.name}...`,
				error: null,
			});

			if (file.size === 0) {
				throw new Error("File is empty");
			}

			if (!file.type.startsWith("image/")) {
				throw new Error("Please select an image file (JPG, PNG, or WebP)");
			}

			const maxSize = 10 * 1024 * 1024;
			if (file.size > maxSize) {
				throw new Error(
					`File too large. Maximum size is ${formatBytes(maxSize)}`,
				);
			}

			const { dataUrl, blob } = await readFileAsDataURL(file);

			cleanupFnsRef.current.push(() => {
				URL.revokeObjectURL(dataUrl);
			});

			updateState({
				status: "success",
				progress: 100,
				progressMessage: "Ready to send",
			});

			return {
				dataUrl,
				blob,
				fileName: file.name,
				fileSize: file.size,
				uploadedUrl: null,
			};
		},
		[cleanup, readFileAsDataURL, updateState],
	);

	const resetState = useCallback(() => {
		setProcessingState({
			status: "idle",
			progress: 0,
			progressMessage: "",
			error: null,
		});
	}, []);

	return {
		processingState,
		processImage,
		resetState,
		cleanup,
		DATA_URL_SIZE_LIMIT,
	};
}

interface RetryableMessage extends ChatMessage {
	processingStatus?: "idle" | "sending" | "success" | "error";
	error?: string | null;
	retryCount?: number;
}

interface UseImageChatWithSendOptions {
	onProcessingChange?: (state: ImageProcessingState) => void;
}

export function useImageChatWithSend(
	chat: ReturnType<typeof useChat>,
	options: UseImageChatWithSendOptions = {},
) {
	const { onProcessingChange } = options;
	const [imageProcessing, setImageProcessing] = useState<ImageProcessingState>({
		status: "idle",
		progress: 0,
		progressMessage: "",
		error: null,
	});

	const { processImage, resetState, cleanup } = useImageChat({
		onProcessingChange,
	});

	const sendImage = useCallback(
		async (file: File) => {
			const userMessage: RetryableMessage = {
				id: crypto.randomUUID(),
				role: "user",
				content: "[Image]",
				timestamp: new Date(),
				type: "image",
				imageUrl: "",
				imageFileName: file.name,
				imageFileSize: file.size,
				processingStatus: "sending",
				error: null,
				retryCount: 0,
			};

			chat.setMessages(
				(prev) => [...prev, userMessage as ChatMessage] as ChatMessage[],
			);
			chat.setIsLoading(true);

			try {
				const imageData = await processImage(file);

				chat.setMessages(
					(prev) =>
						prev.map((m) =>
							m.id === userMessage.id
								? {
										...m,
										imageUrl: imageData.dataUrl,
										imageFileName: imageData.fileName,
										imageFileSize: imageData.fileSize,
									}
								: m,
						) as ChatMessage[],
				);

				setImageProcessing((prev) => ({
					...prev,
					status: "sending",
					progressMessage: "Sending to AI...",
				}));

				const response = await fetch("/api/chat/image", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						imageUrl: imageData.dataUrl,
						imageName: imageData.fileName,
					}),
				});

				if (!response.ok) {
					throw new Error(
						response.status === 429
							? "Too many requests. Please wait a moment and try again."
							: response.status >= 500
								? "AI service is temporarily unavailable. Please try again."
								: `Request failed (${response.status})`,
					);
				}

				const result = await response.json();

				if (result.error) {
					throw new Error(result.error);
				}

				const assistantMessage: ChatMessage = {
					id: crypto.randomUUID(),
					role: "assistant",
					content:
						result.content ||
						"I can see your image. How can I help you with it?",
					timestamp: new Date(),
				};

				chat.setMessages(
					(prev) =>
						[
							...prev.map((m) =>
								m.id === userMessage.id
									? { ...m, processingStatus: "success" as const }
									: m,
							),
							assistantMessage,
						] as ChatMessage[],
				);

				setImageProcessing({
					status: "idle",
					progress: 0,
					progressMessage: "",
					error: null,
				});

				cleanup();
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Something went wrong. Please try again.";

				setImageProcessing({
					status: "error",
					progress: 0,
					progressMessage: "",
					error: errorMessage,
				});

				chat.setMessages(
					(prev) =>
						prev.map((m) =>
							m.id === userMessage.id
								? {
										...m,
										processingStatus: "error" as const,
										error: errorMessage,
									}
								: m,
						) as ChatMessage[],
				);
			} finally {
				chat.setIsLoading(false);
			}
		},
		[chat, processImage, cleanup],
	);

	const retryLastImage = useCallback(
		async (messageId: string) => {
			chat.setMessages((prev) => {
				const msg = prev.find((m) => m.id === messageId);
				if (!msg || msg.type !== "image" || !msg.imageUrl) return prev;

				const currentMsg = msg as RetryableMessage;
				if (currentMsg.processingStatus === "sending") return prev;

				return prev.map((m) =>
					m.id === messageId
						? {
								...m,
								processingStatus: "sending" as const,
								error: null,
								retryCount: (currentMsg.retryCount || 0) + 1,
							}
						: m,
				) as ChatMessage[];
			});

			setImageProcessing({
				status: "sending",
				progress: 0,
				progressMessage: "Retrying...",
				error: null,
			});

			try {
				const response = await fetch("/api/chat/image", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						imageUrl: chat.messages.find((m) => m.id === messageId)?.imageUrl,
						imageName: chat.messages.find((m) => m.id === messageId)
							?.imageFileName,
					}),
				});

				if (!response.ok) {
					throw new Error(
						response.status === 429
							? "Too many requests. Please wait a moment and try again."
							: response.status >= 500
								? "AI service is temporarily unavailable. Please try again."
								: `Request failed (${response.status})`,
					);
				}

				const result = await response.json();

				if (result.error) {
					throw new Error(result.error);
				}

				const assistantMessage: ChatMessage = {
					id: crypto.randomUUID(),
					role: "assistant",
					content:
						result.content ||
						"I can see your image. How can I help you with it?",
					timestamp: new Date(),
				};

				chat.setMessages(
					(prev) =>
						prev.map((m) =>
							m.id === messageId
								? { ...m, processingStatus: "success" as const }
								: m,
						) as ChatMessage[],
				);

				chat.setMessages((prev) => [...prev, assistantMessage]);

				setImageProcessing({
					status: "idle",
					progress: 0,
					progressMessage: "",
					error: null,
				});
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Something went wrong. Please try again.";

				setImageProcessing({
					status: "error",
					progress: 0,
					progressMessage: "",
					error: errorMessage,
				});

				chat.setMessages(
					(prev) =>
						prev.map((m) =>
							m.id === messageId
								? {
										...m,
										processingStatus: "error" as const,
										error: errorMessage,
									}
								: m,
						) as ChatMessage[],
				);
			} finally {
				chat.setIsLoading(false);
			}
		},
		[chat],
	);

	return {
		imageProcessing,
		sendImage,
		retryLastImage,
		resetState,
		cleanup,
		DATA_URL_SIZE_LIMIT,
	};
}
