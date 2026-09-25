import { useState } from "react";
import { format } from "date-fns";
import { Layout } from "@/components/layout/Layout";
import { ServiceHero } from "@/components/services/ServiceHero";
import { ServiceFeatures } from "@/components/services/ServiceFeatures";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, Loader2, CalendarIcon, Clock } from "lucide-react";
import { useServicePayment } from "@/hooks/useServicePayment";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import ShareButtons from "@/components/free-beats/ShareButtons";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { ServiceSchema } from "@/components/seo/ProductSchema";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";

const formSchema = z.object({
  customerName: z.string().trim().min(1, "Name is required").max(100),
  customerEmail: z.string().trim().email("Invalid email").max(255),
  projectNotes: z.string().trim().min(20, "Please describe your situation (at least 20 characters)").max(2000),
});

const TOPICS = [
  { id: "release", label: "Release Strategy" },
  { id: "branding", label: "Branding & Image" },
  { id: "marketing", label: "Marketing & Promotion" },
  { id: "career", label: "Career Guidance" },
  { id: "production", label: "Production Tips" },
  { id: "other", label: "Other" },
];

const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
  "7:00 PM", "7:30 PM", "8:00 PM",
];

const Consultation = () => {
  const { createPayment, isProcessing } = useServicePayment();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    projectNotes: "",
  });
  const [preferredDate, setPreferredDate] = useState<Date | undefined>();
  const [preferredTime, setPreferredTime] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((t) => t !== topicId)
        : [...prev, topicId]
    );
  };

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

    if (selectedTopics.length === 0) {
      toast.error("Please select at least one topic to discuss");
      return;
    }

    try {
      await createPayment({
        serviceType: "consultation",
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        projectNotes: formData.projectNotes.trim(),
        additionalData: {
          topics: selectedTopics,
          preferredTime: preferredDate && preferredTime ? `${format(preferredDate, "PPP")} at ${preferredTime}` : preferredDate ? format(preferredDate, "PPP") : preferredTime || null,
        },
      });
      toast.success("Redirecting to checkout...");
    } catch {
      // Error handled in hook
    }
  };

  const faqItems = [
    { question: "What happens after I pay?", answer: "Once payment is confirmed, I'll reach out within 24–48 hours to schedule your 60-minute video call at a time that works for both of us." },
    { question: "How is the call conducted?", answer: "The consultation is a 60-minute one-on-one video call via Zoom or Google Meet. You'll get the link once we confirm your time slot." },
    { question: "What topics can we cover?", answer: "We can cover release strategy, branding and image, marketing and promotion, career direction, production tips, or anything else music-career related. You pick the topics when you book." },
    { question: "Will I get notes after the call?", answer: "Yes. After every session I send follow-up notes with the key takeaways, action items, and resources discussed so you have a clear roadmap to work from." },
    { question: "Is this for beginners or established artists?", answer: "Both. Whether you're just starting out and need direction, or you're an established artist looking to level up your strategy, the session is tailored entirely to where you are right now." },
    { question: "Can I ask about specific projects or songs?", answer: "Absolutely. Bring whatever you're working on — unreleased tracks, campaign ideas, social media strategy, branding questions — and we'll dig into it together." },
    { question: "What if I need to reschedule?", answer: "Life happens. Just reach out before the scheduled time and we'll find a new slot that works. I ask for at least 24 hours notice where possible." },
    { question: "Is this a one-time session or ongoing?", answer: "It's a single 60-minute session. If you'd like ongoing support, we can discuss a retainer or follow-up sessions after your initial consultation." },
  ];

  return (
    <Layout path="/services/consultation">
      <FAQSchema faqs={faqItems} />
      <ServiceSchema
        name="1-on-1 Artist Consultation"
        description="A personal consultation covering your music career, release strategy and artist brand, with direct advice tailored to your situation."
        serviceType="Music Career Consultation"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://jokabeatz.com/" },
          { name: "Services", url: "https://jokabeatz.com/services" },
          { name: "Consultation", url: "https://jokabeatz.com/services/consultation" },
        ]}
      />
      <ServiceHero
        icon={Users}
        title="1-on-1 Consultation"
        description="30 minutes of personal guidance on your music career, release strategy, and brand. Get direct advice tailored to your unique situation."
        price={100}
        turnaround="Scheduled within 1 week"
        path="/services/consultation"
      />

      <ServiceFeatures
        whatsIncluded={[
          "30-minute video call",
          "Release strategy planning",
          "Branding and image guidance",
          "Marketing tips and tactics",
          "Follow-up notes and action items",
        ]}
        whoItsFor="Emerging artists who want direction and a clear path forward in their career."
        turnaround="Scheduled within 1 week"
      />

      {/* Order Form */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto bg-secondary border-border">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-bold text-center">
                Book Your 30-Min Consultation
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

                <div className="space-y-3">
                  <label className="text-sm font-medium">Topics to Discuss *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {TOPICS.map((topic) => (
                      <div
                        key={topic.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={topic.id}
                          checked={selectedTopics.includes(topic.id)}
                          onCheckedChange={() => toggleTopic(topic.id)}
                        />
                        <label
                          htmlFor={topic.id}
                          className="text-sm cursor-pointer"
                        >
                          {topic.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Current Situation & Goals *</label>
                  <Textarea
                    value={formData.projectNotes}
                    onChange={(e) => setFormData({ ...formData, projectNotes: e.target.value })}
                    placeholder="Tell me about where you're at in your music career and what you want to achieve. What challenges are you facing? What questions do you have?"
                    rows={5}
                    className={errors.projectNotes ? "border-destructive" : ""}
                  />
                  {errors.projectNotes && (
                    <p className="text-xs text-destructive">{errors.projectNotes}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Preferred Date & Time (optional)</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal",
                            !preferredDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {preferredDate ? format(preferredDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={preferredDate}
                          onSelect={(date) => {
                            setPreferredDate(date);
                            setCalendarOpen(false);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>

                    <Select value={preferredTime} onValueChange={setPreferredTime}>
                      <SelectTrigger className={cn("flex-1", !preferredTime && "text-muted-foreground")}>
                        <Clock className="mr-2 h-4 w-4 shrink-0" />
                        <SelectValue placeholder="Pick a time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((slot) => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    I'll reach out to confirm the exact time after payment. Times are in EST.
                  </p>
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
                    "Checkout - $100"
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
            <p className="text-muted-foreground text-center mb-8 text-sm">Everything you need to know about booking a consultation.</p>
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

export default Consultation;
