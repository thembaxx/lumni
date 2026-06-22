export interface FlashcardDeckCard {
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  subject: string;
  topic?: string;
  title: string;
  description?: string;
  cards: FlashcardDeckCard[];
  cardCount: number;
  createdBy: string;
  createdAt: number;
}
