import Link from 'next/link';
import { Shield, FileText, Mail, MapPin, Phone, CheckCircle, AlertTriangle, Beaker } from 'lucide-react';
import { Layout } from '@/components/Layout';

export default function AboutPage() {
  return (
    <Layout>

      <main className="pt-24 pb-12">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-biotech-white mb-6">
            About Most Proteins
          </h1>
          <p className="text-xl text-biotech-gray max-w-2xl mx-auto">
            Advancing scientific research through high-purity research compounds 
            and unwavering commitment to quality and compliance.
          </p>
        </section>

        {/* Mission */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="glass-card p-8">
            <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">Our Mission</h2>
            <p className="text-biotech-gray mb-4">
              Most Proteins was founded with a singular goal: to provide researchers with access to 
              high-quality research compounds that meet the strictest standards of purity and consistency. 
              We understand that the integrity of scientific research depends on the quality of materials used.
            </p>
            <p className="text-biotech-gray">
              Every compound we sell undergoes rigorous testing and documentation. We maintain complete 
              traceability from synthesis to shipment, ensuring that researchers can trust the materials 
              they receive from us.
            </p>
          </div>
        </section>

        {/* Compliance Commitment */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-heading font-bold text-biotech-white mb-6">Our Commitment to Compliance</h2>
          
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-yellow-400 font-semibold mb-2">Research Use Only</h3>
                <p className="text-yellow-300/80 text-sm">
                  All products sold by Most Proteins are intended for laboratory research purposes only. 
                  They are not for human consumption, diagnostic, or therapeutic use. We strictly enforce 
                  age verification and require all customers to affirm their status as qualified researchers.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <div className="w-12 h-12 bg-biotech-mint/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-biotech-mint" />
              </div>
              <h3 className="text-lg font-semibold text-biotech-white mb-2">Quality Testing</h3>
              <p className="text-sm text-biotech-gray">
                All compounds are tested using HPLC analysis with a minimum purity of 98%. 
                Certificates of Analysis are provided with every order.
              </p>
            </div>
            <div className="glass-card p-6">
              <div className="w-12 h-12 bg-biotech-mint/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-biotech-mint" />
              </div>
              <h3 className="text-lg font-semibold text-biotech-white mb-2">Secure Handling</h3>
              <p className="text-sm text-biotech-gray">
                Products are stored under optimal conditions and shipped with temperature control 
                to maintain integrity throughout transit.
              </p>
            </div>
            <div className="glass-card p-6">
              <div className="w-12 h-12 bg-biotech-mint/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-biotech-mint" />
              </div>
              <h3 className="text-lg font-semibold text-biotech-white mb-2">Documentation</h3>
              <p className="text-sm text-biotech-gray">
                Complete batch tracking, SDS sheets, and handling guides provided. 
                Full regulatory compliance documentation available.
              </p>
            </div>
            <div className="glass-card p-6">
              <div className="w-12 h-12 bg-biotech-mint/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-biotech-mint" />
              </div>
              <h3 className="text-lg font-semibold text-biotech-white mb-2">Age Verification</h3>
              <p className="text-sm text-biotech-gray">
                All customers must verify they are 21+ and qualified researchers. 
                We maintain records for regulatory compliance.
              </p>
            </div>
          </div>
        </section>

        {/* Legal Disclaimers */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-heading font-bold text-biotech-white mb-6">Legal Disclaimers</h2>
          
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-biotech-white mb-3">Product Status</h3>
              <ul className="text-sm text-biotech-gray space-y-2 list-disc list-inside">
                <li>All compounds are sold as research chemicals only</li>
                <li>Products are not FDA approved for human use</li>
                <li>No medical or health benefit claims are made</li>
                <li>Compounds have not been evaluated for safety in humans</li>
                <li>We make no representations about efficacy or safety</li>
              </ul>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-biotech-white mb-3">Purchaser Requirements</h3>
              <ul className="text-sm text-biotech-gray space-y-2 list-disc list-inside">
                <li>Must be 21 years of age or older</li>
                <li>Must be a qualified researcher or laboratory professional</li>
                <li>Must use products in accordance with all applicable laws</li>
                <li>Must have appropriate facilities and training</li>
                <li>Must assume all liability for proper handling and use</li>
              </ul>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-biotech-white mb-3">Prohibited Uses</h3>
              <ul className="text-sm text-biotech-gray space-y-2 list-disc list-inside">
                <li>Not for human consumption of any kind</li>
                <li>Not for veterinary or animal use</li>
                <li>Not for diagnostic purposes</li>
                <li>Not for therapeutic or medical treatment</li>
                <li>Not for cosmetic applications</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Privacy Policy Summary */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-heading font-bold text-biotech-white mb-6">Privacy & Data Handling</h2>
          <div className="glass-card p-6">
            <p className="text-biotech-gray mb-4">
              We take your privacy seriously. We collect only the information necessary to process your orders 
              and maintain regulatory compliance. This includes:
            </p>
            <ul className="text-sm text-biotech-gray space-y-2 list-disc list-inside mb-4">
              <li>Contact information for order fulfillment</li>
              <li>Age verification records (required by law)</li>
              <li>Order history for compliance tracking</li>
              <li>Cookie preferences for website functionality</li>
            </ul>
            <p className="text-biotech-gray text-sm">
              We never sell your data to third parties. All data is stored securely and encrypted. 
              You may request deletion of your data at any time by contacting us.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-heading font-bold text-biotech-white mb-6">Contact Us</h2>
          <div className="glass-card p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-biotech-mint flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-biotech-gray mb-1">Email</p>
                  <a href="mailto:service@mostproteins.com" className="text-biotech-white hover:text-biotech-mint transition-colors">
                    service@mostproteins.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-biotech-mint flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-biotech-gray mb-1">Phone</p>
                  <p className="text-biotech-white">1-800-RESEARCH</p>
                  <p className="text-xs text-biotech-gray/60">Mon-Fri 9am-5pm PST</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-biotech-mint flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-biotech-gray mb-1">Location</p>
                  <p className="text-biotech-white">Newport Beach, CA</p>
                  <p className="text-xs text-biotech-gray/60">Shipping worldwide</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-biotech-white/10 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <p className="text-xs text-biotech-gray/60 mb-2">
              © 2026 Most Proteins. All rights reserved.
            </p>
            <p className="text-xs text-yellow-500/80">
              For Research Use Only • Not FDA Approved • 21+ Required
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
