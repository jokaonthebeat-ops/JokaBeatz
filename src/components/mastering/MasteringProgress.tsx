import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, Zap, AudioWaveform, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MasteringProgressProps {
  status: string;
  processingStage?: string | null;
  className?: string;
}

// Processing stages based on Tonn API responses
const STAGES = [
  { key: 'PENDING', label: 'Queued', icon: Loader2, description: 'Waiting to start...' },
  { key: 'STARTED', label: 'Starting', icon: Zap, description: 'Initializing...' },
  { key: 'PROCESSING', label: 'Processing', icon: AudioWaveform, description: 'Analyzing your track...' },
  { key: 'MASTERING', label: 'Mastering', icon: Sparkles, description: 'Applying AI mastering...' },
  { key: 'COMPLETED', label: 'Complete', icon: CheckCircle, description: 'Processing complete!' },
];

const getStageIndex = (stage?: string | null): number => {
  if (!stage) return 0;
  const normalized = stage.toUpperCase();
  const index = STAGES.findIndex(s => normalized.includes(s.key));
  return index >= 0 ? index : 1; // Default to STARTED if unknown
};

const getProgressPercent = (stage?: string | null): number => {
  const index = getStageIndex(stage);
  // Map 0-4 stages to 5-95% (reserve 100% for UI "completed" state)
  return Math.min(95, 5 + (index / (STAGES.length - 1)) * 90);
};

export const MasteringProgress = ({ status, processingStage, className }: MasteringProgressProps) => {
  const currentStageIndex = getStageIndex(processingStage);
  const currentStage = STAGES[currentStageIndex];
  const progress = getProgressPercent(processingStage);
  const CurrentIcon = currentStage?.icon || Loader2;

  const isProcessing = status === 'processing_preview' || status === 'processing_final';

  if (!isProcessing) return null;

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
      
      <div className="relative border border-primary/30 bg-secondary backdrop-blur-sm p-6 rounded-xl space-y-4 red-glow">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 rounded-xl bg-primary/20 border border-primary/30 animate-pulse-glow">
              <CurrentIcon className={cn(
                "h-6 w-6 text-primary",
                currentStage.key !== 'COMPLETED' && "animate-spin"
              )} />
            </div>
            {currentStage.key !== 'COMPLETED' && (
              <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground">
              {status === 'processing_preview' ? 'Generating Preview...' : 'Processing Full Master...'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentStage?.description || 'Processing...'}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-bold text-primary">{currentStage?.label}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {status === 'processing_preview' ? '30-second preview' : 'Full track'}
            </span>
            <span className="text-primary font-semibold">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-between px-1">
          {STAGES.slice(0, 4).map((stage, index) => {
            const isActive = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const StageIcon = stage.icon;
            
            return (
              <div 
                key={stage.key}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300",
                  isActive ? "opacity-100" : "opacity-40"
                )}
              >
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    isCurrent 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                      : isActive 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  <StageIcon className={cn(
                    "h-4 w-4",
                    isCurrent && stage.key !== 'COMPLETED' && "animate-spin"
                  )} />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Estimated time */}
        <p className="text-center text-[10px] text-muted-foreground pt-2 border-t border-border/50">
          💡 {status === 'processing_preview' ? 'Preview generation' : 'Full processing'} typically takes 30-90 seconds
        </p>
      </div>
    </div>
  );
};
