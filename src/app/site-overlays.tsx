'use client';

import { AgeVerification } from '@/components/AgeVerification';
import { ComplianceBanner } from '@/components/ComplianceBanner';
import { CookieConsent } from '@/components/CookieConsent';

export function SiteOverlays() {
  return (
    <>
      <AgeVerification />
      <ComplianceBanner />
      <CookieConsent />
    </>
  );
}

export default SiteOverlays;
