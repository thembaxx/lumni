import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "@/components/ui/textarea";

const meta: Meta<typeof Textarea> = {
	title: "UI/Textarea",
	component: Textarea,
	parameters: { layout: "centered" },
	argTypes: {
		disabled: { control: "boolean" },
		placeholder: { control: "text" },
		rows: { control: "number" },
	},
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
	args: { placeholder: "Write something...", rows: 4 },
};

export const WithContent: Story = {
	args: {
		defaultValue:
			"This is some text content in the textarea. It can span multiple lines.\n\nLike this second paragraph.",
		rows: 6,
	},
};

export const Disabled: Story = {
	args: { disabled: true, value: "This textarea is disabled", rows: 3 },
};
