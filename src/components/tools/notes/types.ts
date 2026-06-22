export interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  subject?: string;
  topic?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}
