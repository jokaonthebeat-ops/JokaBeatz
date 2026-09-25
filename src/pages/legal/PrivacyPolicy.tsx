import { Layout } from "@/components/layout/Layout";
import { DynamicSeo } from "@/components/seo/DynamicSeo";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

const PrivacyPolicy = () => {
  const { resetConsent, preferences } = useCookieConsent();

  return (
    <Layout>
      <DynamicSeo 
        title="Privacy Policy | Joka Beatz"
        description="Learn how Joka Beatz collects, uses, and protects your personal information."
      />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Name and email address when you sign up for our newsletter or request free beats</li>
              <li>Account information when you create an account (email, password, profile details)</li>
              <li>Payment information when you make a purchase (processed securely by Stripe)</li>
              <li>Contact form submissions and communications with us</li>
              <li>Genre preferences and music interests you share with us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Process your purchases and deliver digital products</li>
              <li>Send you free beats and promotional content you've requested</li>
              <li>Communicate with you about orders, updates, and customer service</li>
              <li>Send newsletters and marketing communications (with your consent)</li>
              <li>Improve our services and develop new features</li>
              <li>Protect against fraud and unauthorized transactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Cookies and Tracking</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Necessary cookies:</strong> Keep you logged in to your account and remember your preferences</li>
              <li><strong>Analytics cookies:</strong> Analyze site traffic and usage patterns to improve our service</li>
              <li><strong>Marketing cookies:</strong> Personalize content and ads based on your interests</li>
            </ul>
            
            <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Cookie className="h-4 w-4 text-primary" />
                Your Current Cookie Preferences
              </h3>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                  Necessary: Always On
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${preferences.analytics ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                  Analytics: {preferences.analytics ? 'On' : 'Off'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${preferences.marketing ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                  Marketing: {preferences.marketing ? 'On' : 'Off'}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={resetConsent} className="gap-2">
                <Cookie className="h-4 w-4" />
                Manage Cookie Settings
              </Button>
            </div>
            
            <p className="text-muted-foreground mt-4">
              You can also control cookies through your browser settings, though some features may not function properly without them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">
              We work with trusted third-party services to operate our business:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Stripe:</strong> Secure payment processing. Your payment details are handled directly by Stripe and never stored on our servers.</li>
              <li><strong>Email Service:</strong> To send transactional emails and newsletters</li>
              <li><strong>Analytics:</strong> To understand how visitors use our site</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              These services have their own privacy policies governing their use of your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your personal information for as long as your account is active or as needed to provide you services. 
              We also retain information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements. 
              You can request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications at any time</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the 
              Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or our data practices, please contact us through our{" "}
              <a href="/contact" className="text-primary hover:underline">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
