import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { DynamicSeo } from "@/components/seo/DynamicSeo";
import FreeBeatPopup from "@/components/popups/FreeBeatPopup";
import { CookieConsentBanner } from "@/components/cookies/CookieConsentBanner";

interface LayoutProps {
  children: ReactNode;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImage?: string;
  ogType?: string;
  path?: string;
}

export const Layout = ({ 
  children, 
  seoTitle, 
  seoDescription, 
  seoKeywords, 
  ogImage,
  ogType,
  path 
}: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DynamicSeo 
        title={seoTitle} 
        description={seoDescription} 
        keywords={seoKeywords}
        ogImage={ogImage}
        ogType={ogType}
        path={path}
      />
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
        {children}
      </main>
      <Footer />
      <FreeBeatPopup />
      <CookieConsentBanner />
    </div>
  );
};
