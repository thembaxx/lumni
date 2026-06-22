import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "@/components/ui/skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["pulse", "shimmer"],
    },
    shape: {
      control: "select",
      options: ["default", "text", "card", "avatar", "circle"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = {
  args: { shape: "text" },
};

export const Card: Story = {
  args: { shape: "card" },
};

export const Avatar: Story = {
  args: { shape: "avatar" },
};

export const Circle: Story = {
  args: { shape: "circle" },
};

export const Shimmer: Story = {
  args: { shape: "card", variant: "shimmer" },
};
