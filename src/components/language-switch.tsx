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
    <div
      role="radiogroup"
      aria-label="Language / 语言"
      className="relative isolate grid grid-cols-2 rounded-full border border-white/25 p-0.5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-[rgba(255,255,255,0.16)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: locale === "zh" ? "translateX(100%)" : "translateX(0)" }}
      />
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={locale === option.id}
          onClick={() => setLocale(option.id)}
          className={`relative z-10 min-h-9 min-w-[3.4rem] px-2.5 py-1.5 text-[11px] transition-colors sm:min-h-0 sm:min-w-[4.75rem] sm:px-3 sm:text-xs ${
            option.id === "en" ? "tracking-[-0.01em]" : "tracking-normal"
          } ${
            locale === option.id ? "text-white" : "text-white/55 hover:text-white/80"
          }`}
          lang={option.id === "zh" ? "zh-CN" : "en"}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
