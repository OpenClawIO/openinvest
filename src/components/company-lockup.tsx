import { YanceMark } from "@/components/yance-mark";
import type { Copy } from "@/lib/i18n";

export function CompanyLockup({
  t,
  showTagline = false,
}: {
  t: Copy;
  showTagline?: boolean;
}) {
  return (
    <div className="company-lockup" aria-label={t.companyLegalZh}>
      <YanceMark className="company-mark" />
      <div className="company-copy">
        <p className="company-zh">
          <span className="company-prefix">{t.companyPrefix}</span>
          <span className="company-core">{t.companyCore}</span>
          <span className="company-suffix">{t.companySuffix}</span>
        </p>
        <p className="company-en">{t.companyLegal}</p>
        {showTagline ? <p className="company-tagline">{t.tagline}</p> : null}
      </div>
    </div>
  );
}
