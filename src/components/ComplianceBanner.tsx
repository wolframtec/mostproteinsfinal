import { useState, useEffect } from 'react';
import { AlertTriangle, X, FileText, ExternalLink } from 'lucide-react';

export function ComplianceBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('compliance_banner_dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('compliance_banner_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Fixed Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-yellow-500/10 border-t border-yellow-500/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-400/90">
              <strong className="text-yellow-400">For Research Use Only.</strong>{' '}
              Not for human consumption. Products not FDA approved.{' '}
              <button 
                onClick={() => setShowDetails(true)}
                className="underline hover:text-yellow-300 transition-colors"
              >
                Read full disclaimer
              </button>
            </p>
          </div>
          <button 
            onClick={handleDismiss}
            className="p-1 hover:bg-yellow-500/20 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4 text-yellow-500" />
          </button>
        </div>
      </div>

      {/* Full Disclaimer Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-biotech-dark/95 backdrop-blur-xl border-b border-biotech-white/10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-biotech-mint" />
                <h2 className="text-xl font-heading font-bold text-biotech-white">
                  Research Use Disclaimer
                </h2>
              </div>
              <button 
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-biotech-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-biotech-gray" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Important Notice
                </h3>
                <p className="text-red-300/80 text-sm">
                  All products sold on this website are intended for research purposes only. 
                  They are NOT intended for human consumption, diagnostic, or therapeutic use.
                </p>
              </div>

              <div className="space-y-4 text-biotech-gray text-sm">
                <section>
                  <h4 className="text-biotech-white font-semibold mb-2">Product Status</h4>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>All compounds are sold as research chemicals only</li>
                    <li>Products are not FDA approved for human use</li>
                    <li>No medical or health benefit claims are made</li>
                    <li>Compounds have not been evaluated for safety in humans</li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-biotech-white font-semibold mb-2">Purchaser Requirements</h4>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Must be 21 years of age or older</li>
                    <li>Must be a qualified researcher or laboratory professional</li>
                    <li>Must use products in accordance with all applicable laws</li>
                    <li>Must have appropriate facilities and training</li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-biotech-white font-semibold mb-2">Legal Compliance</h4>
                  <p>
                    By purchasing from Most Proteins, you affirm that you understand and agree to the following:
                  </p>
                  <ul className="space-y-2 list-disc list-inside mt-2">
                    <li>You are solely responsible for compliance with local, state, and federal laws</li>
                    <li>You will not use these products for human or animal consumption</li>
                    <li>You assume all liability for proper handling and storage</li>
                    <li>You understand the potential risks associated with research chemicals</li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-biotech-white font-semibold mb-2">Quality & Testing</h4>
                  <p>
                    All products are tested for purity using HPLC analysis. Certificates of Analysis (COA) 
                    are available upon request. Products are stored and shipped under appropriate conditions 
                    to maintain integrity.
                  </p>
                </section>

                <section>
                  <h4 className="text-biotech-white font-semibold mb-2">Contact Information</h4>
                  <p>
                    For questions about our products or compliance requirements, please contact us at{' '}
                    <a href="mailto:research@mostproteins.com" className="text-biotech-mint hover:underline">
                      research@mostproteins.com
                    </a>
                  </p>
                </section>
              </div>

              <div className="border-t border-biotech-white/10 pt-4 flex gap-4">
                <a 
                  href="/terms" 
                  target="_blank"
                  className="flex items-center gap-2 text-sm text-biotech-mint hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Terms of Service
                </a>
                <a 
                  href="/privacy" 
                  target="_blank"
                  className="flex items-center gap-2 text-sm text-biotech-mint hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ComplianceBanner;
