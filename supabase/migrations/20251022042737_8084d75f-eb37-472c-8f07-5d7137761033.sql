-- Add address fields to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS apt text,
ADD COLUMN IF NOT EXISTS room_no text;