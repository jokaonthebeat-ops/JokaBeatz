// Mastering types for Tonn AI Mastering API integration
// Based on official Tonn API documentation: https://roex.stoplight.io/docs/tonn-api

export type MusicalStyle = 
  | 'ROCK_INDIE' | 'POP' | 'ACOUSTIC' | 'HIPHOP_GRIME' 
  | 'ELECTRONIC' | 'REGGAE_DUB' | 'ORCHESTRAL' | 'METAL' | 'OTHER';

// Tonn API only supports LOW, MEDIUM, HIGH (no MAX)
export type LoudnessLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// Sample rates only apply to final master retrieval
export type SampleRate = '44100' | '48000';

export type MasteringServiceType = 'mastering' | 'batch_mastering' | 'mix_enhance' | 'mix_analysis' | 'audio_cleanup';

// Tonn API valid soundSource enum values for audio-cleanup
export type InstrumentType = 
  | 'VOCAL_GROUP' 
  | 'BACKING_VOCALS_GROUP' 
  | 'KICK_GROUP' 
  | 'SNARE_GROUP' 
  | 'PERCS_GROUP' 
  | 'STRINGS_GROUP' 
  | 'E_GUITAR_GROUP' 
  | 'ACOUSTIC_GUITAR_GROUP';

export type EnhancementType = 'ENHANCE';

// Settings for preview (no sampleRate - only used for final)
export interface MasteringPreviewSettings {
  musicalStyle: MusicalStyle;
  desiredLoudness: LoudnessLevel;
}

// Full settings including sampleRate for final retrieval
export interface MasteringSettings extends MasteringPreviewSettings {
  sampleRate: SampleRate;
}

// Settings for Mix Enhance
export interface MixEnhanceSettings {
  musicalStyle: MusicalStyle;
  enhancementType: EnhancementType;
}

// Settings for Mix Analysis
export interface MixAnalysisSettings {
  musicalStyle: MusicalStyle;
  desiredLoudness: LoudnessLevel;
}

// Settings for Audio Cleanup
export interface AudioCleanupSettings {
  soundSource: InstrumentType;
}

// Mix Analysis report result from Tonn API
export interface AnalysisResult {
  loudness?: {
    integrated?: number;
    truePeak?: number;
    range?: number;
  };
  eq?: {
    recommendations?: string[];
    lowEnd?: string;
    midRange?: string;
    highEnd?: string;
  };
  clipping?: {
    detected?: boolean;
    percentage?: number;
  };
  stereoWidth?: {
    value?: number;
    description?: string;
  };
  overallScore?: number;
  summary?: string;
  // Raw API response fields
  [key: string]: unknown;
}

export interface MasteringService {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  service_type: MasteringServiceType;
  price_cents: number;
  sale_price_cents: number | null;
  stripe_price_id: string | null;
  features: string[];
  default_settings: MasteringSettings | MixEnhanceSettings | MixAnalysisSettings | AudioCleanupSettings;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MasteringJob {
  id: string;
  user_id: string;
  service_id: string | null;
  task_id: string | null;
  status: string;
  processing_stage: string | null;
  input_file_url: string;
  preview_file_url: string | null;
  output_file_url: string | null;
  settings: MasteringSettings | MixEnhanceSettings | MixAnalysisSettings | AudioCleanupSettings;
  error_message: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  price_cents: number | null;
  created_at: string;
  updated_at: string;
  service?: MasteringService;
}

// Tonn API exact enum values with user-friendly labels
export const MUSICAL_STYLES: { value: MusicalStyle; label: string }[] = [
  { value: 'POP', label: 'Pop' },
  { value: 'ROCK_INDIE', label: 'Rock / Indie' },
  { value: 'HIPHOP_GRIME', label: 'Hip Hop / Grime' },
  { value: 'ELECTRONIC', label: 'Electronic / EDM' },
  { value: 'ACOUSTIC', label: 'Acoustic' },
  { value: 'ORCHESTRAL', label: 'Orchestral / Classical' },
  { value: 'METAL', label: 'Metal' },
  { value: 'REGGAE_DUB', label: 'Reggae / Dub' },
  { value: 'OTHER', label: 'Other' },
];

// Tonn API only has 3 loudness levels (no MAX)
export const LOUDNESS_LEVELS: { value: LoudnessLevel; label: string; description: string }[] = [
  { value: 'LOW', label: 'Low', description: '-14 LUFS (Streaming optimized)' },
  { value: 'MEDIUM', label: 'Medium', description: '-10 LUFS (Balanced)' },
  { value: 'HIGH', label: 'High', description: '-8 LUFS (Loud & punchy)' },
];

// Sample rates only for final master (not preview)
export const SAMPLE_RATES: { value: SampleRate; label: string }[] = [
  { value: '44100', label: '44.1 kHz (16-bit)' },
  { value: '48000', label: '48 kHz (24-bit)' },
];

export const INSTRUMENT_TYPES: { value: InstrumentType; label: string }[] = [
  { value: 'VOCAL_GROUP', label: 'Vocals' },
  { value: 'BACKING_VOCALS_GROUP', label: 'Backing Vocals' },
  { value: 'KICK_GROUP', label: 'Kick Drum' },
  { value: 'SNARE_GROUP', label: 'Snare Drum' },
  { value: 'PERCS_GROUP', label: 'Percussion' },
  { value: 'STRINGS_GROUP', label: 'Strings' },
  { value: 'E_GUITAR_GROUP', label: 'Electric Guitar' },
  { value: 'ACOUSTIC_GUITAR_GROUP', label: 'Acoustic Guitar' },
];
