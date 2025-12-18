-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
    discountid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL CHECK (value > 0),
    isactive BOOLEAN DEFAULT true,
    expiresat TIMESTAMP WITH TIME ZONE,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_percentage CHECK (
        (type = 'percentage' AND value <= 100) OR
        (type = 'fixed' AND value > 0)
    ),
    CONSTRAINT valid_expiry CHECK (expiresat IS NULL OR expiresat > NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(isactive) WHERE isactive = true;
CREATE INDEX IF NOT EXISTS idx_discounts_expires_at ON discounts(expiresat) WHERE expiresat IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (service role)
CREATE POLICY "Service role can do anything" ON discounts
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for authenticated users (read-only for active discounts)
CREATE POLICY "Authenticated users can read active discounts" ON discounts
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        isactive = true AND
        (expiresat IS NULL OR expiresat > NOW())
    );

-- Grant necessary permissions
GRANT ALL ON discounts TO service_role;
GRANT SELECT ON discounts TO authenticated;
