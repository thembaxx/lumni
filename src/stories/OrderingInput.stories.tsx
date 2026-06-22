import type { Meta, StoryObj } from "@storybook/react";
import { OrderingInput } from "@/components/quiz/parts/ordering-input";

const meta: Meta<typeof OrderingInput> = {
  title: "Quiz/OrderingInput",
  component: OrderingInput,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof OrderingInput>;

const sampleItems = [
  { id: "a", text: "State the hypothesis" },
  { id: "b", text: "Gather experimental data" },
  { id: "c", text: "Analyse the results" },
  { id: "d", text: "Draw a conclusion" },
];

export const Default: Story = {
  args: {
    items: sampleItems,
    onSubmit: (ids) => console.log("Submitted order:", ids),
  },
};

export const TwoItems: Story = {
  args: {
    items: [
      { id: "1", text: "Input" },
      { id: "2", text: "Output" },
    ],
    onSubmit: (ids) => console.log("Submitted order:", ids),
  },
};

export const MathSteps: Story = {
  args: {
    items: [
      { id: "s1", text: "$2x + 3 = 7$" },
      { id: "s2", text: "$2x = 4$" },
      { id: "s3", text: "$x = 2$" },
    ],
    onSubmit: (ids) => console.log("Submitted order:", ids),
  },
};
