import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@/components/ui/input";

const meta: Meta<typeof Input> = {
	title: "UI/Input",
	component: Input,
	parameters: { layout: "centered" },
	argTypes: {
		type: {
			control: "select",
			options: ["text", "email", "password", "number", "search", "tel", "url"],
		},
		disabled: { control: "boolean" },
		placeholder: { control: "text" },
	},
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
	args: { placeholder: "Enter text...", type: "text" },
};

export const WithValue: Story = {
	args: { defaultValue: "Hello world", type: "text" },
};

export const Disabled: Story = {
	args: { disabled: true, placeholder: "Disabled input", value: "Cannot edit" },
};

export const Email: Story = {
	args: { type: "email", placeholder: "email@example.com" },
};

export const Password: Story = {
	args: { type: "password", defaultValue: "secret123" },
};
