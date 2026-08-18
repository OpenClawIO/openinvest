"use client";

import { copy, detectLocale, persistLocale, type Copy, type Locale } from "@/lib/i18n";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type LocaleContextValue = {
  locale: Locale;
  t: Copy;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const next = detectLocale();
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: copy[locale],
      setLocale: (next) => {
        setLocaleState(next);
        persistLocale(next);
      },
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
