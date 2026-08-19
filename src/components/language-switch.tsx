"use client";

import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";

const options: { id: Locale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "zh", label: "中文" },
];

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();

  return (
    <div role="radiogroup" aria-label="Language / 语言" className="flex items-baseline gap-2">
      {options.map((option, index) => (
        <span key={option.id} className="flex items-baseline gap-2">
          {index > 0 ? <span className="text-[var(--faint)]">/</span> : null}
          <button
            type="button"
            role="radio"
            aria-checked={locale === option.id}
            onClick={() => setLocale(option.id)}
            className={`min-h-9 px-0.5 text-[13px] sm:min-h-0 ${
              option.id === "en" ? "tracking-[-0.01em]" : "tracking-normal"
            } ${
              locale === option.id ? "text-[var(--text)]" : "text-[var(--faint)] hover:text-[var(--muted)]"
            }`}
            lang={option.id === "zh" ? "zh-CN" : "en"}
          >
            {option.label}
          </button>
        </span>
      ))}
    </div>
  );
}
