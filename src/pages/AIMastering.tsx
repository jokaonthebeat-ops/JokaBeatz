import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MasteringProgress } from '@/components/mastering/MasteringProgress';
import { AudioComparison } from '@/components/mastering/AudioComparison';
import BatchTrackUpload from '@/components/mastering/BatchTrackUpload';
import ShareButtons from '@/components/free-beats/ShareButtons';
import { getPageShareContent } from '@/lib/shareContent';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { ServiceSchema } from '@/components/seo/ProductSchema';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import {
  Upload, Wand2, Music, Sparkles, Download, CheckCircle, Loader2,
  AlertCircle, CreditCard, Zap, Shield, Headphones, Sliders, Clock,
  XCircle, BarChart3, Scissors, TrendingUp, Layers, Trash2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveServices } from '@/hooks/useMasteringServices';
import {
  useMasteringJobs, useCreateJob, useMasteringPreview, useMasteringCheckout,
  useMasteringDownload, useMasteringVerifyPayment, usePollPreview, usePollFinalMaster,
  useMixEnhancePreview, usePollMixEnhance, usePollMixEnhanceFinal, useMixAnalysis, useAudioCleanup,
} from '@/hooks/useMasteringJobs';
import {
  MasteringService, MasteringServiceType,
  MUSICAL_STYLES, LOUDNESS_LEVELS, SAMPLE_RATES, INSTRUMENT_TYPES,
  MusicalStyle, LoudnessLevel, SampleRate, InstrumentType, AnalysisResult,
} from '@/types/mastering';
import { toast } from 'sonner';
import { uploadMasteringInputToStorage, uploadMultipleStemsToStorage } from '@/lib/masteringStorage';

interface TrackFile {
  id: string;
  file: File;
  name: string;
  size: number;
  trackNumber: number;
}

// Service icon map — includes batch_mastering for Joka Beatz
const SERVICE_ICONS: Record<string, React.ElementType> = {
  mastering: Wand2,
  batch_mastering: Layers,
  mix_enhance: Sparkles,
  mix_analysis: BarChart3,
  audio_cleanup: Scissors,
};

