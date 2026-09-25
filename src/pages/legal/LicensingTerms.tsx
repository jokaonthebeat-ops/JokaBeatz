import { Layout } from "@/components/layout/Layout";
import { DynamicSeo } from "@/components/seo/DynamicSeo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

const LicensingTerms = () => {
  return (
    <Layout>
      <DynamicSeo 
        title="Licensing Terms | Joka Beatz"
        description="Understand beat licensing types, usage rights, and distribution limits for Joka Beatz instrumentals."
      />
      
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Beat Licensing Terms</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        {/* License Comparison */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">Free / Basic MP3</CardTitle>
              <p className="text-muted-foreground text-sm">Included with free beats</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Release on Spotify, Apple Music & more</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Up to 10,000 streams</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Up to 500 sales/downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Upload to YouTube & earn via YouTube Partner Program</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-muted-foreground">MP3 only (no WAV/stems)</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-muted-foreground">Not exclusive</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">Lease License</CardTitle>
              <p className="text-muted-foreground text-sm">Non-exclusive rights</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Use in 1 commercial project</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Up to 100,000 streams</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Up to 2,500 sales/downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Radio broadcasting (2 stations)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Music video (non-monetized)</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-muted-foreground">Not exclusive — may be sold to others</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">Exclusive License</CardTitle>
              <p className="text-muted-foreground text-sm">Full exclusive rights</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Unlimited commercial use</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Unlimited streams</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Unlimited sales/downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Unlimited radio broadcasting</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Music videos (monetized)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Beat removed from sale after purchase</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. License Types Explained</h2>
            <p className="text-muted-foreground mb-4">
              <strong>Free / Basic MP3 License:</strong> Included with every free beat download. Allows commercial use including streaming on Spotify, Apple Music, and selling on digital stores — up to 10,000 streams and 500 sales. Credit required.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>Lease License:</strong> A non-exclusive license that allows you to use the beat for your project 
              while the producer retains ownership and may sell the same beat to other artists. Higher usage caps, WAV quality, and more.
            </p>
            <p className="text-muted-foreground">
              <strong>Exclusive License:</strong> Grants you full exclusive rights to the beat. Once purchased, the beat 
              is removed from sale and cannot be licensed to anyone else. You own all rights to create derivative works.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Usage Rights</h2>
            <p className="text-muted-foreground mb-4">All license types (including free) allow you to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Record vocals over the beat</li>
              <li>Release the final song on all streaming platforms (Spotify, Apple Music, etc.)</li>
              <li>Sell the final song on digital stores (iTunes, Bandcamp, etc.) within your license limits</li>
              <li>Perform the song live at concerts and events</li>
              <li>Monetize on YouTube (within license limits)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Credit Requirements</h2>
            <p className="text-muted-foreground">
              All releases using Joka Beatz instrumentals must include producer credit. The required format is:
            </p>
            <p className="text-foreground font-mono bg-secondary/50 p-4 rounded-lg mt-4">
              "Prod. by Joka Beatz" or "(Produced by Joka Beatz)"
            </p>
            <p className="text-muted-foreground mt-4">
              This credit should appear in the song title, description, or credits section of your release.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Prohibited Uses</h2>
            <p className="text-muted-foreground mb-4">You may NOT:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Resell, lease, or transfer the beat itself to third parties</li>
              <li>Claim ownership of the underlying instrumental composition</li>
              <li>Use the beat in hate speech, illegal content, or defamatory material</li>
              <li>Register the beat (without vocals) with a PRO or Content ID system</li>
              <li>Exceed the stream/sales limits of your license type without upgrading</li>
              <li>Remove or alter the producer tag in tagged preview files</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Free Beats — Basic MP3 License</h2>
            <p className="text-muted-foreground mb-4">
              Free beats downloaded from our site include a <strong>Basic MP3 License</strong> that allows commercial use. You can:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li>Release commercially on Spotify, Apple Music, Amazon Music, and all major platforms</li>
              <li>Upload to YouTube and earn via YouTube Partner Program (do NOT register the beat with Content ID)</li>
              <li>Sell on iTunes, Bandcamp, and digital stores (up to 500 sales)</li>
              <li>Perform live at shows and events</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              <strong>Limits:</strong> Up to 10,000 total streams and 500 sales/downloads. Once you exceed these limits, 
              you must upgrade to a paid license to continue distribution.
            </p>
            <p className="text-muted-foreground mt-4">
              Need more? <a href="/beats" className="text-primary hover:underline">Browse paid licenses</a> for higher caps, WAV quality, and stems.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. License Duration</h2>
            <p className="text-muted-foreground">
              <strong>Lease licenses</strong> are perpetual within the usage limits. Once you exceed the limits, 
              you must purchase an upgrade or stop distribution.
            </p>
            <p className="text-muted-foreground mt-4">
              <strong>Exclusive licenses</strong> are perpetual with no usage limits. You own the rights indefinitely.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. License Upgrades</h2>
            <p className="text-muted-foreground">
              If you've purchased a lease license and want to upgrade to exclusive (if still available), contact us 
              for upgrade pricing. We'll credit your original lease purchase toward the exclusive price.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Disputes and Violations</h2>
            <p className="text-muted-foreground">
              License violations may result in takedown requests, legal action, and termination of your license rights. 
              If you believe your content was mistakenly flagged, contact us with proof of purchase to resolve the issue.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Questions?</h2>
            <p className="text-muted-foreground">
              For licensing questions or custom arrangements, please reach out through our{" "}
              <a href="/contact" className="text-primary hover:underline">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default LicensingTerms;
