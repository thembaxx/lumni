"use client";

import { Bookmark01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBookmarksStore } from "@/store/bookmarks";

export default function BookmarksPage() {
	const { bookmarks, removeBookmark } = useBookmarksStore();

	return (
		<div className="min-h-screen bg-system-grouped pt-4 pb-24">
			<div className="max-w-3xl mx-auto w-full px-4 flex flex-col gap-6">
				<h1 className="ios-title-1 font-semibold text-foreground tracking-tight">
					Bookmarked Questions
				</h1>

				{bookmarks.length === 0 ? (
					<Card>
						<CardContent className="p-8 text-center">
							<HugeiconsIcon
								icon={Bookmark01Icon}
								className="size-8 text-muted-foreground/40 mx-auto mb-3"
							/>
							<p className="text-base font-semibold">No bookmarks yet</p>
							<p className="text-sm text-muted-foreground mt-1">
								Bookmark01Icon questions during quizzes to save them here.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="flex flex-col gap-3">
						<p className="text-sm text-muted-foreground">
							{bookmarks.length} saved question
							{bookmarks.length !== 1 ? "s" : ""}
						</p>
						{bookmarks.map((bm) => (
							<Card key={bm.id}>
								<CardHeader className="pb-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Badge variant="outline">{bm.subject}</Badge>
											{bm.topic && (
												<Badge variant="secondary" className="text-xs">
													{bm.topic}
												</Badge>
											)}
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="size-8"
											onClick={() => removeBookmark(bm.id)}
										>
											<HugeiconsIcon
												icon={Delete01Icon}
												className="size-4 text-muted-foreground"
											/>
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									<CardTitle className="text-base font-semibold">
										<MarkdownRenderer content={bm.questionText} />
									</CardTitle>
									{bm.note && (
										<div className="mt-3 p-3 rounded-lg bg-muted/30">
											<p className="text-xs font-medium text-muted-foreground mb-1">
												Note
											</p>
											<p className="text-sm">{bm.note}</p>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
