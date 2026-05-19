"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";
import {
	type StudySet,
	useStudySetStorage,
} from "./hooks/use-study-set-storage";
import { StudySetForm } from "./study-set-editor";
import { StudySetList } from "./study-set-list";

interface StudySetCreatorProps {
	className?: string;
}

export function StudySetCreator({ className }: StudySetCreatorProps) {
	const {
		studySets,
		addStudySet,
		removeStudySet,
		updateStudySet,
		toggleFavorite,
	} = useStudySetStorage();
	const [isCreating, setIsCreating] = useState(false);
	const [editingStudySetId, setEditingStudySetId] = useState<string | null>(
		null,
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [filter, setFilter] = useState<"all" | "favorites">("all");

	const handleCreateStudySet = (studySet: StudySet) => {
		addStudySet(studySet);
		setIsCreating(false);
	};

	const handleUpdateStudySet = (studySet: StudySet) => {
		if (editingStudySetId) {
			updateStudySet(editingStudySetId, studySet);
		}
		setIsCreating(false);
		setEditingStudySetId(null);
	};

	const handleDeleteStudySet = (id: string) => {
		removeStudySet(id);
	};

	const handleToggleFavorite = (id: string) => {
		toggleFavorite(id);
	};

	const filteredStudySets = studySets
		.filter(
			(set) =>
				set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				set.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(set.tags || []).some((tag) =>
					tag.toLowerCase().includes(searchQuery.toLowerCase()),
				),
		)
		.filter((set) => {
			if (filter === "favorites") {
				return set.isFavorite === true;
			}
			return true;
		});

	return (
		<motion.div
			className={cn("w-full max-w-2xl mx-auto", className)}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -8 }}
			transition={{ duration: 0.25, ease: iOSEase }}
		>
			<Card className="mb-6">
				<CardHeader className="pb-4">
					<CardTitle className="text-2xl font-bold">
						Study Set Creator
					</CardTitle>
					<p className="text-muted-foreground">
						Organize your flashcards and notes into study sets
					</p>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="flex-1 min-w-0">
							<Input
								placeholder="Search study sets..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="mb-2"
							/>
							{studySets.length > 0 && (
								<p className="text-xs text-muted-foreground">
									{studySets.length} study sets total
								</p>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								onClick={() => setFilter("all")}
								className={cn(
									"px-3 py-1 rounded text-sm",
									filter === "all"
										? "bg-accent/20 text-accent"
										: "text-muted-foreground hover:bg-accent/10",
								)}
							>
								All
							</Button>
							<Button
								variant="outline"
								onClick={() => setFilter("favorites")}
								className={cn(
									"px-3 py-1 rounded text-sm",
									filter === "favorites"
										? "bg-accent/20 text-accent"
										: "text-muted-foreground hover:bg-accent/10",
								)}
							>
								Favorites ({studySets.filter((s) => s.isFavorite).length})
							</Button>
						</div>
						<Button
							variant="outline"
							onClick={() => setIsCreating(true)}
							className="shrink-0"
						>
							New Study Set
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Study Set List */}
			{filteredStudySets.length > 0 && (
				<Card>
					<CardHeader className="pb-4">
						<CardTitle className="text-lg font-medium">
							Your Study Sets
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<StudySetList
							studySets={filteredStudySets}
							onEdit={(id) => {
								setEditingStudySetId(id);
								setIsCreating(true);
							}}
							onDelete={handleDeleteStudySet}
							onToggleFavorite={handleToggleFavorite}
						/>
					</CardContent>
				</Card>
			)}

			{/* Empty State */}
			{filteredStudySets.length === 0 && studySets.length > 0 && (
				<Card className="text-center py-8">
					<p className="text-muted-foreground">
						No study sets match your search
					</p>
				</Card>
			)}

			{filteredStudySets.length === 0 && studySets.length === 0 && (
				<Card className="text-center py-8">
					<p className="text-muted-foreground">
						You haven't created any study sets yet. Click "New Study Set" to get
						started!
					</p>
				</Card>
			)}

			{/* Create/Edit Study Set Modal */}
			<Dialog open={isCreating} onOpenChange={setIsCreating}>
				<DialogContent className="w-full max-w-md sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{editingStudySetId ? "Edit Study Set" : "Create New Study Set"}
						</DialogTitle>
						<DialogDescription>
							Create or edit a study set to organize your learning materials
						</DialogDescription>
					</DialogHeader>
					<StudySetForm
						initialValues={
							editingStudySetId
								? studySets.find((s) => s.id === editingStudySetId) || undefined
								: undefined
						}
						onSubmit={(studySet) => {
							if (editingStudySetId) {
								handleUpdateStudySet(studySet);
							} else {
								handleCreateStudySet(studySet);
							}
							setIsCreating(false);
							setEditingStudySetId(null);
						}}
						onCancel={() => {
							setIsCreating(false);
							setEditingStudySetId(null);
						}}
					/>
				</DialogContent>
			</Dialog>
		</motion.div>
	);
}
