-- Create table for bank transactions
CREATE TABLE public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date TEXT,
  source TEXT NOT NULL CHECK (source IN ('bank', 'other')),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Unique constraint to prevent duplicate transactions
  UNIQUE(description, amount, date, source)
);

-- Create table for tenant information
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pays_as TEXT NOT NULL UNIQUE,
  expected_rent DECIMAL(10, 2) NOT NULL,
  email TEXT,
  phone TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for reconciliation results
CREATE TABLE public.reconciliation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  pays_as TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  expected_rent DECIMAL(10, 2) NOT NULL,
  actual_amount DECIMAL(10, 2) NOT NULL,
  difference DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('match', 'mismatch', 'missing')),
  reconciliation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (making tables public readable/writable for now since no auth is implemented)
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_results ENABLE ROW LEVEL SECURITY;

-- Public access policies (no authentication required)
CREATE POLICY "Allow all operations on bank_transactions" 
  ON public.bank_transactions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tenants" 
  ON public.tenants FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on reconciliation_results" 
  ON public.reconciliation_results FOR ALL USING (true) WITH CHECK (true);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to tenants table
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();