import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ServiceHero } from "@/components/services/ServiceHero";
import { ServiceFeatures } from "@/components/services/ServiceFeatures";
import { MultiFileUpload } from "@/components/services/MultiFileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Loader2 } from "lucide-react";
import { useServicePayment } from "@/hooks/useServicePayment";
import { toast } from "sonner";
import { z } from "zod";
import ShareButtons from "@/components/free-beats/ShareButtons";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { ServiceSchema } from "@/components/seo/ProductSchema";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";

const formSchema = z.object({
  customerName: z.string().trim().min(1, "Name is required").max(100),
  customerEmail: z.string().trim().email("Invalid email").max(255),
  projectNotes: z.string().trim().min(10, "Please describe your vision (at least 10 characters)").max(2000),
});

const CustomBeats = () => {
  const { createPayment, isProcessing } = useServicePayment();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    projectNotes: "",
    bpm: "",
    key: "",
  });
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      formSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    if (fileUrls.length === 0) {
      toast.error("Please upload at least one reference track");
      return;
    }

    try {
      await createPayment({
        serviceType: "custom_beats",
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        projectNotes: formData.projectNotes.trim(),
        fileUrls,
        additionalData: {
          bpm: formData.bpm || null,
          key: formData.key || null,
        },
      });
      toast.success("Redirecting to checkout...");
    } catch {
      // Error handled in hook
    }
  };

  const faqItems = [
    { question: "What exactly do I get with a custom beat?", answer: "You get a fully exclusive, one-of-a-kind beat produced specifically for your project. Delivery includes a high-quality WAV file plus all stems (individual track layers), so you have full creative control for mixing." },
    { question: "Do I own the beat outright?", answer: "Yes. Full ownership transfers to you upon delivery. The beat will not be sold or leased to anyone else — it's exclusively yours." },
    { question: "How does the revision process work?", answer: "After receiving the initial concepts, you can request unlimited revisions until you're completely happy with the result. I want you to love your beat before we call it done." },
    { question: "How long will it take to get my beat?", answer: "The standard turnaround is 3–5 business days. You'll first receive 2–3 concept sketches so we can align on direction before I complete the final production." },
    { question: "What should I include in my reference tracks?", answer: "Upload 1–3 songs that capture the vibe, energy, or style you're going for. They don't have to be exact — they're just a guide. The more specific you are in your description, the better the result." },
    { question: "Can I use the beat commercially?", answer: "Yes. Since you have full ownership, you can use the beat for commercial releases, sync licensing, streaming, and more with no restrictions." },
    { question: "What if I'm not happy with the final result?", answer: "Unlimited revisions mean we keep working until you're satisfied. Your vision matters — I won't deliver something you don't love." },
    { question: "What file formats will I receive?", answer: "You'll receive a full WAV master file plus individual stems (kick, snare, melody, bass, etc.) delivered via a secure download link." },
  ];

  return (
    <Layout path="/services/custom-beats">
      <FAQSchema faqs={faqItems} />
      <ServiceSchema
        name="Custom Beat Production"
        description="Exclusive beats produced specifically for your project, with unlimited revisions, WAV master and full stems delivered."
        serviceType="Custom Beat Production"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://jokabeatz.com/" },
          { name: "Services", url: "https://jokabeatz.com/services" },
          { name: "Custom Beats", url: "https://jokabeatz.com/services/custom-beats" },
        ]}
      />
      <ServiceHero
        icon={Music}
        title="Custom Beat Production"
        description="Get exclusive production crafted specifically for your project and sound. Work directly with me to create a beat that no one else has."
        price={300}
        turnaround="3-5 business days"
        path="/services/custom-beats"
      />

      <ServiceFeatures
        whatsIncluded={[
          "Initial consultation to understand your vision",
          "2-3 beat concepts to choose from",
          "Unlimited revisions until you're satisfied",
          "Full ownership of the final beat",
          "WAV + stems delivery",
        ]}
        whoItsFor="Solo artists, labels, and projects that need a unique sound that no one else has."
        turnaround="3-5 business days"
      />

      {/* Order Form */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto bg-secondary border-border">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-bold text-center">
                Order Your Custom Beat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Name *</label>
                    <Input
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="John Doe"
                      className={errors.customerName ? "border-destructive" : ""}
                    />
                    {errors.customerName && (
                      <p className="text-xs text-destructive">{errors.customerName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      placeholder="you@email.com"
                      className={errors.customerEmail ? "border-destructive" : ""}
                    />
                    {errors.customerEmail && (
                      <p className="text-xs text-destructive">{errors.customerEmail}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preferred BPM (optional)</label>
                    <Select value={formData.bpm} onValueChange={(v) => setFormData({ ...formData, bpm: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select BPM range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60-80">60-80 BPM (Slow)</SelectItem>
                        <SelectItem value="80-100">80-100 BPM (R&B/Soul)</SelectItem>
                        <SelectItem value="100-120">100-120 BPM (Hip Hop)</SelectItem>
                        <SelectItem value="120-140">120-140 BPM (Uptempo)</SelectItem>
                        <SelectItem value="140-160">140-160 BPM (Trap)</SelectItem>
                        <SelectItem value="any">No preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preferred Key (optional)</label>
                    <Select value={formData.key} onValueChange={(v) => setFormData({ ...formData, key: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select key" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="C">C Major / A Minor</SelectItem>
                        <SelectItem value="D">D Major / B Minor</SelectItem>
                        <SelectItem value="E">E Major / C# Minor</SelectItem>
                        <SelectItem value="F">F Major / D Minor</SelectItem>
                        <SelectItem value="G">G Major / E Minor</SelectItem>
                        <SelectItem value="A">A Major / F# Minor</SelectItem>
                        <SelectItem value="B">B Major / G# Minor</SelectItem>
                        <SelectItem value="any">No preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <MultiFileUpload
                  label="Reference Tracks *"
                  description="Upload 1-3 songs that represent the vibe you're going for (MP3, max 10MB each)"
                  maxFiles={3}
                  maxSizeMB={10}
                  acceptedTypes="audio/mpeg,.mp3"
                  onFilesUploaded={setFileUrls}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Vision *</label>
                  <Textarea
                    value={formData.projectNotes}
                    onChange={(e) => setFormData({ ...formData, projectNotes: e.target.value })}
                    placeholder="Describe the mood, vibe, and any specific elements you want in your beat. Mention any artists or songs that inspire your sound..."
                    rows={5}
                    className={errors.projectNotes ? "border-destructive" : ""}
                  />
                  {errors.projectNotes && (
                    <p className="text-xs text-destructive">{errors.projectNotes}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isProcessing}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 red-glow red-glow-hover"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Checkout - $300"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      {/* FAQ Section */}
      <section className="py-12 md:py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-black text-foreground mb-2 text-center">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-center mb-8 text-sm">Everything you need to know about ordering a custom beat.</p>
            <div className="border border-border rounded-xl overflow-hidden">
              {faqItems.map((item, i) => (
                <details key={i} className="group border-b border-border last:border-b-0">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-semibold text-foreground text-sm hover:bg-muted/40 transition-colors list-none select-none gap-4">
                    <span>{item.question}</span>
                    <span className="text-primary shrink-0 transition-transform duration-200 group-open:rotate-180">▾</span>
                  </summary>
                  <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CustomBeats;
