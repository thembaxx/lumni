import type { Meta, StoryObj } from "@storybook/react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const meta: Meta<typeof Card> = {
	title: "UI/Card",
	component: Card,
	parameters: { layout: "centered" },
	argTypes: {
		size: {
			control: "select",
			options: ["default", "sm"],
		},
	},
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
	render: (args) => (
		<div className="w-80">
			<Card {...args}>
				<CardHeader>
					<CardTitle>Card Title</CardTitle>
					<CardDescription>Optional description for the card.</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Card content goes here. This is the main body of the card.</p>
				</CardContent>
				<CardFooter>
					<p className="text-muted-foreground text-xs">Card footer</p>
				</CardFooter>
			</Card>
		</div>
	),
};

export const Small: Story = {
	render: () => (
		<div className="w-80">
			<Card size="sm">
				<CardHeader>
					<CardTitle>Compact Card</CardTitle>
				</CardHeader>
				<CardContent>
					<p>Compact variant with less padding.</p>
				</CardContent>
			</Card>
		</div>
	),
};

export const ContentOnly: Story = {
	render: () => (
		<div className="w-80">
			<Card>
				<CardContent>
					<p>A minimal card with just content, no header or footer.</p>
				</CardContent>
			</Card>
		</div>
	),
};
