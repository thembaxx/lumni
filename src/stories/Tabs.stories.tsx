import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab-1" className="w-80">
      <TabsList>
        <TabsTrigger value="tab-1">Account</TabsTrigger>
        <TabsTrigger value="tab-2">Password</TabsTrigger>
        <TabsTrigger value="tab-3">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="tab-1" className="p-3 text-sm">
        Account settings content goes here.
      </TabsContent>
      <TabsContent value="tab-2" className="p-3 text-sm">
        Password settings content goes here.
      </TabsContent>
      <TabsContent value="tab-3" className="p-3 text-sm">
        Notification preferences content goes here.
      </TabsContent>
    </Tabs>
  ),
};

export const LineVariant: Story = {
  render: () => (
    <Tabs defaultValue="tab-1" className="w-80">
      <TabsList variant="line">
        <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        <TabsTrigger value="tab-2">Tab Two</TabsTrigger>
      </TabsList>
      <TabsContent value="tab-1" className="p-3 text-sm">
        Content for tab one.
      </TabsContent>
      <TabsContent value="tab-2" className="p-3 text-sm">
        Content for tab two.
      </TabsContent>
    </Tabs>
  ),
};
