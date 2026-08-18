import { AppShell } from "@/components/app-shell";
import { LocaleProvider } from "@/components/locale-provider";
import { loadSnapshot } from "@/lib/load-snapshot";

export default function HomePage() {
  const snapshot = loadSnapshot();

  return (
    <LocaleProvider>
      <AppShell snapshot={snapshot} />
    </LocaleProvider>
  );
}
