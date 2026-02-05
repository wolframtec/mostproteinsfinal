import { ArrowLeft, Beaker, Shield, Lock, Eye, Trash2, Mail } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-biotech-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-biotech-black/90 backdrop-blur-xl border-b border-biotech-white/10">
        <button onClick={onBack} className="flex items-center gap-2 text-biotech-gray hover:text-biotech-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Beaker className="w-5 h-5 text-biotech-mint" />
          <span className="font-heading font-bold text-biotech-white">Most Proteins</span>
        </div>
      </nav>

      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-biotech-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-biotech-mint" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-biotech-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-biotech-gray">
              Last Updated: February 5, 2026
            </p>
          </div>

          {/* Introduction */}
          <div className="glass-card p-8 mb-8">
            <p className="text-biotech-gray leading-relaxed">
              At Most Proteins, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you visit our website or make a purchase. 
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy 
              policy, please do not access the site.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {/* Information We Collect */}
            <section className="glass-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-biotech-mint" />
                <h2 className="text-2xl font-heading font-bold text-biotech-white">
                  Information We Collect
                </h2>
              </div>
              
              <div className="space-y-4 text-biotech-gray">
                <p>We may collect information about you in a variety of ways. The information we may collect includes:</p>
                
                <h3 className="text-lg font-semibold text-biotech-white mt-6 mb-2">Personal Data</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Name, email address, phone number, and mailing address</li>
                  <li>Institution or organization affiliation</li>
                  <li>Payment information (processed securely via Stripe - we do not store card details)</li>
                  <li>Age verification data (required for regulatory compliance)</li>
                </ul>

                <h3 className="text-lg font-semibold text-biotech-white mt-6 mb-2">Derivative Data</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>IP address, browser type, operating system</li>
                  <li>Access times and pages viewed</li>
                  <li>Referring website addresses</li>
                  <li>Device information and location data</li>
                </ul>

                <h3 className="text-lg font-semibold text-biotech-white mt-6 mb-2">Compliance Data</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Age verification confirmations and timestamps</li>
                  <li>Terms of service acceptance records</li>
                  <li>Research purpose affirmations</li>
                  <li>Order and purchase history</li>
                </ul>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="glass-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-biotech-mint" />
                <h2 className="text-2xl font-heading font-bold text-biotech-white">
                  How We Use Your Information
                </h2>
              </div>
              
              <div className="text-biotech-gray space-y-4">
                <p>Having accurate information about you permits us to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Process and fulfill your orders</li>
                  <li>Verify your age and research qualifications</li>
                  <li>Maintain regulatory compliance records</li>
                  <li>Send order confirmations and shipping updates</li>
                  <li>Respond to customer service requests</li>
                  <li>Improve our website and product offerings</li>
                  <li>Send promotional communications (with your consent)</li>
                  <li>Prevent fraud and protect against illegal activity</li>
                </ul>
              </div>
            </section>

            {/* Data Security */}
            <section className="glass-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-biotech-mint" />
                <h2 className="text-2xl font-heading font-bold text-biotech-white">
                  Data Security
                </h2>
              </div>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  We use administrative, technical, and physical security measures to help protect your personal 
                  information. While we have taken reasonable steps to secure the personal information you provide 
                  to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, 
                  and no method of data transmission can be guaranteed against any interception or other type of misuse.
                </p>
                <div className="bg-biotech-mint/10 rounded-lg p-4 mt-4">
                  <p className="text-sm text-biotech-mint">
                    <strong>Security Measures:</strong> SSL/TLS encryption, PCI-DSS compliant payment processing, 
                    secure server infrastructure, regular security audits, and access controls.
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section className="glass-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="w-6 h-6 text-biotech-mint" />
                <h2 className="text-2xl font-heading font-bold text-biotech-white">
                  Your Data Rights
                </h2>
              </div>
              
              <div className="text-biotech-gray space-y-4">
                <p>Depending on your location, you may have the following rights regarding your personal data:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                  <li><strong>Restriction:</strong> Request restriction of processing</li>
                  <li><strong>Portability:</strong> Request transfer of your data</li>
                  <li><strong>Objection:</strong> Object to processing of your data</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, please contact us at{' '}
                  <a href="mailto:privacy@mostproteins.com" className="text-biotech-mint hover:underline">
                    privacy@mostproteins.com
                  </a>
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
                Cookies and Tracking Technologies
              </h2>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Site 
                  to help customize the Site and improve your experience. When you access the Site, your personal 
                  information is not collected through the use of tracking technology.
                </p>
                <p>
                  Most browsers are set to accept cookies by default. You can remove or reject cookies, but be 
                  aware that such action could affect the availability and functionality of the Site.
                </p>
              </div>
            </section>

            {/* Third Party */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
                Third-Party Websites
              </h2>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  The Site may contain links to third-party websites and applications of interest, including 
                  advertisements and external services, that are not affiliated with us. Once you have used 
                  these links to leave the Site, any information you provide to these third parties is not 
                  covered by this Privacy Policy.
                </p>
              </div>
            </section>

            {/* Policy Changes */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
                Policy Changes
              </h2>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  We reserve the right to make changes to this Privacy Policy at any time and for any reason. 
                  We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy. 
                  You are encouraged to periodically review this Privacy Policy to stay informed of updates.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="glass-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-biotech-mint" />
                <h2 className="text-2xl font-heading font-bold text-biotech-white">
                  Contact Us
                </h2>
              </div>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  If you have questions or comments about this Privacy Policy, please contact us at:
                </p>
                <div className="bg-biotech-dark rounded-lg p-4">
                  <p className="text-biotech-white font-semibold">Most Proteins</p>
                  <p className="text-biotech-gray">San Francisco, CA</p>
                  <a href="mailto:privacy@mostproteins.com" className="text-biotech-mint hover:underline">
                    privacy@mostproteins.com
                  </a>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-sm text-biotech-gray/60">
              © 2026 Most Proteins. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
