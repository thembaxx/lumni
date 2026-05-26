import { Card } from "@/components/ui/card";

interface EmptyFlashcardStateProps {
	type: "no-cards" | "no-results";
}

const messages: Record<EmptyFlashcardStateProps["type"], string> = {
	"no-cards":
		'You haven\'t created any flashcards yet. Click "New Flashcard" to get started!',
	"no-results": "No flashcards match your search",
};

export function EmptyFlashcardState({ type }: EmptyFlashcardStateProps) {
	return (
		<Card className="py-8 text-center">
			<p className="text-muted-foreground">{messages[type]}</p>
		</Card>
	);
}
