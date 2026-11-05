import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../lib/utils.ts";

export function Switch({
  checked,
  onCheckedChange,
  labelledBy,
  ariaLabel,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  labelledBy?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      className={cn(
        "relative h-6 w-11 cursor-pointer rounded-full bg-accent data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-foreground transition-transform data-[state=checked]:translate-x-[1.35rem] data-[state=checked]:bg-primary-foreground" />
    </SwitchPrimitive.Root>
  );
}
