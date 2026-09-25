import { Link } from "react-router-dom";
import { Instagram, Youtube, Twitter, Music } from "lucide-react";
import jokaBeatzLogo from "@/assets/joka-beatz-logo.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePartnerLinks } from "@/hooks/usePartnerLinks";
import { CookieSettingsButton } from "@/components/cookies/CookieSettingsButton";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Beats", path: "/beats" },
  { name: "Services", path: "/services" },
  { name: "Music Videos", path: "/music-videos" },
  { name: "Blog", path: "/blog" },
  { name: "Shop", path: "/shop" },
  { name: "Contact", path: "/contact" },
];

const artistResources = [
  { name: "Free Beats", path: "/free-beats" },
  { name: "Free Guide", path: "/free-guide" },
];

const legalLinks = [
  { name: "Privacy Policy", path: "/privacy-policy" },
  { name: "Terms of Service", path: "/terms-of-service" },
  { name: "Licensing Terms", path: "/licensing-terms" },
];

export const Footer = () => {
  const { data: settings } = useSiteSettings();
  const { data: partnerLinks } = usePartnerLinks();

  const socialLinks = [
    { name: "Instagram", icon: Instagram, href: settings?.instagram_url || "#" },
    { name: "YouTube", icon: Youtube, href: settings?.youtube_url || "#" },
    { name: "Twitter", icon: Twitter, href: settings?.twitter_url || "#" },
    { name: "BeatStars", icon: Music, href: settings?.beatstars_url || "#" },
  ];

  return (
    <footer className="bg-card border-t border-border py-8 md:py-12 safe-area-bottom">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 mb-8">
          {/* Logo & Tagline */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block" aria-label="Joka Beatz Home">
              <img 
                src={jokaBeatzLogo} 
                alt="Joka Beatz" 
                className="h-12 md:h-16 w-auto hover:opacity-80 transition-opacity"
                width="120"
                height="64"
              />
            </Link>
            <p className="mt-3 md:mt-4 text-sm md:text-base text-muted-foreground">
              Beats • Custom Production • Mixing • Mastering
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">Quick Links</h4>
            <nav className="flex flex-col gap-2" aria-label="Footer quick links">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm md:text-base text-muted-foreground hover:text-primary transition-colors py-1 min-h-[32px] flex items-center"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Artist Resources */}
          <div>
            <h4 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">Artist Resources</h4>
            <nav className="flex flex-col gap-2" aria-label="Artist resources">
              {artistResources.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm md:text-base text-muted-foreground hover:text-primary transition-colors py-1 min-h-[32px] flex items-center"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">Legal</h4>
            <nav className="flex flex-col gap-2" aria-label="Footer legal links">
              {legalLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm md:text-base text-muted-foreground hover:text-primary transition-colors py-1 min-h-[32px] flex items-center"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Our Partners & Social */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">Our Partners</h4>
            <nav className="flex flex-col gap-2 mb-4" aria-label="Partner sites">
              {partnerLinks?.map((partner) => (
                <a
                  key={partner.id}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm md:text-base text-muted-foreground hover:text-primary transition-colors py-1 min-h-[32px] flex items-center"
                >
                  {partner.name}
                </a>
              ))}
            </nav>

            <h4 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">Follow Us</h4>
            <div className="flex gap-3 md:gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 md:p-4 bg-secondary rounded-full text-foreground hover:bg-primary hover:text-primary-foreground transition-all min-w-[48px] min-h-[48px] flex items-center justify-center"
                  aria-label={`Follow Joka Beatz on ${social.name}`}
                >
                  <social.icon size={20} className="md:w-6 md:h-6" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 md:pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs md:text-sm text-center sm:text-left">
            © {new Date().getFullYear()} Joka Beatz. All rights reserved.
          </p>
          <CookieSettingsButton />
        </div>
      </div>
    </footer>
  );
};
