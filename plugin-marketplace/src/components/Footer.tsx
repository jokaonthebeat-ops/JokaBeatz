import { Plug } from 'lucide-react'

const links = {
  Product: ['Features', 'How It Works', 'Pricing', 'Marketplace'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
}

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="/" className="flex items-center gap-2.5 mb-4 hover:opacity-80 transition-opacity w-fit">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                <Plug size={18} className="text-white" />
              </div>
              <span className="text-foreground font-black text-xl tracking-tight">PluginForge</span>
            </a>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              The no-code platform for building and selling professional audio plugins. VST3, AU, AAX — shipped in days.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-foreground font-bold text-sm uppercase tracking-wider mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-muted hover:text-foreground text-sm transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border pt-8">
          <p className="text-muted text-sm">
            © {new Date().getFullYear()} PluginForge. All rights reserved.
          </p>
          <p className="text-muted text-xs">
            Built for producers, engineers, and plugin creators worldwide.
          </p>
        </div>
      </div>
    </footer>
  )
}
