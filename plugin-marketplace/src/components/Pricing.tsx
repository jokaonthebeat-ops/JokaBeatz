import { CheckCircle } from 'lucide-react'

const tiers = [
  {
    name: 'Starter',
    price: '$0',
    period: '/mo',
    popular: false,
    bestFor: 'Try the builder risk-free',
    features: [
      '3 plugin projects',
      'VST3 export',
      'Basic DSP components',
      'Preset manager included',
      'Community support',
      'Watermarked output',
    ],
    cta: 'Start Free',
    primary: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    popular: true,
    bestFor: 'Serious plugin creators',
    features: [
      'Unlimited projects',
      'VST3 + AU + AAX export',
      'Full DSP library access',
      'Code signing included',
      'Marketplace listing',
      '10% sales commission',
      'Priority support',
    ],
    cta: 'Start Building',
    primary: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    popular: false,
    bestFor: 'Labels & plugin studios',
    features: [
      'White-label builder',
      'Custom DSP modules',
      'Reduced commission',
      'Dedicated account manager',
      'API access',
      'SLA guarantee',
    ],
    cta: 'Contact Us',
    primary: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_40%,rgba(220,38,38,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(220,38,38,0.06),transparent)]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-20 left-1/4 w-1 h-1 bg-primary/40 rounded-full animate-float-particle" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float-particle-delayed" />
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-primary/30 rounded-full animate-float-particle-slow" />
        <div className="absolute top-1/2 left-10 w-1 h-1 bg-primary/50 rounded-full animate-float-particle" />
        <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-primary/25 rounded-full animate-float-particle-delayed" />
      </div>

      {/* Light streak */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20 hidden md:block">
        <div className="absolute -top-1/2 -left-1/4 w-full h-[200%] bg-gradient-to-br from-transparent via-red-600/10 to-transparent rotate-12 animate-light-streak" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            Creator Plans
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            Simple, <span className="text-primary">Transparent Pricing</span>
          </h2>
          <p className="text-muted max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, no long-term contracts — pay only for what you need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 card-lift ${
                tier.popular
                  ? 'border-2 border-primary red-glow bg-card'
                  : 'border-2 border-border hover:border-primary/40 bg-card red-glow-hover'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="text-center pt-2 mb-6">
                <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mt-2 mb-1">
                  <span className="text-4xl font-black text-primary">{tier.price}</span>
                  {tier.period && <span className="text-muted text-sm">{tier.period}</span>}
                </div>
                <p className="text-sm text-muted">{tier.bestFor}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted">
                    <CheckCircle size={15} className="text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="#cta"
                className={`block text-center font-bold text-sm py-3 rounded-xl transition-all min-h-[44px] flex items-center justify-center ${
                  tier.primary
                    ? 'bg-primary hover:bg-primary/90 text-white red-glow red-glow-hover'
                    : 'border-2 border-border hover:border-primary text-foreground hover:text-primary'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted mt-8">
          All plans include the preset manager. Marketplace commission applies to Pro and Enterprise plans only.
        </p>
      </div>
    </section>
  )
}
