import { Layout } from "@/components/layout/Layout";
import { PluginHero } from "@/components/plugins/PluginHero";
import { PluginFeatures } from "@/components/plugins/PluginFeatures";
import { HowItWorksSection } from "@/components/plugins/HowItWorksSection";
import { FormatShowcase } from "@/components/plugins/FormatShowcase";
import { CreatorPricing } from "@/components/plugins/CreatorPricing";
import { PluginTestimonials } from "@/components/plugins/PluginTestimonials";
import { PluginCTA } from "@/components/plugins/PluginCTA";

const Plugins = () => {
  return (
    <Layout
      path="/plugins"
      seoTitle="Plugin Marketplace — Build Audio Plugins Without Code | Joka Beatz"
      seoDescription="Design plugin GUIs, select analog-modeled DSP components, and export signed VST3, AU, and AAX plugins in days — no coding required. Sell on our marketplace."
      seoKeywords="audio plugin builder, no code VST, plugin marketplace, VST3 AU AAX, audio plugin creator, sell audio plugins"
    >
      <PluginHero />
      <PluginFeatures />
      <HowItWorksSection />
      <FormatShowcase />
      <CreatorPricing />
      <PluginTestimonials />
      <PluginCTA />
    </Layout>
  );
};

export default Plugins;
