-- Bound the internal barcode sequence to the 9-digit EAN-13 body (prefix 200 + 9 digits).
-- NO CYCLE ensures exhaustion raises 2200H instead of silently reusing codes.
ALTER SEQUENCE "internal_barcode_seq" MAXVALUE 999999999 NO CYCLE;