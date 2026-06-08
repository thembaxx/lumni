import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "@/components/ui/toast";

const meta: Meta<typeof Toaster> = {
	title: "UI/Toast",
	component: Toaster,
	parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
	render: () => (
		<div className="flex flex-col items-center gap-4">
			<Toaster />
			<div className="flex flex-wrap gap-2">
				<Button
					variant="outline"
					onClick={() =>
						toast({ type: "success", message: "Saved successfully!" })
					}
				>
					Success Toast
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						toast({ type: "error", message: "Something went wrong" })
					}
				>
					Error Toast
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						toast({
							type: "info",
							message: "Did you know?",
							description: "This is an informational message.",
						})
					}
				>
					Info Toast
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						toast({ type: "warning", message: "Please review your answers" })
					}
				>
					Warning Toast
				</Button>
			</div>
		</div>
	),
};
