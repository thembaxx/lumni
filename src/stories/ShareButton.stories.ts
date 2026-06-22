import type { Meta, StoryObj } from "@storybook/react";
import { ShareResultButton } from "@/components/shared/share-button";

const meta: Meta<typeof ShareResultButton> = {
  title: "Shared/ShareResultButton",
  component: ShareResultButton,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ShareResultButton>;

export const QuizShare: Story = {
  args: {
    cardParams: {
      score: 17,
      total: 20,
      percentage: 85,
      title: "Mathematics Quiz",
      subtitle: "17 / 20 Correct · 6/7 APS",
      type: "quiz",
    },
    text: "I scored 85% on my Mathematics quiz on Lumni!",
  },
};

export const ExamShare: Story = {
  args: {
    cardParams: {
      score: 42,
      total: 50,
      percentage: 84,
      title: "Physical Sciences Exam",
      subtitle: "42 / 50 Correct · 6/7 APS",
      type: "exam",
    },
    text: "I scored 84% on my Physical Sciences exam on Lumni!",
  },
};

export const FlashcardShare: Story = {
  args: {
    cardParams: {
      score: 15,
      total: 20,
      percentage: 75,
      title: "History Flashcards",
      subtitle: "15 / 20 Mastered",
      type: "flashcard",
    },
    text: "I mastered 75% of my History flashcards on Lumni!",
  },
};
