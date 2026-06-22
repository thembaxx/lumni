import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { PopoverContent } from "@/components/ui/popover-content";
import { PopoverTrigger } from "@/components/ui/popover-trigger";

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover open>
      <PopoverTrigger>
        <Button>Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm">Popover Title</p>
          <p className="text-muted-foreground text-xs">
            This is the popover content area. It can contain text, links, or other UI elements.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
