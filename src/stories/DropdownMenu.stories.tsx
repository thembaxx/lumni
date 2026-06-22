import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import {
  DropdownList,
  DropdownListContent,
  DropdownListGroup,
  DropdownListItem,
  DropdownListLabel,
  DropdownListSeparator,
  DropdownListTrigger,
} from "@/components/ui/dropdown-menu";

const meta: Meta<typeof DropdownList> = {
  title: "UI/DropdownMenu",
  component: DropdownList,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof DropdownList>;

export const Default: Story = {
  render: () => (
    <DropdownList>
      <DropdownListTrigger render={<Button variant="outline">Menu</Button>} />
      <DropdownListContent className="w-48">
        <DropdownListLabel>My Account</DropdownListLabel>
        <DropdownListSeparator />
        <DropdownListGroup>
          <DropdownListItem>Profile</DropdownListItem>
          <DropdownListItem>Settings</DropdownListItem>
          <DropdownListItem>Billing</DropdownListItem>
        </DropdownListGroup>
        <DropdownListSeparator />
        <DropdownListItem>Log out</DropdownListItem>
      </DropdownListContent>
    </DropdownList>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <DropdownList>
      <DropdownListTrigger render={<Button>Actions</Button>} />
      <DropdownListContent className="w-48">
        <DropdownListItem>Edit</DropdownListItem>
        <DropdownListItem>Duplicate</DropdownListItem>
        <DropdownListItem>Archive</DropdownListItem>
        <DropdownListSeparator />
        <DropdownListItem>Delete</DropdownListItem>
      </DropdownListContent>
    </DropdownList>
  ),
};
