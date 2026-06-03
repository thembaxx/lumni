import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "@/components/ui/progress";

const meta: Meta<typeof Progress> = {
	title: "UI/Progress",
	component: Progress,
	parameters: { layout: "centered" },
	argTypes: {
		value: {
			control: { type: "range", min: 0, max: 100, step: 1 },
		},
	},
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Halfway: Story = {
	render: () => (
		<div className="w-80">
			<div className="mb-1 flex justify-between text-xs">
				<span>Progress</span>
				<span className="tabular-nums">50%</span>
			</div>
			<Progress value={50} />
		</div>
	),
};

export const Complete: Story = {
	render: () => (
		<div className="w-80">
			<div className="mb-1 flex justify-between text-xs">
				<span>Complete</span>
				<span className="tabular-nums">100%</span>
			</div>
			<Progress value={100} />
		</div>
	),
};

export const Empty: Story = {
	render: () => (
		<div className="w-80">
			<div className="mb-1 flex justify-between text-xs">
				<span>Empty</span>
				<span className="tabular-nums">0%</span>
			</div>
			<Progress value={0} />
		</div>
	),
};
