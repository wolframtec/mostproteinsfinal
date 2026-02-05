'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export function AgeVerification() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has already verified age
    const verified = localStorage.getItem('age_verified');
    if (verified === 'true') {
      setIsVerified(true);
    } else if (verified === 'false') {
      setIsVerified(false);
    } else {
      setShowModal(true);
    }
  }, []);

  const handleVerify = (ofAge: boolean) => {
    if (ofAge) {
      localStorage.setItem('age_verified', 'true');
      localStorage.setItem('age_verified_date', new Date().toISOString());
      setIsVerified(true);
      setShowModal(false);
    } else {
      localStorage.setItem('age_verified', 'false');
      setIsVerified(false);
    }
  };

  // Capture user data on verification
  const captureVerificationData = (ofAge: boolean) => {
    const verificationData = {
      ofAge,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer || 'direct',
      page: window.location.pathname,
    };
    
    // Store in localStorage (in production, send to secure API)
    const existingData = JSON.parse(localStorage.getItem('verification_attempts') || '[]');
    existingData.push(verificationData);
    localStorage.setItem('verification_attempts', JSON.stringify(existingData));
    
    handleVerify(ofAge);
  };

  if (!showModal) return null;

  if (isVerified === false) {
    return (
      <div className="fixed inset-0 z-[200] bg-biotech-black flex items-center justify-center p-6">
        <div className="glass-card p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
            Access Denied
          </h2>
          <p className="text-biotech-gray mb-6">
            You must be 21 years of age or older to access this website. 
            Our products are sold strictly for research purposes to qualified researchers.
          </p>
          <p className="text-sm text-biotech-gray/60">
            If you believe this is an error, please contact us at research@mostproteins.com
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-biotech-black/95 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="glass-card p-8 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-8 h-8 text-yellow-500" />
          <h2 className="text-2xl font-heading font-bold text-biotech-white">
            Age Verification Required
          </h2>
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-biotech-gray">
            This website contains information about research chemicals intended for laboratory use only.
          </p>
          
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-sm text-yellow-400/90">
              <strong className="block mb-1">Important Notice:</strong>
              All products sold on this website are for research purposes only. 
              They are not intended for human consumption, diagnostic, or therapeutic use.
            </p>
          </div>

          <ul className="text-sm text-biotech-gray space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-biotech-mint flex-shrink-0 mt-0.5" />
              <span>I understand these products are for research use only</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-biotech-mint flex-shrink-0 mt-0.5" />
              <span>I am a qualified researcher or laboratory professional</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-biotech-mint flex-shrink-0 mt-0.5" />
              <span>I will use these products in accordance with all applicable laws</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-center text-biotech-white font-semibold mb-4">
            Are you 21 years of age or older?
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => captureVerificationData(true)}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Yes, I am 21+
            </button>
            <button
              onClick={() => captureVerificationData(false)}
              className="flex-1 px-6 py-3 bg-biotech-white/10 border border-biotech-white/20 text-biotech-white font-semibold rounded-xl hover:bg-biotech-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              No
            </button>
          </div>
        </div>

        <p className="text-xs text-biotech-gray/50 text-center mt-6">
          By clicking "Yes, I am 21+", you agree to our Terms of Service and Privacy Policy. 
          We collect verification data to ensure compliance with regulations.
        </p>
      </div>
    </div>
  );
}

export default AgeVerification;
