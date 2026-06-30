import type { Meta, StoryObj } from "@storybook/react";
import { DiagramLabellingInput } from "@/components/quiz/parts/diagram-labelling-input";

const meta: Meta<typeof DiagramLabellingInput> = {
  title: "Quiz/DiagramLabellingInput",
  component: DiagramLabellingInput,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof DiagramLabellingInput>;

export const BlankDiagram: Story = {
  args: {
    width: 400,
    height: 300,
    regions: [
      { id: "r1", label: "Nucleus", x: 50, y: 40, width: 100, height: 80 },
      {
        id: "r2",
        label: "Cell membrane",
        x: 10,
        y: 10,
        width: 380,
        height: 280,
      },
      {
        id: "r3",
        label: "Mitochondria",
        x: 250,
        y: 150,
        width: 80,
        height: 60,
      },
    ],
    labels: [
      { id: "l1", text: "Nucleus" },
      { id: "l2", text: "Cell membrane" },
      { id: "l3", text: "Mitochondria" },
    ],
    onSubmit: (_placements) => {},
  },
};

export const TwoRegions: Story = {
  args: {
    width: 300,
    height: 200,
    regions: [
      { id: "top", label: "Top region", x: 50, y: 20, width: 200, height: 60 },
      {
        id: "bot",
        label: "Bottom region",
        x: 50,
        y: 120,
        width: 200,
        height: 60,
      },
    ],
    labels: [
      { id: "a", text: "Top" },
      { id: "b", text: "Bottom" },
    ],
    onSubmit: (_placements) => {},
  },
};
