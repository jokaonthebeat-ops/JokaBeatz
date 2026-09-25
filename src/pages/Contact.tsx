import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Mail, Clock, Instagram, Youtube, Twitter, Music } from "lucide-react";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const subjects = [
  "Custom Beat Inquiry",
  "Mixing/Mastering Quote",
  "Consultation Booking",
  "Exclusive Rights",
  "Collaboration",
  "General Question",
  "Other",
];

const Contact = () => {
  const { data: settings } = useSiteSettings();

  const socialLinks = [
    { name: "Instagram", icon: Instagram, href: settings?.instagram_url || "#" },
    { name: "YouTube", icon: Youtube, href: settings?.youtube_url || "#" },
    { name: "Twitter", icon: Twitter, href: settings?.twitter_url || "#" },
    { name: "BeatStars", icon: Music, href: settings?.beatstars_url || "#" },
  ];


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // ContactPage schema
  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Joka Beatz",
    description: "Get in touch with Joka Beatz for custom beats, mixing, mastering, or collaboration inquiries.",
    url: "https://jokabeatz.com/contact",
    mainEntity: {
      "@type": "Organization",
      name: "Joka Beatz",
      email: "contact@jokabeatz.com",
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert({
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
        });

      if (error) throw error;

      setIsSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      toast({
        title: "Message Sent!",
        description: "We'll get back to you as soon as possible.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout path="/contact">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(contactPageSchema)}</script>
      </Helmet>
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://jokabeatz.com/" },
          { name: "Contact", url: "https://jokabeatz.com/contact" },
        ]} 
      />

      {/* Header */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4">
            Contact Joka Beatz
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Have a question or want to work together? Drop a message.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-8 md:py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
            {/* Contact Form */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">
                Send a Message
              </h2>

              {isSuccess ? (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 md:p-8 text-center">
                  <Mail size={48} className="text-primary mx-auto mb-4" />
                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-6">
                    Thanks for reaching out. I'll get back to you soon.
                  </p>
                  <Button
                    onClick={() => setIsSuccess(false)}
                    variant="outline"
                    className="border-foreground text-foreground hover:bg-foreground hover:text-background min-h-[48px]"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground text-sm md:text-base">
                      Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-12 text-base"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground text-sm md:text-base">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-12 text-base"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-foreground text-sm md:text-base">
                      Subject
                    </Label>
                    <Select value={subject} onValueChange={setSubject} disabled={isLoading}>
                      <SelectTrigger className="bg-secondary border-border text-foreground h-12 text-base">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {subjects.map((s) => (
                          <SelectItem key={s} value={s} className="text-foreground min-h-[44px]">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-foreground text-sm md:text-base">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground min-h-[120px] md:min-h-[150px] text-base"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold min-h-[56px] text-base md:text-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2" size={20} />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Info Column */}
            <div className="space-y-4 md:space-y-8">
              {/* Booking Info */}
              <div className="bg-secondary rounded-lg p-4 md:p-6 border border-border">
                <h3 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">
                  Booking Information
                </h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="text-primary mt-1 shrink-0" size={20} />
                    <div>
                      <p className="font-semibold text-foreground text-sm md:text-base">Email</p>
                      <p className="text-muted-foreground text-sm md:text-base">contact@jokabeatz.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="text-primary mt-1 shrink-0" size={20} />
                    <div>
                      <p className="font-semibold text-foreground text-sm md:text-base">Response Time</p>
                      <p className="text-muted-foreground text-sm md:text-base">Usually within 24-48 hours</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-secondary rounded-lg p-4 md:p-6 border border-border">
                <h3 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">
                  Connect on Social
                </h3>
                <div className="flex gap-3 md:gap-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 md:p-4 bg-background rounded-full text-foreground hover:bg-primary hover:text-primary-foreground transition-all min-w-[48px] min-h-[48px] flex items-center justify-center"
                      aria-label={`Follow Joka Beatz on ${social.name}`}
                    >
                      <social.icon size={22} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick Note */}
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 md:p-6">
                <h3 className="text-base md:text-lg font-bold text-foreground mb-2">
                  Quick Note
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  For beat purchases and licensing, please use the BeatStars player on the{" "}
                  <a href="/beats" className="text-primary hover:underline font-medium">
                    Beats page
                  </a>
                  . For everything else, use this contact form!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
