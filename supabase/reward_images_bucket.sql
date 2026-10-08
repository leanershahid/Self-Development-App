-- Public storage bucket for reward images
INSERT INTO storage.buckets (id, name, public)
VALUES ('reward-images', 'reward-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view reward images" ON storage.objects
  FOR SELECT USING (bucket_id = 'reward-images');

CREATE POLICY "Anyone can upload reward images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reward-images');
