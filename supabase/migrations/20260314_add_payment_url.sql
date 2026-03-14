-- Add mayar_invoice_url column to transaction tables
ALTER TABLE zakat_fitrah ADD COLUMN IF NOT EXISTS mayar_invoice_url TEXT;
ALTER TABLE zakat_mal ADD COLUMN IF NOT EXISTS mayar_invoice_url TEXT;
ALTER TABLE infaq_sedekah ADD COLUMN IF NOT EXISTS mayar_invoice_url TEXT;

-- Update comments for clarity
COMMENT ON COLUMN zakat_fitrah.mayar_invoice_url IS 'URL penagihan Mayar untuk pembayaran online';
COMMENT ON COLUMN zakat_mal.mayar_invoice_url IS 'URL penagihan Mayar untuk pembayaran online';
COMMENT ON COLUMN infaq_sedekah.mayar_invoice_url IS 'URL penagihan Mayar untuk pembayaran online';
