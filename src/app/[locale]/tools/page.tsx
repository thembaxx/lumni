import type { Metadata } from "next";
import { ToolWorkbench } from "@/components/tools/tool-workbench";

export const metadata: Metadata = {
  title: "Tools - Lumni",
};

export default function ToolsPage() {
  return <ToolWorkbench />;
}
