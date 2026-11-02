import * as Dropdown from "@radix-ui/react-dropdown-menu";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/utils.ts";

export function Menu(props: ComponentProps<typeof Dropdown.Root>) {
  return <Dropdown.Root {...props} />;
}

export function MenuTrigger(props: ComponentProps<typeof Dropdown.Trigger>) {
  return <Dropdown.Trigger {...props} />;
}

export function MenuContent({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content
        sideOffset={8}
        className={cn(
          "z-50 min-w-52 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl",
          className,
        )}
      >
        {children}
      </Dropdown.Content>
    </Dropdown.Portal>
  );
}

export function MenuItem({ className, ...props }: ComponentProps<typeof Dropdown.Item>) {
  return (
    <Dropdown.Item
      className={cn(
        "cursor-pointer rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent",
        className,
      )}
      {...props}
    />
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <Dropdown.Label className="px-3 py-1 text-xs text-muted-foreground">{children}</Dropdown.Label>;
}
