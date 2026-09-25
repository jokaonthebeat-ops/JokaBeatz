import { MousePointer2, Sliders, Package, ShieldCheck, Bookmark, Store } from 'lucide-react'

const features = [
  {
    icon: MousePointer2,
    title: 'No-Code Builder',
    description: 'Drag and drop knobs, sliders, buttons, and displays onto your canvas. Add your logo and brand colors. Zero coding experience needed.',
  },
  {
    icon: Sliders,
    title: 'DSP Library',
    description: 'Choose from a curated library of analog-modeled processors: compressors, EQs, saturators, filters, reverbs, and advanced routing utilities.',
  },
  {
    icon: Package,
    title: 'Multi-Format Export',
    description: 'Export your plugin as VST3, AU, and AAX in a single click. Compatible with every major DAW on Windows and macOS.',
  },
  {
    icon: ShieldCheck,
    title: 'Plugin Signing',
    description: 'Every exported plugin is code-signed automatically. It loads in your DAW without security warnings — ready for professional distribution.',
  },
  {
    icon: Bookmark,
    title: 'Preset Manager',
    description: 'Every plugin ships with a built-in preset manager. Create, save, and share presets — include your own factory presets for free.',
  },
  {
    icon: Store,
    title: 'Marketplace',
    description: 'List your plugin, set your price, and we handle delivery and payments. Sell directly to producers and engineers worldwide.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-card relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_50%,rgba(220,38,38,0.07),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_70%_40%,rgba(220,38,38,0.05),transparent)]" />
      </div>

      {/* Morph blobs */}
      <div className="hidden md:block absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/6 rounded-full blur-3xl animate-morph" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" style={{ animationDelay: '6s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            Everything You Need
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            Professional Tools,{' '}
            <span className="text-primary">Zero Code</span>
          </h2>
          <p className="text-muted max-w-2xl mx-auto">
            From GUI design to DSP processing to global distribution — every tool you need to ship professional audio plugins is built in.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-secondary border-2 border-border rounded-2xl p-6 card-lift red-glow-hover hover:border-primary/40 transition-colors"
            >
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4 relative">
                <div className="absolute inset-0 bg-primary/15 rounded-xl blur-lg animate-pulse-glow" />
                <Icon size={22} className="text-primary relative z-10" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
