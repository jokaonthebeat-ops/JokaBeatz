import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Music, Download, Users, Share2, FileText, Check, X, DollarSign } from "lucide-react";
import BeatPackMockup from "@/components/free-beats/BeatPackMockup";
import BeatPreviewPlayer from "@/components/free-beats/BeatPreviewPlayer";
import FeatureCard from "@/components/free-beats/FeatureCard";
import FreeBeatForm from "@/components/free-beats/FreeBeatForm";
import SuccessState from "@/components/free-beats/SuccessState";
import ShareButtons from "@/components/free-beats/ShareButtons";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import { ProductSchema } from "@/components/seo/ProductSchema";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { getPageShareContent } from "@/lib/shareContent";

const features = [
  {
    icon: Download,
    title: "Instant Delivery",
    description: "Download links sent directly to your inbox within minutes.",
  },
  {
    icon: DollarSign,
    title: "Profit-Enabled License",
    description: "Basic MP3 license included — release on Spotify, Apple Music & earn royalties.",
  },
  {
    icon: Music,
    title: "High-Quality Audio",
    description: "Professional-grade MP3s ready to record on.",
  },
];

const faqs = [
  {
    question: "Can I release these free beats on Spotify or Apple Music?",
    answer: "Yes! Every free beat comes with a Basic MP3 License that allows you to release your song commercially on all major streaming platforms including Spotify, Apple Music, Amazon Music, YouTube Music, and more.",
  },
  {
    question: "Can I monetize my song on YouTube?",
    answer: "Yes — you can upload your song to YouTube and earn money through the YouTube Partner Program on your channel. Just make sure to include producer credit 'Prod. by Joka Beatz' in your video title or description. Note: do NOT register the beat itself with Content ID, as that would conflict with the license terms.",
  },
  {
    question: "Do I need to credit Joka Beatz?",
    answer: "Yes, credit is required. Use the format 'Prod. by Joka Beatz' in your song title, streaming platform credits, or video description. This is a condition of the free license.",
  },
  {
    question: "What's the difference between the free license and a paid license?",
    answer: "The free Basic MP3 License covers up to 10,000 streams and 500 sales/downloads. Once you exceed those limits, you'll need to upgrade to a Lease or Exclusive license. Paid licenses also give you WAV quality, trackouts/stems, and higher usage caps.",
  },
  {
    question: "Can I sell my song on iTunes or Bandcamp?",
    answer: "Yes! With the Basic MP3 License you can sell your song on digital stores like iTunes, Bandcamp, and similar platforms — up to 500 downloads/sales.",
  },
  {
    question: "What happens if I exceed the free license limits?",
    answer: "If your song blows up and exceeds 10,000 streams or 500 sales, you'll need to upgrade to a paid license. Contact us with your original download details and we'll get you sorted.",
  },
  {
    question: "Is a credit card required?",
    answer: "Never. The free beats are 100% free — just enter your name and email and the download link will be sent to your inbox instantly.",
  },
];

