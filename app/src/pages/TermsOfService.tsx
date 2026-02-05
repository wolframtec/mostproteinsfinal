import { ArrowLeft, Beaker, AlertTriangle, Scale, FileText, Gavel } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
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
              <Scale className="w-8 h-8 text-biotech-mint" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-biotech-white mb-4">
              Terms of Service
            </h1>
            <p className="text-biotech-gray">
              Last Updated: February 5, 2026
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-red-400 font-semibold mb-2">IMPORTANT - READ CAREFULLY</h2>
                <p className="text-red-300/80 text-sm">
                  THESE TERMS OF SERVICE CONSTITUTE A LEGALLY BINDING AGREEMENT BETWEEN YOU AND 
                  MOST PROTEINS. BY ACCESSING OR USING OUR WEBSITE, YOU AGREE TO BE BOUND BY THESE 
                  TERMS. IF YOU DO NOT AGREE TO THESE TERMS, DO NOT ACCESS OR USE THE WEBSITE.
                </p>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {/* Agreement to Terms */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
                1. Agreement to Terms
              </h2>
              <div className="text-biotech-gray space-y-4">
                <p>
                  By accessing this website, you acknowledge that you have read, understood, and agree to be 
                  bound by these Terms of Service and our Privacy Policy. These Terms apply to all visitors, 
                  users, and others who access or use the Service.
                </p>
                <p>
                  You must be at least 21 years of age to use this website. By using this website, you 
                  represent and warrant that you are at least 21 years old and have the legal capacity to 
                  enter into these Terms.
                </p>
              </div>
            </section>

            {/* Research Use Only */}
            <section className="glass-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <Beaker className="w-6 h-6 text-biotech-mint" />
                <h2 className="text-2xl font-heading font-bold text-biotech-white">
                  2. Research Use Only
                </h2>
              </div>
              
              <div className="text-biotech-gray space-y-4">
                <p className="text-biotech-mint font-semibold">
                  ALL PRODUCTS SOLD ON THIS WEBSITE ARE FOR RESEARCH PURPOSES ONLY.
                </p>
                <p>By purchasing from Most Proteins, you expressly agree that:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All products are intended for laboratory research purposes only</li>
                  <li>Products are NOT for human consumption</li>
                  <li>Products are NOT for diagnostic use</li>
                  <li>Products are NOT for therapeutic use</li>
                  <li>Products are NOT for veterinary or animal use</li>
                  <li>Products are NOT FDA approved for any use in humans or animals</li>
                </ul>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
                  <p className="text-yellow-400/90 text-sm">
                    <strong>Warning:</strong> The safety and efficacy of these products in humans or animals 
                    have not been established. Use in humans or animals is strictly prohibited and may violate 
                    federal, state, or local laws.
                  </p>
                </div>
              </div>
            </section>

            {/* Purchaser Requirements */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
                3. Purchaser Requirements and Qualifications
              </h2>
              
              <div className="text-biotech-gray space-y-4">
                <p>To purchase products from Most Proteins, you must:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Be at least 21 years of age</li>
                  <li>Be a qualified researcher, scientist, or laboratory professional</li>
                  <li>Have appropriate facilities and equipment for handling research chemicals</li>
                  <li>Have proper training in laboratory safety procedures</li>
                  <li>Intend to use products solely for lawful research purposes</li>
                  <li>Comply with all applicable local, state, and federal laws</li>
                </ul>
                <p className="mt-4">
                  We reserve the right to refuse service to anyone who does not meet these requirements or 
                  who we reasonably believe may use our products for unauthorized purposes.
                </p>
              </div>
            </section>

            {/* Product Information */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
                4. Product Information and Disclaimer
              </h2>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  All product descriptions, specifications, and other information on this website are provided 
                  for informational purposes only. We make no representations or warranties about the accuracy, 
                  completeness, or reliability of any product information.
                </p>
                <p className="font-semibold text-biotech-white">You acknowledge and agree that:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Products are sold "as is" without any warranties, express or implied</li>
                  <li>We make no claims regarding the safety or efficacy of any product</li>
                  <li>Product purity specifications are based on analytical testing but are not guaranteed</li>
                  <li>You are solely responsible for determining the suitability of products for your research</li>
                  <li>You assume all risks associated with the handling, storage, and use of products</li>
                </ul>
              </div>
            </section>

            {/* Ordering and Payment */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
                5. Ordering and Payment
              </h2>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  All orders are subject to acceptance and availability. We reserve the right to refuse or 
                  cancel any order for any reason, including but not limited to product availability, errors 
                  in product or pricing information, or suspicion of unauthorized use.
                </p>
                <p>
                  Payment must be made at the time of order. We accept major credit cards through our 
                  secure payment processor (Stripe). All payments are processed securely, and we do not 
                  store your complete credit card information.
                </p>
                <p>
                  Prices are subject to change without notice. All prices are in US dollars unless otherwise 
                  specified. You are responsible for any applicable taxes and shipping costs.
                </p>
              </div>
            </section>

            {/* Shipping */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
                6. Shipping and Delivery
              </h2>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  We ship products to the address you provide during checkout. You are responsible for 
                  ensuring that the shipping address is accurate and complete. We are not responsible 
                  for delays or failed deliveries due to incorrect addresses.
                </p>
                <p>
                  Risk of loss and title for items purchased pass to you upon delivery to the carrier. 
                  You are responsible for filing any claims with carriers for damaged and/or lost shipments.
                </p>
                <p>
                  Temperature-sensitive products are shipped with appropriate packaging. However, we are 
                  not responsible for product degradation due to delays in transit or improper handling 
                  by carriers.
                </p>
              </div>
            </section>

            {/* Returns and Refunds */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
                7. Returns and Refunds
              </h2>
              
              <div className="text-biotech-gray space-y-4">
                <p className="font-semibold text-biotech-mint">
                  Due to the nature of research chemicals, all sales are final.
                </p>
                <p>
                  We do not accept returns or provide refunds for opened or used products. If you receive 
                  a damaged or incorrect product, you must notify us within 48 hours of delivery with 
                  photographic evidence. We will review your claim and may, at our sole discretion, offer 
                  a replacement or store credit.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="glass-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <Gavel className="w-6 h-6 text-biotech-mint" />
                <h2 className="text-2xl font-heading font-bold text-biotech-white">
                  8. Limitation of Liability
                </h2>
              </div>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL MOST PROTEINS, 
                  ITS AFFILIATES, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                  SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF 
                  PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>
                <p>
                  Our total liability to you for all claims arising from or relating to these Terms or 
                  your use of the website shall not exceed the amount you paid to us in the twelve (12) 
                  months preceding the claim.
                </p>
                <p>
                  You expressly agree that your use of, or inability to use, the products is at your 
                  sole risk. You assume all liability for proper handling, storage, and use of products.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
                9. Indemnification
              </h2>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  You agree to defend, indemnify, and hold harmless Most Proteins and its affiliates, 
                  officers, directors, employees, and agents from and against any and all claims, 
                  liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' 
                  fees) arising from or relating to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your use of the website or products</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any applicable law or regulation</li>
                  <li>Your misuse of products in violation of the research use only requirement</li>
                  <li>Any claims by third parties arising from your use of products</li>
                </ul>
              </div>
            </section>

            {/* Governing Law */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
                10. Governing Law and Jurisdiction
              </h2>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the 
                  State of California, without regard to its conflict of law provisions. Any legal 
                  suit, action, or proceeding arising out of or related to these Terms shall be 
                  instituted exclusively in the federal or state courts located in San Francisco County, 
                  California.
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section className="glass-card p-8">
              <h2 className="text-2xl font-heading font-bold text-biotech-white mb-4">
                11. Changes to Terms
              </h2>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at 
                  any time. If a revision is material, we will provide at least 30 days' notice prior 
                  to any new terms taking effect. What constitutes a material change will be determined 
                  at our sole discretion.
                </p>
                <p>
                  By continuing to access or use our Service after any revisions become effective, 
                  you agree to be bound by the revised terms.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="glass-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-biotech-mint" />
                <h2 className="text-2xl font-heading font-bold text-biotech-white">
                  12. Contact Information
                </h2>
              </div>
              
              <div className="text-biotech-gray space-y-4">
                <p>
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="bg-biotech-dark rounded-lg p-4">
                  <p className="text-biotech-white font-semibold">Most Proteins</p>
                  <p className="text-biotech-gray">San Francisco, CA</p>
                  <a href="mailto:legal@mostproteins.com" className="text-biotech-mint hover:underline">
                    legal@mostproteins.com
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
            <p className="text-xs text-yellow-500/80 mt-2">
              For Research Use Only • Not FDA Approved • 21+ Required
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
