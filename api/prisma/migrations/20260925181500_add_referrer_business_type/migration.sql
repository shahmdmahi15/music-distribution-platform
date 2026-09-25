-- Step 1: Add REFERRER if not already present, and update any existing 'OTHER' records
DO $$
BEGIN
  -- Check if REFERRER already exists in WhiteLabelBusinessType
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
    WHERE pg_type.typname = 'WhiteLabelBusinessType' AND pg_enum.enumlabel = 'REFERRER'
  ) THEN
    ALTER TYPE "WhiteLabelBusinessType" ADD VALUE 'REFERRER';
  END IF;
END $$;

-- Step 2: Migrate any existing records with 'OTHER' to 'REFERRER'
UPDATE "WhiteLabel"
SET "businessType" = 'REFERRER'
WHERE "businessType"::text = 'OTHER';

-- Step 3: Recreate enum without 'OTHER'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
    WHERE pg_type.typname = 'WhiteLabelBusinessType' AND pg_enum.enumlabel = 'OTHER'
  ) THEN
    CREATE TYPE "WhiteLabelBusinessType_new" AS ENUM ('RECORD_LABEL', 'DISTRIBUTOR_AGGREGATOR', 'MUSIC_PUBLISHER', 'REFERRER');
    
    ALTER TABLE "WhiteLabel" ALTER COLUMN "businessType" DROP DEFAULT;
    
    ALTER TABLE "WhiteLabel" ALTER COLUMN "businessType" TYPE "WhiteLabelBusinessType_new" 
      USING (
        CASE 
          WHEN "businessType"::text = 'OTHER' THEN 'REFERRER'::"WhiteLabelBusinessType_new"
          ELSE "businessType"::text::"WhiteLabelBusinessType_new"
        END
      );
      
    ALTER TABLE "WhiteLabel" ALTER COLUMN "businessType" SET DEFAULT 'RECORD_LABEL'::"WhiteLabelBusinessType_new";
    
    DROP TYPE "WhiteLabelBusinessType";
    
    ALTER TYPE "WhiteLabelBusinessType_new" RENAME TO "WhiteLabelBusinessType";
  END IF;
END $$;
