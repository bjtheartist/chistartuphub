
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_opportunities' AND column_name = 'country') THEN
    ALTER TABLE funding_opportunities ADD COLUMN country TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_opportunities' AND column_name = 'region') THEN
    ALTER TABLE funding_opportunities ADD COLUMN region TEXT;
  END IF;
END $$;
