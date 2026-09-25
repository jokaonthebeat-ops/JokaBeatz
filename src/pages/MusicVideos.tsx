import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { OrderForm, OrderFormData } from "@/components/music-videos/OrderForm";
import { useMusicVideoSettings } from "@/hooks/useMusicVideoSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Video, Sparkles, Zap, Clock, Shield, HelpCircle, UserPlus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { ServiceSchema } from "@/components/seo/ProductSchema";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import ShareButtons from "@/components/free-beats/ShareButtons";
import { getPageShareContent } from "@/lib/shareContent";

const faqs = [
  {
    question: "What do I need to provide for my music video?",
    answer: "You'll need to upload your song as an MP3 file (max 10MB), 1-5 high-quality photos of the artist, and a description of your creative vision including desired style, mood, and any specific scenes or effects you want."
  },
  {
    question: "How long does it take to receive my video?",
    answer: "Standard delivery is 3-4 business days. If you need it faster, you can add our Rush Delivery upgrade for 48-hour turnaround."
  },
  {
    question: "What's the difference between Reels Style and Full Music Video?",
    answer: "Reels Style videos are vertical (9:16) and optimized for TikTok, Instagram Reels, and YouTube Shorts with fast-paced edits. Full Music Videos are widescreen (16:9), cover your entire song, and feature cinematic transitions perfect for YouTube and official releases."
  },
  {
    question: "Can I request revisions?",
    answer: "Yes! Each order includes one round of revisions. Additional revision rounds can be discussed after delivery if needed."
  },
  {
    question: "What format will I receive the final video in?",
    answer: "You'll receive your video in MP4 format, optimized for the platform you're targeting. 720p is included standard, or upgrade to 1080p Full HD for maximum quality."
  },
  {
    question: "Do I own the rights to my music video?",
    answer: "Absolutely! Once payment is complete, you have 100% ownership and full commercial rights to use your music video however you want."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, and other payment methods through our secure Stripe checkout."
  }
];

const MusicVideos = () => {
  const { data: settings, isLoading } = useMusicVideoSettings();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shareContent = getPageShareContent("music-videos");

  const handleSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);

    try {
      // Upload images and song to storage
      const uploadPromises: Promise<string>[] = [];
      const timestamp = Date.now();
      const folder = user?.id || `guest-${timestamp}`;

      // Upload images
      for (let i = 0; i < data.images.length; i++) {
        const file = data.images[i];
        const filePath = `${folder}/images/${timestamp}-${i}-${file.name}`;
        uploadPromises.push(
          supabase.storage
            .from("music-video-uploads")
            .upload(filePath, file)
            .then(({ data: uploadData, error }) => {
              if (error) throw error;
              return supabase.storage
                .from("music-video-uploads")
                .getPublicUrl(uploadData.path).data.publicUrl;
            })
        );
      }

      // Upload song
      const songPath = `${folder}/songs/${timestamp}-${data.song.name}`;
      const songUrlPromise = supabase.storage
        .from("music-video-uploads")
        .upload(songPath, data.song)
        .then(({ data: uploadData, error }) => {
          if (error) throw error;
          return supabase.storage
            .from("music-video-uploads")
            .getPublicUrl(uploadData.path).data.publicUrl;
        });

      const [imageUrls, songUrl] = await Promise.all([
        Promise.all(uploadPromises),
        songUrlPromise,
      ]);

      // Call edge function to create payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        "create-music-video-payment",
        {
          body: {
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            videoStyle: data.videoStyle,
            videoQuality: data.videoQuality,
            selectedUpgrades: data.selectedUpgrades,
            imageUrls,
            songUrl,
            visionDescription: data.visionDescription,
          },
        }
      );

      if (paymentError) throw paymentError;

      if (paymentData?.url) {
        window.open(paymentData.url, "_blank");
      }
    } catch (error: any) {
      console.error("Order submission error:", error);
      toast.error("Failed to process order: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout path="/music-videos">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Custom Music Video Production
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-tight">
              {isLoading ? (
                <Skeleton className="h-16 w-3/4 mx-auto" />
              ) : (
                <>
                  {settings?.headline.split(" ").map((word, i) => (
                    <span
                      key={i}
                      className={i === 1 ? "text-primary" : ""}
                    >
                      {word}{" "}
                    </span>
                  ))}
                </>
              )}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
              {isLoading ? (
                <Skeleton className="h-6 w-full" />
              ) : (
                settings?.subheadline
              )}
            </p>
            <div className="flex justify-center">
              <ShareButtons 
                title="Custom Music Videos for Artists | Joka Beatz" 
                path="/music-videos"
                caption={shareContent.caption}
                hashtags={shareContent.hashtags}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <p className="font-bold text-foreground">HD Quality</p>
              <p className="text-sm text-muted-foreground">720p or 1080p</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <p className="font-bold text-foreground">Fast Delivery</p>
              <p className="text-sm text-muted-foreground">3-4 days standard</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <p className="font-bold text-foreground">Rush Available</p>
              <p className="text-sm text-muted-foreground">48hr turnaround</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <p className="font-bold text-foreground">Full Rights</p>
              <p className="text-sm text-muted-foreground">100% yours</p>
            </div>
          </div>
        </div>
      </section>

      {/* Order Form */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
                Create Your Order
              </h2>
              <p className="text-muted-foreground">
                Choose your style, upload your materials, and let us bring your vision to life
              </p>
            </div>

            {/* Account Prompt for Guests */}
            {!user && (
              <div className="mb-8 p-6 bg-primary/10 border border-primary/30 rounded-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="bg-primary/20 p-3 rounded-full shrink-0">
                    <UserPlus className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">
                      Track Your Project Progress
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Create a free account to track your video's progress, receive notifications when it's ready, and download from your dashboard.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <Link to="/login">Log In</Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1 sm:flex-none">
                      <Link to="/signup">Create Account</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : settings ? (
              <OrderForm
                settings={settings}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            ) : null}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground">
                Everything you need to know about our music video service
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="bg-background border border-border rounded-xl px-6 data-[state=open]:border-primary/50"
                >
                  <AccordionTrigger className="text-left font-bold hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* FAQ Schema for SEO */}
      <FAQSchema faqs={faqs} />
      <ServiceSchema
        name="Music Video Production"
        description="Professional music video production for artists — visuals edited and delivered to match your track and release schedule."
        serviceType="Music Video Production"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://jokabeatz.com/" },
          { name: "Music Videos", url: "https://jokabeatz.com/music-videos" },
        ]}
      />
    </Layout>
  );
};

export default MusicVideos;