const FreeBeats = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const freeBeatsShareContent = getPageShareContent("free-beats");

  if (isSuccess) {
    return (
      <Layout path="/free-beats">
        <section className="relative py-16 md:py-24 min-h-[90vh] overflow-hidden">
          <div className="absolute inset-0 bg-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <SuccessState />
            <div className="mt-8 md:mt-12 max-w-2xl mx-auto">
              <BeatPreviewPlayer isUnlocked={true} />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout
      path="/free-beats"
      seoTitle="Free Beats Download | Hip Hop & Trap | Joka Beatz"
      seoDescription="Download free hip hop, trap and R&B beats from Joka Beatz. Get instant MP3 downloads, no signup fees, plus licensing options for release-ready tracks."
      seoKeywords="free beats, free hip hop beats, free trap beats, free instrumentals, free beat download"
    >
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://jokabeatz.com/" },
          { name: "Free Beats", url: "https://jokabeatz.com/free-beats" },
        ]} 
      />
      <ProductSchema 
        name="Free Beat Pack - 5 Professional Beats"
        description="Download 5 free professional beats with Basic MP3 License. Release on Spotify, Apple Music & more. Hip Hop, Trap, and R&B instrumentals."
        price={0}
        category="Free Beats"
        sku="free-beat-pack"
        image="https://jokabeatz.com/joka-beatz-logo.png"
        url="https://jokabeatz.com/free-beats"
      />
      
      <section className="relative py-12 md:py-24 min-h-[90vh] overflow-x-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        {/* Dot pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating elements - hidden on mobile for performance */}
        <div className="hidden md:block">
          <div className="absolute top-20 left-10 w-2 h-2 bg-primary rounded-full animate-pulse" />
          <div className="absolute top-40 right-20 w-3 h-3 bg-primary/50 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 left-20 w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Hero Section - Centered */}
          <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
            {/* Social proof badge */}
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-secondary/50 rounded-full border border-border mb-4 md:mb-6">
              <Users size={16} className="text-primary shrink-0" />
              <span className="text-xs md:text-sm text-muted-foreground">
                <span className="font-bold text-foreground">500+</span> artists joined this month
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-3 md:mb-4 leading-tight">
              Get <span className="text-gradient">5 Free Beats</span>
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto mb-4">
              Drop-ready instrumentals delivered straight to your inbox. 
              Start recording your next hit today.
            </p>

            {/* Profit badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
              <DollarSign size={14} className="text-primary" />
              <span className="text-sm font-semibold text-primary">Profit-Enabled — Release on Spotify & Apple Music</span>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start max-w-6xl mx-auto">
            {/* Left Column - Mockup + Preview */}
            <div className="space-y-4 md:space-y-6 order-1 lg:order-1 min-w-0">
              {/* Beat pack mockup */}
              <BeatPackMockup />

              {/* Free Beat Licensing Terms */}
              <Collapsible>
                <CollapsibleTrigger className="w-full p-3 md:p-4 bg-secondary/30 rounded-xl border border-border hover:bg-secondary/50 transition-colors group min-h-[48px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs md:text-sm font-medium text-foreground">Free Beat License Terms (Basic MP3)</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 shrink-0" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-3 md:p-4 bg-secondary/20 rounded-xl border border-border">
                  <div className="space-y-3 md:space-y-4 text-xs md:text-sm">
                    <p className="text-muted-foreground">
                      Free beats include a <span className="text-foreground font-medium">Basic MP3 License</span> — you can profit from your music on streaming platforms.
                      By downloading, you agree to the following terms:
                    </p>
                    
                    <div className="space-y-2">
                      <p className="text-foreground font-medium flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 shrink-0" /> You CAN:
                      </p>
                      <ul className="text-muted-foreground space-y-1 ml-6">
                        <li>• Release on Spotify, Apple Music, Amazon Music & more</li>
                        <li>• Upload to YouTube & earn via YouTube Partner Program</li>
                        <li>• Sell on iTunes, Bandcamp (up to 500 sales)</li>
                        <li>• Perform live at shows & events</li>
                        <li>• Up to 10,000 streams total</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="text-foreground font-medium flex items-center gap-2">
                        <X className="h-4 w-4 text-red-500 shrink-0" /> You CANNOT:
                      </p>
                      <ul className="text-muted-foreground space-y-1 ml-6">
                        <li>• Claim ownership of the instrumental</li>
                        <li>• Redistribute or resell the beat files</li>
                        <li>• Exceed 10,000 streams or 500 sales without upgrading</li>
                        <li>• Register the beat with Content ID systems</li>
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <p className="text-muted-foreground">
                        <span className="text-foreground font-medium">Credit required:</span> "Prod. by Joka Beatz"
                      </p>
                      <p className="text-muted-foreground mt-2">
                        Need higher limits? <a href="/beats" className="text-primary hover:underline">Upgrade your license</a>.
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Audio Preview Player */}
              <BeatPreviewPlayer />

              {/* Lead Form - Mobile only (appears after beat previews) */}
              <div className="lg:hidden">
                <FreeBeatForm onSuccess={() => setIsSuccess(true)} />
              </div>

              {/* Share Section - Always at bottom of left column */}
              <div className="p-3 md:p-4 bg-secondary/30 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs md:text-sm font-medium text-foreground">Share with fellow artists</span>
                </div>
                <ShareButtons 
                  caption={freeBeatsShareContent.caption}
                  hashtags={freeBeatsShareContent.hashtags}
                />
              </div>
            </div>

            {/* Right Column - Features + Form (desktop only for form) */}
            <div className="space-y-4 md:space-y-6 lg:sticky lg:top-24 order-2 lg:order-2 min-w-0">
              {/* Feature cards */}
              <div className="space-y-2 md:space-y-3">
                {features.map((feature, index) => (
                  <FeatureCard
                    key={index}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                ))}
              </div>

              {/* Form - Desktop only */}
              <div className="hidden lg:block">
                <FreeBeatForm onSuccess={() => setIsSuccess(true)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              Everything you need to know about your free beats and license
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3 md:space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="bg-secondary border border-border rounded-lg px-4 md:px-6"
                >
                  <AccordionTrigger className="text-foreground font-semibold text-left hover:no-underline text-sm md:text-base py-4 md:py-5 min-h-[48px]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm md:text-base pb-4 md:pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FreeBeats;
