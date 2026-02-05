import { useState, useEffect } from 'react';
import { Cookie, X, ChevronDown, ChevronUp, Shield } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      setPreferences(JSON.parse(consent));
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem('cookie_consent', JSON.stringify(allAccepted));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setPreferences(allAccepted);
    setShowBanner(false);
    
    // Capture consent data
    captureConsentData(allAccepted);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('cookie_consent', JSON.stringify(preferences));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowBanner(false);
    
    captureConsentData(preferences);
  };

  const handleRejectAll = () => {
    const necessaryOnly = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem('cookie_consent', JSON.stringify(necessaryOnly));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setPreferences(necessaryOnly);
    setShowBanner(false);
    
    captureConsentData(necessaryOnly);
  };

  const captureConsentData = (prefs: CookiePreferences) => {
    const consentData = {
      preferences: prefs,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      page: window.location.pathname,
    };
    
    const existingData = JSON.parse(localStorage.getItem('consent_records') || '[]');
    existingData.push(consentData);
    localStorage.setItem('consent_records', JSON.stringify(existingData));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50">
      <div className="glass-card p-6 shadow-2xl">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 bg-biotech-mint/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-biotech-mint" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-heading font-bold text-biotech-white mb-1">
              Cookie Preferences
            </h3>
            <p className="text-sm text-biotech-gray">
              We use cookies to enhance your experience and collect data for compliance purposes. 
              You can customize your preferences below.
            </p>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="p-1 hover:bg-biotech-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-biotech-gray" />
          </button>
        </div>

        {/* Cookie Details */}
        <div className={`overflow-hidden transition-all duration-300 ${showDetails ? 'max-h-96 mb-4' : 'max-h-0'}`}>
          <div className="space-y-3 pt-2 border-t border-biotech-white/10">
            {/* Necessary Cookies */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-biotech-mint" />
                <div>
                  <p className="text-sm text-biotech-white font-medium">Necessary</p>
                  <p className="text-xs text-biotech-gray/70">Required for site functionality</p>
                </div>
              </div>
              <div className="px-2 py-1 bg-biotech-mint/20 rounded text-xs text-biotech-mint">
                Required
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4" />
                <div>
                  <p className="text-sm text-biotech-white font-medium">Analytics</p>
                  <p className="text-xs text-biotech-gray/70">Helps us improve our website</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-biotech-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-biotech-mint"></div>
              </label>
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4" />
                <div>
                  <p className="text-sm text-biotech-white font-medium">Marketing</p>
                  <p className="text-xs text-biotech-gray/70">Used for targeted advertising</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-biotech-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-biotech-mint"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Toggle Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-biotech-mint hover:underline mb-4"
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showDetails ? 'Hide Details' : 'Customize Preferences'}
        </button>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAcceptAll}
            className="flex-1 min-w-[100px] px-4 py-2 bg-biotech-mint text-biotech-black font-semibold text-sm rounded-lg hover:bg-biotech-mint/90 transition-colors"
          >
            Accept All
          </button>
          <button
            onClick={handleAcceptSelected}
            className="flex-1 min-w-[100px] px-4 py-2 bg-biotech-white/10 border border-biotech-white/20 text-biotech-white font-semibold text-sm rounded-lg hover:bg-biotech-white/20 transition-colors"
          >
            Save Preferences
          </button>
          <button
            onClick={handleRejectAll}
            className="px-4 py-2 text-biotech-gray text-sm hover:text-biotech-white transition-colors"
          >
            Reject All
          </button>
        </div>

        <p className="text-xs text-biotech-gray/50 mt-4">
          By using our site, you agree to our{' '}
          <a href="/privacy" className="text-biotech-mint hover:underline">Privacy Policy</a> and{' '}
          <a href="/terms" className="text-biotech-mint hover:underline">Terms of Service</a>.
        </p>
      </div>
    </div>
  );
}

export default CookieConsent;
