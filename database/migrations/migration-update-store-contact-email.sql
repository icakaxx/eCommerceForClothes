-- Update public contact email shown on the site (footer, checkout, etc.)
-- Run in Supabase SQL editor. Env CONTACT_EMAIL still overrides on API responses.

UPDATE public.store_settings
SET email = 'poruchki@modabox.eu',
    updatedat = NOW()
WHERE email IS NULL
   OR email ILIKE '%websiteprovisioning%'
   OR email ILIKE '%gmail.com%';
