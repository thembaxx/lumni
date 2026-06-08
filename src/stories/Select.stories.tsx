import type { Meta, StoryObj } from "@storybook/react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const meta: Meta<typeof Select> = {
	title: "UI/Select",
	component: Select,
	parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
	render: () => (
		<Select defaultValue="option-2">
			<SelectTrigger className="w-48">
				<SelectValue placeholder="Choose an option" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Options</SelectLabel>
					<SelectItem value="option-1">Option One</SelectItem>
					<SelectItem value="option-2">Option Two</SelectItem>
					<SelectItem value="option-3">Option Three</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	),
};

export const WithManyItems: Story = {
	render: () => (
		<Select>
			<SelectTrigger className="w-48">
				<SelectValue placeholder="Pick a subject" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>STEM</SelectLabel>
					<SelectItem value="math">Mathematics</SelectItem>
					<SelectItem value="phys">Physical Sciences</SelectItem>
					<SelectItem value="bio">Life Sciences</SelectItem>
				</SelectGroup>
				<SelectGroup>
					<SelectLabel>Humanities</SelectLabel>
					<SelectItem value="eng">English</SelectItem>
					<SelectItem value="hist">History</SelectItem>
					<SelectItem value="geo">Geography</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	),
};

export const Small: Story = {
	render: () => (
		<Select defaultValue="1">
			<SelectTrigger size="sm" className="w-32">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="1">Small</SelectItem>
				<SelectItem value="2">Compact</SelectItem>
			</SelectContent>
		</Select>
	),
};
