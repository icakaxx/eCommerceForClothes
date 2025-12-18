-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    customerid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT NOT NULL,
    telephone TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Bulgaria',
    city TEXT NOT NULL,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Add unique constraint on email to prevent duplicates
    CONSTRAINT customers_email_unique UNIQUE (email)
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- Create index on name for search
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(firstname, lastname);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_customers_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON public.customers
    FOR EACH ROW 
    EXECUTE FUNCTION update_customers_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (service role)
CREATE POLICY "Service role can do anything on customers" ON public.customers
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for authenticated users (read-only)
CREATE POLICY "Authenticated users can read customers" ON public.customers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON public.customers TO service_role;
GRANT SELECT ON public.customers TO authenticated;

