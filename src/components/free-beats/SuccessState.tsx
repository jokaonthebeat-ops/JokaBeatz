import { CheckCircle, Mail, Download, Headphones } from "lucide-react";
import jokaBeatzLogo from "@/assets/joka-beatz-logo.png";

const steps = [
  { icon: Mail, text: "Check your inbox" },
  { icon: Download, text: "Download the beats" },
  { icon: Headphones, text: "Start creating" },
];

const SuccessState = () => {
  return (
    <div className="text-center max-w-lg mx-auto">
      {/* Logo with glow */}
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
        <img 
          src={jokaBeatzLogo} 
          alt="Joka Beatz" 
          className="relative w-48 h-auto drop-shadow-2xl"
        />
      </div>
      
      {/* Success icon */}
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-primary/10 rounded-full red-glow">
          <CheckCircle size={48} className="text-primary" />
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
        You're <span className="text-gradient">In!</span>
      </h1>
      
      <p className="text-xl text-muted-foreground mb-6">
        Your free beats are on the way to your inbox.
      </p>

      {/* Download now prompt */}
      <div className="bg-primary/10 rounded-2xl border border-primary/30 p-4 mb-8">
        <p className="text-sm text-foreground font-medium flex items-center justify-center gap-2">
          <Download size={16} className="text-primary" />
          Or download them directly below
        </p>
      </div>

      {/* Next steps */}
      <div className="bg-secondary/30 rounded-2xl border border-border p-6 mb-8">
        <h3 className="font-bold text-foreground mb-6">What's Next?</h3>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <step.icon size={20} className="text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{step.text}</span>
              {index < steps.length - 1 && (
                <span className="hidden md:block text-muted-foreground/50 mx-2">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Don't see it? Check your spam folder.
      </p>
    </div>
  );
};

export default SuccessState;
