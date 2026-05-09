"use client";

import { ChevronLeft, ChevronRight, Download, FileText } from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { ExamPaper } from "@/types/exam";

interface PdfViewerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	exam: ExamPaper;
}

export function PdfViewerImpl({ open, onOpenChange, exam }: PdfViewerProps) {
	const [pdfPage, setPdfPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [workerReady, setWorkerReady] = useState(false);
	const initRef = useRef(false);

	const pdfUrl = exam.fileUrl || exam.src || exam.localPath || exam.url;

	useEffect(() => {
		if (initRef.current) return;
		initRef.current = true;
		pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
		setWorkerReady(true);
	}, []);

	useEffect(() => {
		if (!open) {
			setPdfPage(1);
			setTotalPages(0);
			setIsLoading(true);
			setError(null);
		}
	}, [open]);

	const handlePrevPage = useCallback(
		() => setPdfPage((p) => Math.max(1, p - 1)),
		[],
	);
	const handleNextPage = useCallback(
		() => setPdfPage((p) => Math.min(totalPages, p + 1)),
		[totalPages],
	);

	const handleDownload = useCallback(() => {
		if (pdfUrl) {
			window.open(pdfUrl, "_blank");
		}
	}, [pdfUrl]);

	const onDocumentLoadSuccess = useCallback(
		({ numPages }: { numPages: number }) => {
			setTotalPages(numPages);
			setIsLoading(false);
		},
		[],
	);

	const onDocumentLoadError = useCallback((err: Error) => {
		console.error("PDF load error:", err);
		setError(err.message);
		setIsLoading(false);
	}, []);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[98vw] h-full max-h-[95vh] p-0 gap-0 rounded-2xl overflow-hidden">
				<div className="flex flex-col h-full">
					<div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
						<div className="flex items-center gap-2 min-w-0 flex-1">
							<h2 className="text-sm font-semibold truncate">{exam.title}</h2>
							<Badge
								variant="secondary"
								className="text-[10px] px-1.5 shrink-0"
							>
								{exam.year}
							</Badge>
						</div>

						<div className="flex items-center gap-0.5">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={handlePrevPage}
								disabled={pdfPage <= 1 || totalPages === 0}
							>
								<ChevronLeft className="w-4 h-4" />
							</Button>
							<span className="text-xs w-12 text-center text-muted-foreground">
								{totalPages > 0 ? `${pdfPage}/${totalPages}` : "—"}
							</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={handleNextPage}
								disabled={pdfPage >= totalPages || totalPages === 0}
							>
								<ChevronRight className="w-4 h-4" />
							</Button>
							<Button
								variant="secondary"
								size="sm"
								className="h-8 ml-1 text-xs"
								onClick={handleDownload}
							>
								<Download className="w-4 h-4" />
							</Button>
						</div>
					</div>

					<div className="flex-1 overflow-hidden relative">
						{!workerReady ? (
							<div className="absolute inset-0 flex items-center justify-center bg-background/80">
								<div className="flex flex-col items-center gap-2">
									<div className="w-5 h-5 rounded-full border border-muted border-t-foreground animate-spin" />
									<span className="text-xs text-muted-foreground">
										Initializing PDF viewer...
									</span>
								</div>
							</div>
						) : isLoading && !error ? (
							<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
								<div className="flex flex-col items-center gap-2">
									<div className="w-5 h-5 rounded-full border border-muted border-t-foreground animate-spin" />
									<span className="text-xs text-muted-foreground">
										Loading PDF...
									</span>
								</div>
							</div>
						) : pdfUrl ? (
							<div className="w-full h-full overflow-auto flex items-start justify-center p-4">
								<Document
									file={pdfUrl}
									onLoadSuccess={onDocumentLoadSuccess}
									onLoadError={onDocumentLoadError}
									loading={null}
								>
									<Page
										pageNumber={pdfPage}
										renderTextLayer={false}
										renderAnnotationLayer={false}
										className="shadow-lg"
									/>
								</Document>
							</div>
						) : (
							<div className="flex items-center justify-center h-full">
								<div className="text-center">
									<FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
									<p className="text-sm text-muted-foreground">
										PDF unavailable
									</p>
								</div>
							</div>
						)}
						{error && (
							<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
								<div className="text-center">
									<FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
									<p className="text-sm text-muted-foreground">
										Failed to load PDF
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										{error}
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}