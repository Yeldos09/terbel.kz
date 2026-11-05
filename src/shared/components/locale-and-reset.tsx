import { useState } from "react";
import { toast } from "sonner";
import { useTheme, type ThemeName } from "../../app/theme-context.ts";
import type { Locale } from "../../domain/types.ts";
import { repository } from "../../mocks/repository.ts";
import { useI18n, useMessages } from "../i18n/context.ts";
import { describeError } from "../lib/describe-error.ts";
import { cn } from "../lib/utils.ts";
import { Button } from "../ui/button.tsx";
import { ConfirmDialog } from "./confirm-dialog.tsx";

export function LocaleSwitch() {
  const { locale, setLocale } = useI18n();
  const messages = useMessages();
  const choose = (next: Locale) => {
    if (next !== locale) setLocale(next);
  };
  return (
    <div className="flex items-center gap-2" role="group" aria-label={messages.langLabel}>
      <span className="text-xs text-muted-foreground">{messages.langLabel}</span>
      {(["ru", "kk"] as const).map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={locale === code}
          onClick={() => choose(code)}
          className={
            locale === code
              ? "cursor-pointer rounded-md bg-primary px-2 py-1 text-xs font-bold text-primary-foreground"
              : "cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent"
          }
        >
          {code === "ru" ? messages.langRu : messages.langKk}
        </button>
      ))}
    </div>
  );
}

export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const messages = useMessages();
  const choose = (next: ThemeName) => {
    if (next !== theme) setTheme(next);
  };
  return (
    <div className={cn("flex items-center gap-2", className)} role="group" aria-label={messages.themeLabel}>
      <span className="text-xs text-muted-foreground">{messages.themeLabel}</span>
      {(["dark", "light"] as const).map((name) => (
        <button
          key={name}
          type="button"
          aria-pressed={theme === name}
          onClick={() => choose(name)}
          className={
            theme === name
              ? "cursor-pointer rounded-md bg-primary px-2 py-1 text-xs font-bold text-primary-foreground"
              : "cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent"
          }
        >
          {name === "dark" ? messages.themeDark : messages.themeLight}
        </button>
      ))}
    </div>
  );
}

export function ResetDemoButton({ variant = "outline" }: { variant?: "outline" | "destructive" | "ghost" }) {
  const messages = useMessages();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {messages.confirm.resetAction}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={messages.confirm.resetTitle}
        description={messages.confirm.resetBody}
        confirmLabel={messages.confirm.resetAction}
        destructive
        onConfirm={() => {
          try {
            repository.reset();
            toast.success(messages.toast.reset);
          } catch (error) {
            toast.error(describeError(error, messages));
          }
        }}
      />
    </>
  );
}