const AIMastering = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: services, isLoading: servicesLoading } = useActiveServices();
  const { data: jobs, refetch: refetchJobs } = useMasteringJobs(user?.id);

  // Job mutations
  const createJob = useCreateJob();
  const startPreview = useMasteringPreview();
  const pollPreview = usePollPreview();
  const startCheckout = useMasteringCheckout();
  const verifyPayment = useMasteringVerifyPayment();
  const pollFinalMaster = usePollFinalMaster();
  const downloadResult = useMasteringDownload();
  const mixEnhancePreview = useMixEnhancePreview();
  const pollMixEnhance = usePollMixEnhance();
  const pollMixEnhanceFinal = usePollMixEnhanceFinal();
  const mixAnalysis = useMixAnalysis();
  const audioCleanup = useAudioCleanup();

  // UI state
  const [selectedService, setSelectedService] = useState<MasteringService | null>(null);

  // Dynamic settings per service type
  const [musicalStyle, setMusicalStyle] = useState<MusicalStyle>('OTHER');
  const [desiredLoudness, setDesiredLoudness] = useState<LoudnessLevel>('MEDIUM');
  const [sampleRate, setSampleRate] = useState<SampleRate>('44100');
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('VOCAL_GROUP');

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [batchTracks, setBatchTracks] = useState<TrackFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [inputFileUrl, setInputFileUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('idle');
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const serviceType: MasteringServiceType = (selectedService?.service_type as MasteringServiceType) || 'mastering';
  const isBatchMastering = serviceType === 'batch_mastering';

  // Check for Stripe success redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const jobId = searchParams.get('job_id');

    if (success === 'true' && jobId) {
      setCurrentJobId(jobId);
      setJobStatus('verifying_payment');

      const verifyAndPoll = async () => {
        try {
          const verifyResult = await verifyPayment.mutateAsync({ job_id: jobId });
          if (!verifyResult.success) {
            toast.error(verifyResult.error || 'Payment verification failed');
            setJobStatus('failed');
            return;
          }

          // Detect service type from the job record
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: jobData } = await supabase
            .from('mastering_jobs')
            .select('*, service:mastering_services(*)')
            .eq('id', jobId)
            .single();

          const svcType = (jobData?.service as { service_type?: string })?.service_type as MasteringServiceType || 'mastering';

          if (svcType === 'mix_analysis') {
            toast.success('Payment verified! Analyzing your mix...');
            setJobStatus('processing_preview');
            setProcessingStage('ANALYZING');
            // Poll DB until analysis completes
            const pollInterval = setInterval(async () => {
              const { data: updated } = await supabase
                .from('mastering_jobs')
                .select('status, settings')
                .eq('id', jobId)
                .single();
              if (updated?.status === 'completed') {
                clearInterval(pollInterval);
                const settings = updated.settings as Record<string, unknown>;
                const analysisData = settings?.analysisResult as Record<string, unknown> | undefined;
                const payload = (analysisData?.mixDiagnosisResults as Record<string, unknown>)?.payload as AnalysisResult | undefined;
                setAnalysisResult(payload || analysisData as AnalysisResult || null);
                setJobStatus('completed');
                setProcessingStage(null);
                refetchJobs();
                toast.success('Mix analysis complete!');
              } else if (updated?.status === 'failed') {
                clearInterval(pollInterval);
                setJobStatus('failed');
                setProcessingStage(null);
                toast.error('Analysis failed. Please contact support.');
              }
            }, 3000);
            setTimeout(() => {
              clearInterval(pollInterval);
            }, 180000);
          } else if (svcType === 'audio_cleanup') {
            toast.success('Payment confirmed! Processing your audio...');
            setJobStatus('processing_preview');
            setProcessingStage('CLEANING');
            const { data: jobData2 } = await supabase.from('mastering_jobs').select('input_file_url, settings').eq('id', jobId).single();
            if (jobData2) {
              await audioCleanup.mutateAsync({
                job_id: jobId,
                file_url: jobData2.input_file_url,
                settings: jobData2.settings as { soundSource: InstrumentType },
              });
            }
            startAudioCleanupPolling(jobId);
          } else {
            toast.success('Payment verified! Processing your full track...');
            setJobStatus('processing_final');
            startFinalPolling(jobId, svcType);
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          toast.error('Failed to verify payment. Please contact support.');
          setJobStatus('failed');
        }
      };
      verifyAndPoll();
    }
    if (searchParams.get('canceled') === 'true') {
      toast.error('Payment was canceled.');
    }
  }, []);

  // Auto-select featured/first service
  useEffect(() => {
    if (services && services.length > 0 && !selectedService) {
      const featured = services.find(s => s.is_featured) || services[0];
      setSelectedService(featured);
    }
  }, [services]);

  const startFinalPolling = (jobId: string, svcType: MasteringServiceType) => {
    const pollFn = svcType === 'mix_enhance' ? pollMixEnhanceFinal : pollFinalMaster;

    const pollInterval = setInterval(async () => {
      try {
        const result = await pollFn.mutateAsync({ job_id: jobId });
        if (result.stage) setProcessingStage(result.stage);
        if (result.status === 'completed' && result.download_url) {
          setOutputUrl(result.download_url);
          setJobStatus('completed');
          setProcessingStage(null);
          clearInterval(pollInterval);
          clearTimeout(timeout);
          refetchJobs();
          toast.success('Your track is ready to download!');
        }
      } catch (error) {
        console.log('Polling final...', error);
      }
    }, 3000);
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setJobStatus('failed');
      toast.error('Processing timed out. Please contact support.');
    }, 180000);
  };

  const handleFileSelect = useCallback((file: File) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-wav'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload an MP3, WAV, or FLAC file');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size must be under 100MB');
      return;
    }
    setUploadedFile(file);
    setInputFileUrl(null);
    setPreviewUrl(null);
    setOutputUrl(null);
    setAnalysisResult(null);
    setJobStatus('idle');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const getSettings = () => {
    switch (serviceType) {
      case 'mastering':
      case 'batch_mastering':
        return { musicalStyle, desiredLoudness, sampleRate };
      case 'mix_enhance':
        return { musicalStyle, enhancementType: 'ENHANCE' as const };
      case 'mix_analysis':
        return { musicalStyle, desiredLoudness };
      case 'audio_cleanup':
        return { soundSource: instrumentType };
    }
  };

  const handleProcess = async () => {
    if (isBatchMastering) {
      if (batchTracks.length < 2) { toast.error('Please upload at least 2 tracks for batch mastering'); return; }
    } else {
      if (!uploadedFile) { toast.error('Please select an audio file'); return; }
    }
    if (!selectedService) { toast.error('Please select a service'); return; }
    if (!user) { toast.error('Please sign in'); navigate('/login'); return; }

    try {
      setIsUploading(true);
      setJobStatus('uploading');
      setUploadProgress(10);

      let uploadedInputUrl: string;
      let uploadedInputUrls: string[] = [];

      if (isBatchMastering) {
        const files = batchTracks.map(t => t.file);
        const { publicUrls } = await uploadMultipleStemsToStorage({ files, userId: user.id });
        uploadedInputUrls = publicUrls;
        uploadedInputUrl = publicUrls[0];
        setInputFileUrl(uploadedInputUrl);
      } else {
        const { publicUrl } = await uploadMasteringInputToStorage({ file: uploadedFile!, userId: user.id });
        uploadedInputUrl = publicUrl;
        setInputFileUrl(publicUrl);
      }

      setUploadProgress(60);

      const job = await createJob.mutateAsync({
        user_id: user.id,
        service_id: selectedService.id,
        settings: getSettings() as Record<string, unknown>,
        input_file_url: uploadedInputUrl,
      });
      setCurrentJobId(job.id);
      setUploadProgress(80);
      setIsUploading(false);

      // Route to correct flow
      if (serviceType === 'mastering' || serviceType === 'batch_mastering') {
        await startPreview.mutateAsync({
          job_id: job.id,
          file_url: isBatchMastering ? undefined : uploadedInputUrl,
          file_urls: isBatchMastering ? uploadedInputUrls : undefined,
          settings: { musicalStyle, desiredLoudness },
          service_type: serviceType,
        });
        setUploadProgress(100);
        setJobStatus('processing_preview');
        startPreviewPolling(job.id);

      } else if (serviceType === 'mix_enhance') {
        await mixEnhancePreview.mutateAsync({ job_id: job.id, file_url: uploadedInputUrl, settings: { musicalStyle } });
        setUploadProgress(100);
        setJobStatus('processing_preview');
        startMixEnhancePolling(job.id);

      } else if (serviceType === 'mix_analysis') {
        setUploadProgress(100);
        setJobStatus('pending_payment');
        const { url } = await startCheckout.mutateAsync({ job_id: job.id });
        if (url) window.location.href = url;

      } else if (serviceType === 'audio_cleanup') {
        setUploadProgress(100);
        setJobStatus('pending_payment');
        const { url } = await startCheckout.mutateAsync({ job_id: job.id });
        if (url) window.location.href = url;
      }

    } catch (error) {
      console.error('Process error:', error);
      toast.error('Failed to process file');
      setIsUploading(false);
      setJobStatus('failed');
    }
  };

  const startPreviewPolling = (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const result = await pollPreview.mutateAsync({ job_id: jobId });
        if (result.stage) setProcessingStage(result.stage);
        if (result.status === 'completed' && result.preview_url) {
          setPreviewUrl(result.preview_url);
          setJobStatus('pending_payment');
          setProcessingStage(null);
          clearInterval(pollInterval);
          clearTimeout(timeout);
          refetchJobs();
          toast.success('Preview ready! Listen before purchasing.');
        }
      } catch (error) { console.log('Polling preview...', error); }
    }, 3000);
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setJobStatus('failed');
      setProcessingStage(null);
      toast.error('Preview generation timed out.');
    }, 300000); // 5 min for batch
  };

  const startMixEnhancePolling = (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const result = await pollMixEnhance.mutateAsync({ job_id: jobId });
        if (result.stage) setProcessingStage(result.stage);
        if (result.status === 'preview_ready' && result.preview_url) {
          setPreviewUrl(result.preview_url);
          setJobStatus('pending_payment');
          setProcessingStage(null);
          clearInterval(pollInterval);
          clearTimeout(timeout);
          refetchJobs();
          toast.success('Enhancement preview ready!');
        }
      } catch (error) { console.log('Polling mix enhance...', error); }
    }, 3000);
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setJobStatus('failed');
      setProcessingStage(null);
      toast.error('Preview timed out.');
    }, 180000);
  };

  const startAudioCleanupPolling = (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { supabase: sb } = await import('@/integrations/supabase/client');
        const { data } = await sb.from('mastering_jobs').select('status, output_file_url, processing_stage').eq('id', jobId).single();
        if (data?.processing_stage) setProcessingStage(data.processing_stage);
        if (data?.status === 'completed' && data?.output_file_url) {
          setOutputUrl(data.output_file_url);
          setJobStatus('completed');
          setProcessingStage(null);
          clearInterval(pollInterval);
          clearTimeout(timeout);
          refetchJobs();
          toast.success('Your cleaned audio is ready to download!');
        } else if (data?.status === 'failed') {
          clearInterval(pollInterval);
          clearTimeout(timeout);
          setJobStatus('failed');
          setProcessingStage(null);
          toast.error('Audio cleanup failed. Please try again.');
        }
      } catch (error) { console.log('Polling audio cleanup...', error); }
    }, 3000);
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setJobStatus('failed');
      setProcessingStage(null);
      toast.error('Processing timed out.');
    }, 180000);
  };

  const handlePurchase = async () => {
    if (!currentJobId) return;
    try {
      const { url } = await startCheckout.mutateAsync({ job_id: currentJobId });
      if (url) window.location.href = url;
    } catch (error) { console.error('Checkout error:', error); }
  };

  const handleDownload = (url: string) => window.open(url, '_blank');
  const formatFileSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const handleCancelJob = async (jobId: string) => {
    try {
      const { supabase: sb } = await import('@/integrations/supabase/client');
      await sb.from('mastering_jobs').update({ status: 'cancelled' }).eq('id', jobId);
      toast.success('Job cancelled');
      refetchJobs();
    } catch { toast.error('Failed to cancel job'); }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    try {
      const { supabase: sb } = await import('@/integrations/supabase/client');
      await sb.from('mastering_jobs').delete().eq('id', jobId);
      toast.success('Job deleted');
      refetchJobs();
    } catch { toast.error('Failed to delete job'); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'pending_payment': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><CreditCard className="w-3 h-3 mr-1" />Awaiting Payment</Badge>;
      case 'processing_preview': case 'processing_final': return <Badge className="bg-primary/10 text-primary border-primary/20"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case 'failed': return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getButtonLabel = () => {
    switch (serviceType) {
      case 'mastering': return 'Generate Free Preview';
      case 'batch_mastering': return 'Generate Batch Preview';
      case 'mix_enhance': return 'Generate Enhancement Preview';
      case 'mix_analysis': return `Pay & Analyze My Mix — ${formatPrice(selectedService?.sale_price_cents || selectedService?.price_cents || 499)}`;
      case 'audio_cleanup': return `Pay & Clean My Stem — ${formatPrice(selectedService?.sale_price_cents || selectedService?.price_cents || 299)}`;
    }
  };

  const getButtonIcon = () => {
    const Icon = SERVICE_ICONS[serviceType] || Wand2;
    return <Icon className="w-5 h-5 mr-2" />;
  };

  const isPaidUpfront = serviceType === 'mix_analysis' || serviceType === 'audio_cleanup';
  const isDisabled = !user || isUploading || !selectedService || servicesLoading ||
    (isBatchMastering ? batchTracks.length < 2 : !uploadedFile);

  const features = [
    { icon: Zap, title: "AI-Powered", description: "Industry-leading AI audio technology" },
    { icon: Headphones, title: "Free Preview", description: "Listen to 30s before you buy" },
    { icon: Shield, title: "Pro Quality", description: "Broadcast-ready results every time" },
  ];

  const faqItems = [
    { question: "What file formats do you accept?", answer: "We accept WAV and MP3 files. For best results, upload a high-quality WAV file (24-bit, 44.1 kHz or higher) with at least -6 dB of headroom. Avoid uploading already-mastered tracks." },
    { question: "Can I preview the master before paying?", answer: "Yes! Our AI Mastering and Mix Enhancement services offer a free 30-second preview so you can hear the difference before committing to a purchase. You only pay if you love the result." },
    { question: "How long does mastering take?", answer: "AI mastering typically completes within 1–5 minutes. Batch mastering for EPs and albums may take slightly longer depending on the number of tracks, but is usually done within 10–15 minutes." },
    { question: "What's the difference between Mastering and Mix Enhancement?", answer: "Mastering optimizes your already-mixed track for loudness, clarity, and streaming platforms. Mix Enhancement also improves the overall balance and depth of your mix before mastering — ideal if your mix isn't quite right." },
    { question: "What loudness level should I choose?", answer: "Low (-14 LUFS) is optimized for streaming platforms like Spotify and Apple Music. Medium (-10 LUFS) is a balanced choice for most releases. High (-8 LUFS) is loud and punchy — great for club tracks, hip-hop, and EDM." },
    { question: "Do I retain ownership of my music?", answer: "Absolutely. You retain 100% ownership of your music. We do not claim any rights to tracks processed through our platform." },
    { question: "What is Mix Analysis?", answer: "Mix Analysis uses AI to evaluate your track and give you a detailed report on loudness, EQ balance, stereo width, and clipping. It's a great way to identify issues in your mix before spending money on mastering." },
    { question: "What is Audio Cleanup?", answer: "Audio Cleanup is designed for individual stems or isolated tracks (vocals, guitars, drums, etc.). It removes noise, artifacts, and unwanted frequencies to give you a cleaner sound." },
    { question: "Is my payment secure?", answer: "Yes. All payments are processed securely through Stripe. We never store your card details." },
  ];

  return (
    <Layout path="/ai-mastering">
      <FAQSchema faqs={faqItems} />
      <ServiceSchema
        name="AI Audio Mastering"
        description="Professional AI-powered mastering for your tracks — loudness targeting for streaming, mix analysis and audio cleanup, delivered fast."
        serviceType="Audio Mastering"
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://jokabeatz.com/" },
          { name: "AI Mastering", url: "https://jokabeatz.com/ai-mastering" },
        ]}
      />
      <main className="pt-20 pb-16 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-[10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-orbit" />
          <div className="absolute top-40 right-[15%] w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-orbit-reverse" />
          <div className="absolute bottom-40 left-[20%] w-72 h-72 bg-primary/8 rounded-full blur-3xl animate-morph" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 md:py-16 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 red-glow">
            <Wand2 className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-bold text-primary uppercase tracking-wider">AI Audio Suite</span>
          </div>

          <h1 className="font-black text-4xl md:text-5xl lg:text-6xl mb-4 text-foreground">
            Professional <span className="text-primary">AI Audio</span> Services
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Master, enhance, analyze, and clean your tracks with cutting-edge AI. Free previews on select services.
          </p>

          {/* Share Buttons */}
          <div className="flex justify-center mb-10">
            <ShareButtons
              title="AI Audio Services | Joka Beatz"
              path="/ai-mastering"
              caption={getPageShareContent("ai-mastering").caption}
              hashtags={getPageShareContent("ai-mastering").hashtags}
            />
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((feature, i) => (
              <div key={i} className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-secondary border border-border card-lift">
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors animate-pulse-glow">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Main Content */}
        <section className="container max-w-6xl mx-auto px-4 py-8 relative z-10">

          {/* Service Selector Cards */}
          {servicesLoading ? (
            <div className="flex justify-center mb-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
              {services?.map((service) => {
                const sType = service.service_type as MasteringServiceType;
                const Icon = SERVICE_ICONS[sType] || Wand2;
                const isSelected = selectedService?.id === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setJobStatus('idle');
                      setUploadedFile(null);
                      setBatchTracks([]);
                      setPreviewUrl(null);
                      setOutputUrl(null);
                      setAnalysisResult(null);
                      setInputFileUrl(null);
                    }}
                    className={`relative p-4 rounded-xl border text-left transition-all group ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10 red-glow'
                        : 'bg-card border-border hover:border-primary/40 hover:bg-secondary/30'
                    }`}
                  >
                    {service.is_featured && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                        FEATURED
                      </div>
                    )}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-foreground leading-tight mb-1">{service.name}</div>
                    <div className="text-base font-black text-primary">{formatPrice(service.sale_price_cents || service.price_cents)}</div>
                    <div className="text-[11px] text-muted-foreground mt-1 leading-tight">
                      {(sType === 'mastering' || sType === 'batch_mastering') && 'Free preview'}
                      {sType === 'mix_enhance' && 'Free preview'}
                      {sType === 'mix_analysis' && 'Instant report'}
                      {sType === 'audio_cleanup' && 'Pay & process'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Main Workflow */}
            <div className="lg:col-span-2 space-y-6">

              {/* Step 1: Upload */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                  <h2 className="text-lg font-bold">
                    {serviceType === 'mastering' && 'Upload Your Track'}
                    {serviceType === 'batch_mastering' && 'Upload Your Tracks (EP / Album)'}
                    {serviceType === 'mix_enhance' && 'Upload Your Mix'}
                    {serviceType === 'mix_analysis' && 'Upload Your Mix'}
                    {serviceType === 'audio_cleanup' && 'Upload Your Stem'}
                  </h2>
                </div>

                {isBatchMastering ? (
                  <BatchTrackUpload
                    tracks={batchTracks}
                    onTracksChange={setBatchTracks}
                    minTracks={selectedService?.slug?.includes('album') ? 7 : 2}
                    maxTracks={selectedService?.slug?.includes('album') ? 20 : 6}
                    serviceType={selectedService?.slug?.includes('album') ? 'album' : 'ep'}
                  />
                ) : !uploadedFile ? (
                  <div
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                      isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                  >
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold text-foreground mb-1">
                      {serviceType === 'mastering' && 'Drop your track here'}
                      {serviceType === 'mix_enhance' && 'Drop your full mix here'}
                      {serviceType === 'mix_analysis' && 'Drop your mix here'}
                      {serviceType === 'audio_cleanup' && 'Drop your stem here'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {serviceType === 'audio_cleanup'
                        ? 'Isolated stem (vocals, guitar, drums, etc.) • WAV or FLAC only • Max 100MB'
                        : 'MP3, WAV, or FLAC • Max 100MB'}
                    </p>
                    <Button variant="outline" size="sm">Browse Files</Button>
                    <input ref={fileInputRef} type="file"
                      accept={serviceType === 'audio_cleanup' ? '.wav,.flac,audio/wav,audio/flac' : '.mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac'}
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl border border-border">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Music className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
                    </div>
                    <Button variant="ghost" size="sm"
                      onClick={() => { setUploadedFile(null); setJobStatus('idle'); }}
                      disabled={isUploading || jobStatus === 'processing_preview'}>
                      Change
                    </Button>
                  </div>
                )}
              </div>

              {/* Step 2: Dynamic Settings */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                  <h2 className="text-lg font-bold">
                    {serviceType === 'audio_cleanup' ? 'Cleanup Settings' : 'Processing Settings'}
                  </h2>
                  <Sliders className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Mastering & Batch Settings */}
                {(serviceType === 'mastering' || serviceType === 'batch_mastering') && (
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Musical Style</Label>
                      <Select value={musicalStyle} onValueChange={(v) => setMusicalStyle(v as MusicalStyle)} disabled={isUploading || jobStatus !== 'idle'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{MUSICAL_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Loudness</Label>
                      <Select value={desiredLoudness} onValueChange={(v) => setDesiredLoudness(v as LoudnessLevel)} disabled={isUploading || jobStatus !== 'idle'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {LOUDNESS_LEVELS.map(l => (
                            <SelectItem key={l.value} value={l.value}>
                              <div><div>{l.label}</div><div className="text-xs text-muted-foreground">{l.description}</div></div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Sample Rate <span className="text-xs text-muted-foreground">(final only)</span></Label>
                      <Select value={sampleRate} onValueChange={(v) => setSampleRate(v as SampleRate)} disabled={isUploading || jobStatus !== 'idle'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{SAMPLE_RATES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Mix Enhance Settings */}
                {serviceType === 'mix_enhance' && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Musical Style</Label>
                      <Select value={musicalStyle} onValueChange={(v) => setMusicalStyle(v as MusicalStyle)} disabled={isUploading || jobStatus !== 'idle'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{MUSICAL_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Enhancement Mode</Label>
                      <div className="flex items-center gap-2 h-10 px-3 bg-secondary/50 rounded-lg border border-border text-sm">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-foreground font-medium">Full Enhancement</span>
                        <Badge className="ml-auto text-[10px]">ENHANCE</Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mix Analysis Settings */}
                {serviceType === 'mix_analysis' && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Musical Style</Label>
                      <Select value={musicalStyle} onValueChange={(v) => setMusicalStyle(v as MusicalStyle)} disabled={isUploading || jobStatus !== 'idle'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{MUSICAL_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Helps the AI benchmark your mix against genre standards</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
                      <BarChart3 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">What you'll receive</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Loudness (LUFS & peak), frequency balance, stereo width, clipping detection, and actionable mix recommendations.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio Cleanup Settings */}
                {serviceType === 'audio_cleanup' && (
                  <div className="max-w-xs space-y-2">
                    <Label className="text-sm font-medium">Instrument / Stem Type</Label>
                    <Select value={instrumentType} onValueChange={(v) => setInstrumentType(v as InstrumentType)} disabled={isUploading || jobStatus !== 'idle'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{INSTRUMENT_TYPES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Upload the specific stem you want cleaned</p>
                  </div>
                )}
              </div>

              {/* Processing Progress */}
              <MasteringProgress status={jobStatus} processingStage={processingStage} />

              {/* Verifying Payment */}
              {jobStatus === 'verifying_payment' && (
                <div className="bg-card border border-primary/30 rounded-xl p-6 text-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-1">Verifying Payment...</h3>
                  <p className="text-sm text-muted-foreground">Confirming your payment with Stripe</p>
                </div>
              )}

              {/* Uploading progress */}
              {isUploading && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="font-medium">Uploading and submitting...</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Audio Comparison — mastering/batch_mastering/mix_enhance preview */}
              {previewUrl && inputFileUrl && (jobStatus === 'pending_payment' || jobStatus === 'completed') && (serviceType === 'mastering' || serviceType === 'batch_mastering' || serviceType === 'mix_enhance') && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                    <h2 className="text-lg font-bold">
                      {serviceType === 'mix_enhance' ? 'Compare Original vs Enhanced' : 'Compare Original vs Mastered'}
                    </h2>
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <AudioComparison
                    originalUrl={inputFileUrl}
                    masteredUrl={previewUrl}
                    masteredLabel={serviceType === 'mix_enhance' ? 'Enhanced' : 'Mastered'}
                  />
                </div>
              )}

              {/* Mix Analysis Report */}
              {jobStatus === 'completed' && analysisResult && serviceType === 'mix_analysis' && (() => {
                const r = analysisResult as Record<string, unknown>;
                const loudnessLufs = r.integrated_loudness_lufs as number | undefined;
                const peakDb = r.peak_loudness_dbfs as number | undefined;
                const clipping = r.clipping as string | undefined;
                const stereoField = r.stereo_field as string | undefined;
                const monoCompatible = r.mono_compatible as boolean | undefined;
                const phaseIssues = r.phase_issues as boolean | undefined;
                const tonal = r.tonal_profile as Record<string, string> | undefined;
                const summary = (r.summary as Record<string, string> | undefined);
                const summaryText = summary?.summary as string | undefined;
                const ifMixLoudness = r.if_mix_loudness as string | undefined;
                const ifMixDrc = r.if_mix_drc as string | undefined;
                const bitDepth = r.bit_depth as number | undefined;
                const sRate = r.sample_rate as number | undefined;
                const clippingColor = clipping === 'NONE' ? 'text-green-500' : clipping === 'MINOR' ? 'text-amber-500' : 'text-destructive';
                const loudnessColor = ifMixLoudness === 'OPTIMAL' ? 'text-green-500' : 'text-amber-500';
                return (
                  <div className="bg-card border border-green-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <h2 className="text-lg font-bold">Mix Analysis Report</h2>
                      <Badge className="ml-auto bg-green-500/10 text-green-500 border-green-500/20">Complete</Badge>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-secondary/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-sm">Loudness</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {loudnessLufs !== undefined && (
                            <div className="bg-background/50 rounded-lg p-3 text-center">
                              <p className="text-muted-foreground text-xs mb-1">Integrated</p>
                              <p className="font-black text-lg">{loudnessLufs.toFixed(1)}</p>
                              <p className="text-xs text-muted-foreground">LUFS</p>
                            </div>
                          )}
                          {peakDb !== undefined && (
                            <div className="bg-background/50 rounded-lg p-3 text-center">
                              <p className="text-muted-foreground text-xs mb-1">Peak</p>
                              <p className="font-black text-lg">{peakDb.toFixed(1)}</p>
                              <p className="text-xs text-muted-foreground">dBFS</p>
                            </div>
                          )}
                          {bitDepth !== undefined && (
                            <div className="bg-background/50 rounded-lg p-3 text-center">
                              <p className="text-muted-foreground text-xs mb-1">Bit Depth</p>
                              <p className="font-black text-lg">{bitDepth}</p>
                              <p className="text-xs text-muted-foreground">bit</p>
                            </div>
                          )}
                          {sRate !== undefined && (
                            <div className="bg-background/50 rounded-lg p-3 text-center">
                              <p className="text-muted-foreground text-xs mb-1">Sample Rate</p>
                              <p className="font-black text-lg">{(sRate / 1000).toFixed(1)}</p>
                              <p className="text-xs text-muted-foreground">kHz</p>
                            </div>
                          )}
                        </div>
                        {ifMixLoudness && ifMixLoudness !== 'OPTIMAL' && (
                          <p className={`text-xs mt-2 font-medium ${loudnessColor}`}>
                            ⚡ Loudness: {ifMixLoudness === 'LESS' ? 'Too loud — reduce master fader before mastering' : 'Could be louder'}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {clipping && (
                          <div className="bg-secondary/50 rounded-lg p-3">
                            <p className="text-muted-foreground text-xs mb-1">Clipping</p>
                            <p className={`font-bold text-sm ${clippingColor}`}>
                              {clipping === 'NONE' ? '✓ None' : clipping === 'MINOR' ? '⚠ Minor' : '✗ Severe'}
                            </p>
                          </div>
                        )}
                        {stereoField && (
                          <div className="bg-secondary/50 rounded-lg p-3">
                            <p className="text-muted-foreground text-xs mb-1">Stereo Field</p>
                            <p className="font-bold text-sm capitalize">{stereoField.replace(/_/g, ' ').toLowerCase()}</p>
                          </div>
                        )}
                        {monoCompatible !== undefined && (
                          <div className="bg-secondary/50 rounded-lg p-3">
                            <p className="text-muted-foreground text-xs mb-1">Mono Compatible</p>
                            <p className={`font-bold text-sm ${monoCompatible ? 'text-green-500' : 'text-amber-500'}`}>
                              {monoCompatible ? '✓ Yes' : '⚠ No'}
                            </p>
                          </div>
                        )}
                        {phaseIssues !== undefined && (
                          <div className="bg-secondary/50 rounded-lg p-3">
                            <p className="text-muted-foreground text-xs mb-1">Phase Issues</p>
                            <p className={`font-bold text-sm ${phaseIssues ? 'text-destructive' : 'text-green-500'}`}>
                              {phaseIssues ? '⚠ Detected' : '✓ None'}
                            </p>
                          </div>
                        )}
                        {ifMixDrc && (
                          <div className="bg-secondary/50 rounded-lg p-3">
                            <p className="text-muted-foreground text-xs mb-1">Dynamic Range</p>
                            <p className="font-bold text-sm capitalize">{ifMixDrc.toLowerCase()}</p>
                          </div>
                        )}
                      </div>
                      {tonal && (
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Sliders className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-sm">Tonal Profile</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries(tonal).map(([key, val]) => (
                              <div key={key} className="text-center">
                                <p className="text-muted-foreground text-xs mb-1 capitalize">{key.replace(/_frequency$/, '').replace(/_/g, ' ')}</p>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${val === 'HIGH' ? 'bg-primary/20 text-primary' : val === 'LOW' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-foreground'}`}>
                                  {val}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {summaryText && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">AI Recommendations</p>
                          <p className="text-sm text-foreground leading-relaxed">{summaryText}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Cleanup Complete */}
              {jobStatus === 'completed' && outputUrl && serviceType === 'audio_cleanup' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                  <Scissors className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-bold text-xl mb-1">Audio Cleanup Complete!</h3>
                  <p className="text-sm text-muted-foreground mb-4">Your cleaned audio file is ready</p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white font-bold" size="lg" onClick={() => handleDownload(outputUrl)}>
                    <Download className="w-5 h-5 mr-2" />Download Cleaned Audio
                  </Button>
                </div>
              )}

              {/* Mastering / Batch / Enhance Complete */}
              {jobStatus === 'completed' && outputUrl && (serviceType === 'mastering' || serviceType === 'batch_mastering' || serviceType === 'mix_enhance') && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-bold text-xl mb-1">
                    {serviceType === 'mix_enhance' ? 'Enhancement Complete!' : 'Your Master is Ready!'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">Download your professionally processed track</p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white font-bold" size="lg" onClick={() => handleDownload(outputUrl)}>
                    <Download className="w-5 h-5 mr-2" />Download Track
                  </Button>
                </div>
              )}

              {/* CTA: Purchase pending */}
              {jobStatus === 'pending_payment' && selectedService && (
                <div className="bg-card border border-primary/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Ready to Purchase Full Track</h3>
                      <p className="text-sm text-muted-foreground">Like what you hear? Unlock the full version.</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-primary">{formatPrice(selectedService.sale_price_cents || selectedService.price_cents)}</div>
                      <div className="text-xs text-muted-foreground">one-time</div>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 red-glow red-glow-hover" size="lg" onClick={handlePurchase} disabled={startCheckout.isPending}>
                    {startCheckout.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CreditCard className="w-5 h-5 mr-2" />}
                    Purchase Full {serviceType === 'mix_enhance' ? 'Enhanced Track' : 'Master'}
                  </Button>
                </div>
              )}

              {/* Main Process Button */}
              {jobStatus === 'idle' && (
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 red-glow red-glow-hover"
                  size="lg"
                  onClick={handleProcess}
                  disabled={isDisabled}
                >
                  {getButtonIcon()}
                  {getButtonLabel()}
                </Button>
              )}

              {/* Failed state */}
              {jobStatus === 'failed' && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-1">Processing Failed</h3>
                  <p className="text-sm text-muted-foreground mb-4">Something went wrong. Please try again.</p>
                  <Button variant="outline" onClick={() => { setJobStatus('idle'); setUploadedFile(null); setBatchTracks([]); }}>Try Again</Button>
                </div>
              )}

              {/* Sign in prompt */}
              {!user && (
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <Music className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-1">Sign In to Use AI Audio Tools</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create a free account to get started</p>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground red-glow" onClick={() => navigate('/login')}>Sign In / Sign Up</Button>
                </div>
              )}
            </div>

            {/* Right: Service Info */}
            <div className="space-y-6">
              {selectedService && (
                <div className="bg-card border border-primary/30 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      {(() => { const Icon = SERVICE_ICONS[serviceType] || Wand2; return <Icon className="w-5 h-5 text-primary" />; })()}
                      <h3 className="font-bold text-lg">{selectedService.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{selectedService.description}</p>
                    <div className="mb-4">
                      <div className="text-3xl font-black text-primary">{formatPrice(selectedService.sale_price_cents || selectedService.price_cents)}</div>
                      {selectedService.sale_price_cents && (
                        <div className="text-sm text-muted-foreground line-through">{formatPrice(selectedService.price_cents)}</div>
                      )}
                      <div className="text-xs text-muted-foreground">{isBatchMastering ? 'flat rate for all tracks • one-time payment' : 'per track • one-time payment'}</div>
                    </div>
                    <ul className="space-y-2">
                      {selectedService.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* How It Works — varies per service */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-bold mb-4">How It Works</h3>
                <div className="space-y-4">
                  {(serviceType === 'mastering' || serviceType === 'batch_mastering') && [
                    { step: '1', title: serviceType === 'batch_mastering' ? 'Upload Your Tracks' : 'Upload Your Track', desc: serviceType === 'batch_mastering' ? 'EP (2-6) or Album (7-20) tracks' : 'MP3, WAV, or FLAC up to 100MB' },
                    { step: '2', title: 'Choose Settings', desc: 'Pick your genre and loudness' },
                    { step: '3', title: 'Free Preview', desc: 'Hear it mastered in 1-2 minutes' },
                    { step: '4', title: 'Pay & Download', desc: 'Love it? Buy the full master' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{item.step}</div>
                      <div><p className="font-medium text-sm text-foreground">{item.title}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                    </div>
                  ))}
                  {serviceType === 'mix_enhance' && [
                    { step: '1', title: 'Upload Your Mix', desc: 'Any audio format up to 100MB' },
                    { step: '2', title: 'Select Style', desc: 'AI adapts to your genre' },
                    { step: '3', title: 'Free Preview', desc: 'Hear 30s of enhancement' },
                    { step: '4', title: 'Pay & Download', desc: 'Unlock the full enhanced track' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{item.step}</div>
                      <div><p className="font-medium text-sm text-foreground">{item.title}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                    </div>
                  ))}
                  {serviceType === 'mix_analysis' && [
                    { step: '1', title: 'Upload Your Mix', desc: 'Any audio format up to 100MB' },
                    { step: '2', title: 'Set Target', desc: 'Choose style and loudness target' },
                    { step: '3', title: 'Get Instant Report', desc: 'EQ, loudness, clipping, width' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{item.step}</div>
                      <div><p className="font-medium text-sm text-foreground">{item.title}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                    </div>
                  ))}
                  {serviceType === 'audio_cleanup' && [
                    { step: '1', title: 'Upload Your Stem', desc: 'Vocals, drums, bass, or other' },
                    { step: '2', title: 'Select Stem Type', desc: 'Tell AI what it is processing' },
                    { step: '3', title: 'Pay & Process', desc: 'No preview — immediate cleanup' },
                    { step: '4', title: 'Download Clean', desc: 'Noise-free professional audio' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{item.step}</div>
                      <div><p className="font-medium text-sm text-foreground">{item.title}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust signals */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Secure payments via Stripe</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Results in 1-5 minutes</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Headphones className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Professional broadcast quality</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Free preview — pay only if you love it</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-black text-foreground mb-2 text-center">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-center mb-8 text-sm">Everything you need to know about our AI mastering services.</p>
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
        </section>

        {/* Previous Jobs */}
        {user && jobs && jobs.length > 0 && (
          <section className="container mx-auto px-4 pb-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-bold mb-4">Your Previous Jobs</h2>
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Music className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{job.input_file_url.split('/').pop()?.split('?')[0]}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(job.created_at).toLocaleDateString()}
                        {job.service && <span>• {job.service.name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {getStatusBadge(job.status)}
                      {job.output_file_url && (
                        <Button variant="outline" size="sm" onClick={() => handleDownload(job.output_file_url!)}>
                          <Download className="w-4 h-4 mr-1" />Download
                        </Button>
                      )}
                      {job.status === 'pending_payment' && (
                        <Button size="sm" onClick={() => {
                          setCurrentJobId(job.id);
                          setJobStatus('pending_payment');
                          if (job.preview_file_url) setPreviewUrl(job.preview_file_url);
                          if (job.input_file_url) setInputFileUrl(job.input_file_url);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}>Resume &amp; Purchase</Button>
                      )}
                      {job.status === 'processing_preview' && (
                        <Button variant="outline" size="sm" onClick={() => {
                          setCurrentJobId(job.id);
                          setJobStatus('processing_preview');
                          if (job.input_file_url) setInputFileUrl(job.input_file_url);
                          const svcType = (job.service?.service_type as MasteringServiceType) || 'mastering';
                          if (svcType === 'audio_cleanup') {
                            startAudioCleanupPolling(job.id);
                          } else if (svcType === 'mix_enhance') {
                            startMixEnhancePolling(job.id);
                          } else {
                            startPreviewPolling(job.id);
                          }
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}>
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Resume Monitoring
                        </Button>
                      )}
                      {['uploading', 'processing_preview', 'processing_final', 'pending_payment'].includes(job.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                          onClick={() => handleCancelJob(job.id)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />Cancel
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
};

export default AIMastering;
