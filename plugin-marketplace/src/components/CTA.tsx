import { useState } from 'react'
import { Plug, ArrowRight, Loader2, CheckCircle } from 'lucide-react'

export function CTA() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setTimeout(() => {
      setStatus('success')
      setEmail('')
    }, 1200)
  }

  return (
    <section id="cta" className="py-20 bg-background relative overflow-hidden">
      {/* Ripple rings */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div className="absolute w-48 h-48 border border-primary/20 rounded-full animate-ripple" />
        <div className="absolute w-80 h-80 border border-primary/15 rounded-full animate-ripple-delayed" />
        <div className="absolute w-[480px] h-[480px] border border-primary/10 rounded-full animate-ripple-slow" />
        <div className="absolute w-[640px] h-[640px] border border-primary/5 rounded-full animate-ripple" />
      </div>

      {/* Central glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/12 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-t from-background via-transparent to-background" />

      <div className="max-w-2xl mx-auto px-4 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-6">
          <Plug size={12} />
          Get Early Access
        </div>

        <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
          Start Building Your Plugin{' '}
          <span className="text-primary">Today</span>
        </h2>
        <p className="text-muted mb-10 leading-relaxed">
          Join the waitlist for early access. We'll notify you the moment your spot opens — plus exclusive creator tips and tutorials.
        </p>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
              <CheckCircle size={32} className="text-primary" />
            </div>
            <p className="text-foreground font-bold text-lg">You're on the list!</p>
            <p className="text-muted text-sm">We'll reach out with your early access link soon.</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-secondary border border-border text-foreground placeholder:text-muted rounded-xl px-4 py-3 h-12 focus:outline-none focus:border-primary transition-colors text-sm"
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 rounded-xl transition-all red-glow red-glow-hover disabled:opacity-60 whitespace-nowrap"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} />
                    Get Access
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-4 text-sm">
              <a href="#features" className="text-muted hover:text-foreground transition-colors">
                Browse Features
              </a>
              <span className="text-border">•</span>
              <a href="#pricing" className="text-muted hover:text-foreground transition-colors">
                View Pricing
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
