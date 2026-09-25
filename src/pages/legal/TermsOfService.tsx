import { Layout } from "@/components/layout/Layout";
import { DynamicSeo } from "@/components/seo/DynamicSeo";

const TermsOfService = () => {
  return (
    <Layout>
      <DynamicSeo 
        title="Terms of Service | Joka Beatz"
        description="Read the terms and conditions for using Joka Beatz services and purchasing beats."
      />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Joka Beatz website and services, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services. We reserve the right to modify these 
              terms at any time, and your continued use of the site constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Use of Service</h2>
            <p className="text-muted-foreground mb-4">You agree to use our services only for lawful purposes. You may not:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Use our services to violate any laws or regulations</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfere with the proper functioning of our website</li>
              <li>Upload malicious code or content</li>
              <li>Resell or redistribute purchased products without proper licensing</li>
              <li>Misrepresent your identity or affiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              When you create an account, you are responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and up-to-date information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Purchases and Payments</h2>
            <p className="text-muted-foreground mb-4">
              All purchases are processed securely through Stripe. By making a purchase, you agree that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>You are authorized to use the payment method provided</li>
              <li>All payment information is accurate and complete</li>
              <li>Prices are subject to change without notice</li>
              <li>Digital products are delivered electronically after payment confirmation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Refund Policy</h2>
            <p className="text-muted-foreground">
              Due to the digital nature of our products, all sales are final once the product has been downloaded or 
              accessed. If you experience technical issues with a download, please contact us within 7 days of purchase 
              for assistance. We may offer refunds at our discretion in cases of duplicate purchases or technical failures 
              on our end.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              All content on this website, including but not limited to beats, music, graphics, logos, and text, 
              is the intellectual property of Joka Beatz unless otherwise stated. Purchasing a beat grants you 
              specific usage rights as outlined in your{" "}
              <a href="/licensing-terms" className="text-primary hover:underline">license agreement</a>, but does 
              not transfer ownership of the underlying composition.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Joka Beatz provides services "as is" without warranties of any kind. We are not liable for any 
              indirect, incidental, special, or consequential damages arising from your use of our services. 
              Our total liability shall not exceed the amount you paid for the specific product or service in question.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless Joka Beatz from any claims, damages, or expenses arising 
              from your violation of these terms, your use of our services, or your infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms shall be governed by and construed in accordance with applicable laws, without regard to 
              conflict of law principles. Any disputes arising from these terms shall be resolved through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please visit our{" "}
              <a href="/contact" className="text-primary hover:underline">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default TermsOfService;
