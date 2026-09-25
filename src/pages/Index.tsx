import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { BeatStarsPlayer } from "@/components/home/BeatStarsPlayer";
import { BeatDeals } from "@/components/home/BeatDeals";
import { LicensingPricing } from "@/components/home/LicensingPricing";
import { YouTubeSection } from "@/components/home/YouTubeSection";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { MasteringPromo } from "@/components/home/MasteringPromo";
import { MusicVideoBanner } from "@/components/home/MusicVideoBanner";
import { ShopPreview } from "@/components/home/ShopPreview";
import { EmailCapture } from "@/components/home/EmailCapture";
import { MusicGroupSchema, LocalBusinessSchema } from "@/components/seo/StructuredData";

const Index = () => {
  return (
    <Layout path="/">
      <MusicGroupSchema />
      <LocalBusinessSchema />
      <HeroSection />
      <BeatDeals />
      <BeatStarsPlayer />
      <LicensingPricing />
      <YouTubeSection />
      <MasteringPromo />
      <ServicesPreview />
      <MusicVideoBanner />
      <ShopPreview />
      <EmailCapture />
    </Layout>
  );
};

export default Index;
