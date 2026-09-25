import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import jokaBeatzLogo from "@/assets/joka-beatz-logo.png";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Beats", path: "/beats" },
  { name: "Services", path: "/services" },
  { name: "AI Mastering", path: "/ai-mastering" },
  { name: "Blog", path: "/blog" },
  { name: "Shop", path: "/shop" },
  { name: "Music Videos", path: "/music-videos" },
  { name: "Free Beats", path: "/free-beats" },
  { name: "Contact", path: "/contact" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, isLoading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border safe-area-top">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="hover:opacity-80 transition-opacity" aria-label="Joka Beatz Home">
            <img 
              src={jokaBeatzLogo} 
              alt="Joka Beatz - Professional Beat Producer" 
              className="h-10 md:h-12 w-auto"
              width="120"
              height="48"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold uppercase tracking-wide transition-colors hover:text-primary py-2 ${
                  location.pathname === link.path ? "text-primary" : "text-foreground"
                }`}
                aria-current={location.pathname === link.path ? "page" : undefined}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {!isLoading && user ? (
              <>
                <Button asChild variant="ghost" className="min-h-[44px]">
                  <Link to="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="outline" onClick={signOut} className="min-h-[44px]">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="min-h-[44px]">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold min-h-[44px]">
                  <Link to="/free-beats">Get Free Beats</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-3 text-foreground hover:text-primary transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-fade-in" aria-label="Mobile navigation">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-base font-semibold uppercase tracking-wide transition-colors hover:text-primary py-3 px-2 min-h-[48px] flex items-center ${
                    location.pathname === link.path ? "text-primary" : "text-foreground"
                  }`}
                  aria-current={location.pathname === link.path ? "page" : undefined}
                >
                  {link.name}
                </Link>
              ))}
              {!isLoading && user ? (
                <>
                  <Button asChild className="w-full mt-4 min-h-[48px]" variant="outline">
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full min-h-[48px]"
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="w-full mt-4 min-h-[48px]" variant="outline">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold min-h-[48px]">
                    <Link to="/free-beats" onClick={() => setIsMenuOpen(false)}>
                      Get Free Beats
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
