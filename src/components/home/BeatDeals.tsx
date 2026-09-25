import { Tag } from "lucide-react";

const dealCategories = [
  {
    name: "Standard WAV Lease",
    price: "$59.99 each",
    deals: [
      { buy: 1, get: 1 },
      { buy: 2, get: 2 },
      { buy: 3, get: 3 },
    ],
  },
  {
    name: "Unlimited Lease",
    price: "$199.99 each",
    deals: [
      { buy: 1, get: 1 },
      { buy: 2, get: 2 },
      { buy: 3, get: 3 },
    ],
  },
  {
    name: "Basic MP3 Lease",
    price: "$29.99 each",
    deals: [
      { buy: 1, get: 1 },
      { buy: 2, get: 2 },
      { buy: 3, get: 3 },
    ],
  },
];

export const BeatDeals = () => {
  return (
    <section className="py-12 md:py-16 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,_hsl(0_84%_50%_/_0.07),_transparent)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary-bright text-sm font-bold px-4 py-2 rounded-full mb-4">
            <Tag size={15} />
            LIMITED TIME DEALS
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">
            Beat Bundle Deals
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            Deals are applied automatically at checkout inside the BeatStars player below.
          </p>
        </div>

        {/* Deal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {dealCategories.map((category, idx) => (
            <div
              key={idx}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 card-lift"
            >
              {/* Card Header */}
              <div className="bg-primary/10 border-b border-border px-5 py-4">
                <h3 className="text-foreground font-black text-lg leading-tight">
                  {category.name}
                </h3>
                <p className="text-muted-foreground text-xs mt-1">{category.price}</p>
              </div>

              {/* Deals List */}
              <div className="px-5 py-4 space-y-3">
                {category.deals.map((deal, dealIdx) => (
                  <div
                    key={dealIdx}
                    className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3 red-glow-hover transition-all duration-200"
                  >
                    <span className="text-muted-foreground text-sm font-medium">
                      BUY {deal.buy}
                    </span>
                    <span className="text-primary-bright font-black text-sm tracking-wide">
                      GET {deal.get} FREE
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer note */}
              <div className="px-5 pb-4">
                <p className="text-xs text-muted-foreground text-center">
                  ✓ Applied instantly at BeatStars checkout
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
