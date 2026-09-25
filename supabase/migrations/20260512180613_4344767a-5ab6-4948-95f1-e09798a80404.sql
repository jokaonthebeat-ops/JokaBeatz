UPDATE public.youtube_type_artists SET genre = 'West Coast' WHERE genre = 'Old School';
UPDATE public.youtube_genres SET name = 'West Coast' WHERE name = 'Old School';
DELETE FROM public.youtube_type_artists WHERE genre = 'West Coast';
INSERT INTO public.youtube_type_artists (genre, artist_name, display_order) VALUES
  ('West Coast', 'Mozzy', 1),
  ('West Coast', 'Nipsey Hussle', 2),
  ('West Coast', 'YG', 3),
  ('West Coast', 'Kendrick Lamar', 4),
  ('West Coast', 'Dr. Dre', 5),
  ('West Coast', 'Snoop Dogg', 6),
  ('West Coast', 'The Game', 7);