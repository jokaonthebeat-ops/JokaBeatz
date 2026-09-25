import { Layout } from "@/components/layout/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LicensingPricing } from "@/components/home/LicensingPricing";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import ShareButtons from "@/components/free-beats/ShareButtons";
import { getPageShareContent } from "@/lib/shareContent";

const faqs = [
  {
    question: "Can I release on Spotify & Apple Music?",
    answer: "Yes! All license types allow distribution to streaming platforms like Spotify, Apple Music, Amazon Music, and more. Make sure to choose the appropriate license based on your release goals.",
  },
  {
    question: "Do I need to credit Joka Beatz?",
    answer: "Yes, credit is required for all lease licenses. The standard format is: 'Prod. by Joka Beatz' in your song title or description. Exclusive licenses may have different terms outlined in your contract.",
  },
  {
    question: "What are trackouts?",
    answer: "Trackouts (stems) are the individual audio files that make up the beat - drums, melody, bass, etc. This gives you full control during mixing and allows for custom arrangements.",
  },
  {
    question: "Can I upgrade my license?",
    answer: "Yes! You can upgrade to a higher license tier at any time. Contact us with your original purchase details and we'll apply your previous payment as credit toward the upgrade.",
  },
  {
    question: "How do exclusives work?",
    answer: "When you purchase exclusive rights, the beat is removed from the store and becomes yours exclusively. You'll receive a contract outlining full terms, ownership details, and usage rights.",
  },
];

const Beats = () => {
  return (
    <Layout path="/beats">
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://jokabeatz.com/" },
          { name: "Beats", url: "https://jokabeatz.com/beats" },
        ]} 
      />
      
      {/* Header */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4">
            Beats for Sale
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Preview, license, and download professional beats instantly. Hip Hop, Trap, R&B, and AfroBeat instrumentals.
          </p>
          <ShareButtons 
            title="Beats for Sale | Joka Beatz" 
            path="/beats"
            caption={getPageShareContent("beats").caption}
            hashtags={getPageShareContent("beats").hashtags}
          />
        </div>
      </section>

      {/* BeatStars Player */}
      <section className="py-8 md:py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 md:mb-8">
            <p className="text-sm md:text-base text-muted-foreground">
              To purchase beats or licenses, select a beat inside the player below.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-secondary rounded-lg p-1 red-glow">
              <div className="bg-background rounded-lg overflow-hidden border border-border">
                <iframe 
                  src="https://player.beatstars.com/?storeId=113791" 
                  width="100%" 
                  className="min-h-[500px] md:min-h-[700px] lg:min-h-[900px]"
                  style={{ border: 'none' }}
                  title="BeatStars Beat Player - Browse and License Hip Hop, Trap, R&B Beats"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Reference Table */}
      <LicensingPricing />

      {/* FAQ Section */}
      <section className="py-12 md:py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-4">
              Beat Licensing FAQ
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              Common questions about buying and licensing beats
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

export default Beats;
