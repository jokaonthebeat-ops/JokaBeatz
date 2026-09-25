import { Plug, ArrowRight } from 'lucide-react'

const stats = [
  { value: '10K+', label: 'Plugins Created' },
  { value: '3', label: 'Export Formats' },
  { value: '100%', label: 'No Code Required' },
  { value: '4 Days', label: 'Avg. Delivery Time' },
]

const eqHeights = [40, 72, 55, 90, 62, 80, 44, 60, 76, 50, 85, 38]
const knobs = ['Drive', 'Freq', 'Reson.', 'Mix']

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Radial gradient background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(220,38,38,0.16),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_15%_70%,rgba(220,38,38,0.09),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_85%_25%,rgba(220,38,38,0.07),transparent)]" />
      </div>

      {/* Orbit blobs */}
      <div className="hidden md:block absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-orbit" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/8 rounded-full blur-3xl animate-orbit-reverse" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-float-particle" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-primary/30 rounded-full animate-float-particle-delayed" />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-primary/50 rounded-full animate-float-particle-slow" />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float-particle-delayed" />
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-primary/35 rounded-full animate-float-particle" />
      </div>

      {/* Light streak */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-25 hidden md:block">
        <div className="absolute -top-1/2 -left-1/4 w-full h-[200%] bg-gradient-to-br from-transparent via-red-600/10 to-transparent rotate-12 animate-light-streak" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <Plug size={12} />
              No-Code Audio Plugin Builder
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-6 leading-tight">
              Build Audio Plugins{' '}
              <span className="text-primary">Without Code</span>
            </h1>

            <p className="text-lg text-muted mb-4 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Design your GUI, select professional DSP components, and export signed VST3, AU, and AAX plugins — all from your browser.
            </p>

            <p className="text-sm text-muted mb-10 max-w-xl mx-auto lg:mx-0">
              Join thousands of producers and engineers building professional audio plugins without writing a single line of code.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
              <a
                href="#cta"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-base px-8 py-4 rounded-xl transition-all red-glow red-glow-hover min-h-[56px]"
              >
                <Plug size={20} />
                Start Building Free
              </a>
              <a
                href="#formats"
                className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-foreground/25 text-foreground hover:border-primary hover:text-primary font-bold text-base px-8 py-4 rounded-xl transition-all min-h-[56px]"
              >
                <ArrowRight size={20} />
                Browse Plugins
              </a>
            </div>
          </div>

          {/* Plugin UI Mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="animate-float">
              <div className="bg-card border border-border rounded-2xl overflow-hidden red-glow w-72 sm:w-80 shadow-2xl">
                {/* Title bar */}
                <div className="bg-secondary px-4 py-3 flex items-center gap-2 border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-primary/70" />
                  <div className="w-3 h-3 rounded-full bg-primary/35" />
                  <div className="w-3 h-3 rounded-full bg-primary/20" />
                  <span className="ml-2 text-xs font-bold text-muted tracking-widest uppercase">My Plugin v1.0</span>
                </div>

                <div className="p-6 space-y-6">
                  {/* EQ Spectrum */}
                  <div>
                    <p className="text-xs text-muted mb-3 font-semibold uppercase tracking-wider">EQ Spectrum</p>
                    <div className="flex items-end gap-1 h-16">
                      {eqHeights.map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-primary rounded-t origin-bottom"
                          style={{
                            height: `${h}%`,
                            animation: `equalizer ${0.7 + (i % 5) * 0.15}s ease-in-out ${i * 0.07}s infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Knobs */}
                  <div>
                    <p className="text-xs text-muted mb-3 font-semibold uppercase tracking-wider">Controls</p>
                    <div className="grid grid-cols-4 gap-3">
                      {knobs.map((label) => (
                        <div key={label} className="flex flex-col items-center gap-1.5">
                          <div className="w-10 h-10 rounded-full border-2 border-primary/40 bg-secondary flex items-center justify-center relative">
                            <div className="w-1 h-3 bg-primary rounded-full absolute top-1.5" />
                          </div>
                          <span className="text-[9px] text-muted font-semibold uppercase tracking-wide text-center">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Format badges */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {['VST3', 'AU', 'AAX'].map((fmt) => (
                      <span
                        key={fmt}
                        className="text-[10px] font-black bg-primary/10 border border-primary/30 text-primary px-2 py-0.5 rounded"
                      >
                        {fmt}
                      </span>
                    ))}
                    <span className="ml-auto text-[10px] text-muted">✓ Signed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto border-t border-border pt-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-primary mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-muted font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
