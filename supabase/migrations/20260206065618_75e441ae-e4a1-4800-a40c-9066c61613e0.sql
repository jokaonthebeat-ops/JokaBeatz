-- Delete the combined Album/EP service if it exists
DELETE FROM mastering_services WHERE slug = 'album-ep-batch-mastering';

-- Insert EP Batch Mastering service at $50
INSERT INTO mastering_services (name, slug, description, service_type, price_cents, features, is_active, is_featured, display_order)
VALUES (
  'EP Batch Mastering',
  'ep-batch-mastering',
  'Master your entire EP (2-6 tracks) with consistent sound and loudness across all songs.',
  'batch_mastering',
  5000,
  ARRAY['2-6 tracks', 'Consistent sound across EP', 'Album-level loudness matching', 'Multiple genre presets', 'Professional quality output'],
  true,
  false,
  3
);

-- Insert Album Batch Mastering service at $100
INSERT INTO mastering_services (name, slug, description, service_type, price_cents, features, is_active, is_featured, display_order)
VALUES (
  'Album Batch Mastering',
  'album-batch-mastering',
  'Master your full album (7-20 tracks) with consistent sound and loudness across all songs.',
  'batch_mastering',
  10000,
  ARRAY['7-20 tracks', 'Consistent sound across album', 'Album-level loudness matching', 'Multiple genre presets', 'Professional quality output'],
  true,
  false,
  4
);