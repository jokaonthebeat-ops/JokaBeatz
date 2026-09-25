
-- Deactivate Professional Mixing service
UPDATE public.mastering_services SET is_active = false WHERE service_type = 'mixing';

-- Insert 3 new services
INSERT INTO public.mastering_services (name, slug, description, service_type, price_cents, features, default_settings, is_active, is_featured, display_order)
VALUES
  (
    'Mix Enhancement',
    'mix-enhancement',
    'AI-powered full mix revive. Fixes loudness, clipping, stereo width, and tonal balance issues. Free 30-second preview before you buy.',
    'mix_enhance',
    1999,
    ARRAY['AI mix revive technology', 'Fixes clipping & loudness', 'Stereo width correction', 'Tonal profile optimization', 'Free 30s preview'],
    '{"musicalStyle": "OTHER", "desiredLoudness": "MEDIUM", "sampleRate": "44100"}',
    true,
    false,
    10
  ),
  (
    'Mix Analysis',
    'mix-analysis',
    'Get an instant professional report on your mix: loudness (LUFS & peak), clipping, stereo field, tonal balance, and AI recommendations.',
    'mix_analysis',
    499,
    ARRAY['Integrated loudness (LUFS)', 'Peak & clipping detection', 'Stereo field analysis', 'Tonal profile breakdown', 'AI mix recommendations'],
    '{"musicalStyle": "OTHER", "desiredLoudness": "MEDIUM", "sampleRate": "44100"}',
    true,
    false,
    20
  ),
  (
    'Audio Cleanup',
    'audio-cleanup',
    'Remove noise, hiss, and artifacts from individual stems. Vocals, drums, guitars — any isolated stem cleaned to broadcast quality.',
    'audio_cleanup',
    299,
    ARRAY['Stem noise removal', 'Hiss & artifact cleanup', 'Supports all stem types', 'WAV & FLAC input', 'Broadcast-ready output'],
    '{"soundSource": "VOCAL_GROUP"}',
    true,
    false,
    30
  );
