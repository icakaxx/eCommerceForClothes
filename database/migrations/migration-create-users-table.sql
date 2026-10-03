-- Create users table for authentication
-- Separate from customers table

CREATE TABLE IF NOT EXISTS public.users (
  userid uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  password text NOT NULL,
  locationtext text,
  locationcoordinates text,
  addressinstructions text,
  reset_token text,
  reset_token_expiry timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (userid)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_reset_token_idx ON public.users(reset_token) WHERE reset_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'User authentication table - separate from customers table';
COMMENT ON COLUMN public.users.userid IS 'Primary key - UUID';
COMMENT ON COLUMN public.users.email IS 'Unique email address for login';
COMMENT ON COLUMN public.users.password IS 'Bcrypt hashed password';
COMMENT ON COLUMN public.users.reset_token IS 'Password reset token';
COMMENT ON COLUMN public.users.reset_token_expiry IS 'Password reset token expiration time';
