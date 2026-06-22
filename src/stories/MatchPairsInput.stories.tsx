import type { Meta, StoryObj } from "@storybook/react";
import { MatchPairsInput } from "@/components/quiz/parts/match-pairs-input";

const meta: Meta<typeof MatchPairsInput> = {
  title: "Quiz/MatchPairsInput",
  component: MatchPairsInput,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof MatchPairsInput>;

export const Shapes: Story = {
  args: {
    leftItems: [
      { id: "l1", text: "Square" },
      { id: "l2", text: "Circle" },
      { id: "l3", text: "Triangle" },
    ],
    rightItems: [
      { id: "r1", text: "Four equal sides" },
      { id: "r2", text: "No straight edges" },
      { id: "r3", text: "Three sides" },
    ],
    onSubmit: (matches) => console.log("Submitted:", matches),
  },
};

export const TermDefinition: Story = {
  args: {
    leftItems: [
      { id: "t1", text: "Photosynthesis" },
      { id: "t2", text: "Respiration" },
      { id: "t3", text: "Transpiration" },
    ],
    rightItems: [
      { id: "d1", text: "Water loss from leaves" },
      { id: "d2", text: "Converting light to chemical energy" },
      { id: "d3", text: "Breaking down glucose for energy" },
    ],
    onSubmit: (matches) => console.log("Submitted:", matches),
  },
};

export const TwoPairs: Story = {
  args: {
    leftItems: [
      { id: "a", text: "Mass" },
      { id: "b", text: "Volume" },
    ],
    rightItems: [
      { id: "x", text: "Amount of matter" },
      { id: "y", text: "Space occupied" },
    ],
    onSubmit: (matches) => console.log("Submitted:", matches),
  },
};
