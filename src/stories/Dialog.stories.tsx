import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

const meta: Meta<typeof Dialog> = {
	title: "UI/Dialog",
	component: Dialog,
	parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
	render: () => (
		<Dialog open>
			<DialogTrigger render={<Button>Open Dialog</Button>} />
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Confirm Action</DialogTitle>
					<DialogDescription>
						Are you sure you want to proceed? This action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline">Cancel</Button>
					<Button>Confirm</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
};

export const WithoutClose: Story = {
	render: () => (
		<Dialog open>
			<DialogTrigger render={<Button>No Close</Button>} />
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>No Close Button</DialogTitle>
					<DialogDescription>
						This dialog hides the close button.
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	),
};
