import { memo } from "react";
import { ListCell } from "@/components/ui/list-cell";
import { Switch } from "@/components/ui/switch";

interface LabelledSwitchProps {
  title: string;
  subtitle?: string;
  showSeparator?: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const MemoSwitch = memo(function MemoSwitch({
  checked,
  onCheckedChange,
  disabled,
}: Pick<LabelledSwitchProps, "checked" | "onCheckedChange" | "disabled">) {
  return <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />;
});

export function LabelledSwitch({
  title,
  subtitle,
  showSeparator,
  checked,
  onCheckedChange,
  disabled,
}: LabelledSwitchProps) {
  return (
    <ListCell
      title={title}
      subtitle={subtitle}
      showSeparator={showSeparator}
      trailing={
        <MemoSwitch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      }
    />
  );
}
