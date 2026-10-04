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
  "aria-label"?: string;
}

const MemoSwitch = memo(function MemoSwitch({
  checked,
  onCheckedChange,
  disabled,
  ariaLabel,
}: Pick<LabelledSwitchProps, "checked" | "onCheckedChange" | "disabled"> & {
  ariaLabel: string;
}) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel}
    />
  );
});

export function LabelledSwitch({
  title,
  subtitle,
  showSeparator,
  checked,
  onCheckedChange,
  disabled,
  "aria-label": ariaLabel,
}: LabelledSwitchProps) {
  return (
    <ListCell
      title={title}
      subtitle={subtitle}
      showSeparator={showSeparator}
      trailing={
        <MemoSwitch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          ariaLabel={ariaLabel ?? title}
        />
      }
    />
  );
}
