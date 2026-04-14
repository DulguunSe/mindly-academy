ALTER TABLE public.profiles ADD COLUMN phone_number text;
CREATE INDEX idx_profiles_phone ON public.profiles(phone_number);