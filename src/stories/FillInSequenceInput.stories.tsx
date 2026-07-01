import type { Meta, StoryObj } from "@storybook/react";
import { FillInSequenceInput } from "@/components/quiz/parts/fill-in-sequence-input";

const meta: Meta<typeof FillInSequenceInput> = {
  title: "Quiz/FillInSequenceInput",
  component: FillInSequenceInput,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof FillInSequenceInput>;

export const ChemicalEquation: Story = {
  args: {
    sequence: [{ text: "2H₂ + " }, { text: "", blankId: "b1" }, { text: " → 2H₂O" }],
    blanks: [
      {
        id: "b1",
        correctAnswer: "O₂",
        distractors: ["O", "H₂", "OH"],
      },
    ],
    onSubmit: (_answers) => {},
  },
};

export const MathFormula: Story = {
  args: {
    sequence: [
      { text: "Area = " },
      { text: "", blankId: "b1" },
      { text: " × " },
      { text: "", blankId: "b2" },
    ],
    blanks: [
      { id: "b1", correctAnswer: "length", distractors: ["width", "height"] },
      { id: "b2", correctAnswer: "width", distractors: ["length", "height"] },
    ],
    onSubmit: (_answers) => {},
  },
};

export const SingleBlank: Story = {
  args: {
    sequence: [{ text: "The capital of France is " }, { text: "", blankId: "b1" }, { text: "." }],
    blanks: [
      {
        id: "b1",
        correctAnswer: "Paris",
        distractors: ["London", "Berlin", "Madrid"],
      },
    ],
    onSubmit: (_answers) => {},
  },
};
