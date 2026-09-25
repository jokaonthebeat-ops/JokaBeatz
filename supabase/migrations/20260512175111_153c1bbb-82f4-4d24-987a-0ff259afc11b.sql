
-- OAuth tokens (per admin user)
CREATE TABLE public.youtube_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  channel_id TEXT,
  channel_title TEXT,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.youtube_oauth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage youtube tokens" ON public.youtube_oauth_tokens FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER youtube_oauth_tokens_updated BEFORE UPDATE ON public.youtube_oauth_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Upload log
CREATE TABLE public.youtube_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  beat_name TEXT NOT NULL,
  genre TEXT,
  type_artist TEXT,
  bpm INTEGER,
  music_key TEXT,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  youtube_video_id TEXT,
  youtube_url TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.youtube_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage youtube uploads" ON public.youtube_uploads FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER youtube_uploads_updated BEFORE UPDATE ON public.youtube_uploads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Genres
CREATE TABLE public.youtube_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.youtube_genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage youtube genres" ON public.youtube_genres FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Type artists
CREATE TABLE public.youtube_type_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(genre, artist_name)
);
ALTER TABLE public.youtube_type_artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage youtube type artists" ON public.youtube_type_artists FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed genres
INSERT INTO public.youtube_genres (name, display_order) VALUES
  ('Trap', 1), ('Hip Hop', 2), ('R&B', 3), ('Afrobeat', 4),
  ('Drill', 5), ('Old School', 6), ('Lo-Fi', 7);

-- Seed artists
INSERT INTO public.youtube_type_artists (genre, artist_name, display_order) VALUES
  ('Trap', 'Lil Baby', 1), ('Trap', 'Future', 2), ('Trap', 'Gunna', 3), ('Trap', '21 Savage', 4), ('Trap', 'Travis Scott', 5), ('Trap', 'Young Thug', 6),
  ('Hip Hop', 'Drake', 1), ('Hip Hop', 'J. Cole', 2), ('Hip Hop', 'Kendrick Lamar', 3), ('Hip Hop', 'Joey Bada$$', 4), ('Hip Hop', 'Cordae', 5),
  ('R&B', 'Bryson Tiller', 1), ('R&B', 'PartyNextDoor', 2), ('R&B', 'Brent Faiyaz', 3), ('R&B', 'The Weeknd', 4), ('R&B', 'Summer Walker', 5),
  ('Afrobeat', 'Burna Boy', 1), ('Afrobeat', 'Wizkid', 2), ('Afrobeat', 'Davido', 3), ('Afrobeat', 'Rema', 4), ('Afrobeat', 'Tems', 5),
  ('Drill', 'Pop Smoke', 1), ('Drill', 'Central Cee', 2), ('Drill', 'Fivio Foreign', 3), ('Drill', 'Headie One', 4),
  ('Old School', 'Nas', 1), ('Old School', 'Wu-Tang', 2), ('Old School', '90s Boom Bap', 3),
  ('Lo-Fi', 'Joji', 1), ('Lo-Fi', 'Powfu', 2), ('Lo-Fi', 'Mac Miller', 3);
