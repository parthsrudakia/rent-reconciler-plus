-- Add address fields to reconciliation_results table
ALTER TABLE public.reconciliation_results 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS apt text,
ADD COLUMN IF NOT EXISTS room_no text;