import { CheckCircle, Target, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ServiceFeaturesProps {
  whatsIncluded: string[];
  whoItsFor: string;
  turnaround: string;
}

export const ServiceFeatures = ({
  whatsIncluded,
  whoItsFor,
  turnaround,
}: ServiceFeaturesProps) => {
  return (
    <section className="py-8 md:py-12 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* What's Included */}
          <Card className="bg-secondary border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <CheckCircle size={20} className="text-primary shrink-0" />
                What's Included
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {whatsIncluded.map((item, index) => (
                  <li key={index} className="text-xs md:text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Who It's For */}
          <Card className="bg-secondary border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Target size={20} className="text-primary shrink-0" />
                Who It's For
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs md:text-sm text-muted-foreground">
                {whoItsFor}
              </p>
            </CardContent>
          </Card>

          {/* Turnaround */}
          <Card className="bg-secondary border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Clock size={20} className="text-primary shrink-0" />
                Turnaround Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs md:text-sm text-muted-foreground">
                {turnaround}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
