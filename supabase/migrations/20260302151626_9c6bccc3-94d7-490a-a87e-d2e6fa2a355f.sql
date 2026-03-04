
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('siteName', 'Mindly Academy'),
  ('siteDescription', 'Онлайн сургалтын платформ'),
  ('contactEmail', 'info@mindly.mn'),
  ('contactPhone', '+976 9999 9999'),
  ('bankName', 'Хаан банк'),
  ('bankAccount', '5406163083'),
  ('bankAccountName', 'Дөлгөөн'),
  ('maintenanceMode', 'false'),
  ('allowRegistration', 'true');
