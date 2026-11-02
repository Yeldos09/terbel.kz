import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function Accordion({
  items,
}: {
  items: readonly { id: string; title: string; body: ReactNode }[];
}) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className="divide-y divide-border rounded-2xl border border-border">
      {items.map((item) => (
        <AccordionPrimitive.Item key={item.id} value={item.id}>
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left text-base font-semibold">
              {item.title}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="px-4 pb-4 text-sm leading-6 text-muted-foreground">
            {item.body}
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
