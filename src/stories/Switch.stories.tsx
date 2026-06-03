import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "@/components/ui/switch";

const meta: Meta<typeof Switch> = {
	title: "UI/Switch",
	component: Switch,
	parameters: { layout: "centered" },
	argTypes: {
		size: {
			control: "select",
			options: ["sm", "default"],
		},
	},
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Unchecked: Story = {
	args: { defaultChecked: false },
};

export const Checked: Story = {
	args: { defaultChecked: true },
};

export const Small: Story = {
	args: { size: "sm", defaultChecked: true },
};
