-- YegnaFinder ops: business listing approval (interim, no admin UI)
-- Run against the app Postgres database. Replace :placeholders before executing.

-- ---------------------------------------------------------------------------
-- One-time schema (safe if TypeORM synchronize already added the columns)
-- ---------------------------------------------------------------------------
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS listing_status varchar(20) NOT NULL DEFAULT 'pending';

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS listing_submitted_at timestamp NULL;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS listing_reviewed_at timestamp NULL;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS listing_reviewed_by_id uuid NULL;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS listing_rejection_reason text NULL;

ALTER TABLE business_gallery
  ADD COLUMN IF NOT EXISTS storage_key varchar(500) NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_listing_status
  ON businesses (listing_status);

CREATE INDEX IF NOT EXISTS idx_businesses_is_public
  ON businesses (is_public);

-- Existing rows: keep unpublished until an admin approves them.
UPDATE businesses
SET listing_status = COALESCE(listing_status, 'pending'),
    is_public = COALESCE(is_public, false)
WHERE deleted_at IS NULL
  AND listing_status IS DISTINCT FROM 'approved';

-- ---------------------------------------------------------------------------
-- Queue: listings waiting for review
-- ---------------------------------------------------------------------------
SELECT
  id,
  user_id,
  business_name,
  contact_email,
  contact_phone,
  listing_status,
  is_public,
  is_profile_complete,
  listing_submitted_at,
  created_at
FROM businesses
WHERE deleted_at IS NULL
  AND listing_status = 'pending'
ORDER BY listing_submitted_at NULLS LAST, created_at ASC;

-- ---------------------------------------------------------------------------
-- Inspect one listing
-- ---------------------------------------------------------------------------
-- SELECT * FROM businesses WHERE id = ':business_id';

-- ---------------------------------------------------------------------------
-- Approve (listing becomes public)
-- ---------------------------------------------------------------------------
-- UPDATE businesses
-- SET listing_status = 'approved',
--     is_public = true,
--     listing_reviewed_at = NOW(),
--     listing_reviewed_by_id = ':admin_user_id',
--     listing_rejection_reason = NULL,
--     updated_at = NOW()
-- WHERE id = ':business_id'
--   AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Reject (stays off the public catalog)
-- ---------------------------------------------------------------------------
-- UPDATE businesses
-- SET listing_status = 'rejected',
--     is_public = false,
--     listing_reviewed_at = NOW(),
--     listing_reviewed_by_id = ':admin_user_id',
--     listing_rejection_reason = ':reason',
--     updated_at = NOW()
-- WHERE id = ':business_id'
--   AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Unpublish a previously approved listing
-- ---------------------------------------------------------------------------
-- UPDATE businesses
-- SET listing_status = 'rejected',
--     is_public = false,
--     listing_reviewed_at = NOW(),
--     listing_reviewed_by_id = ':admin_user_id',
--     listing_rejection_reason = 'Unpublished by ops',
--     updated_at = NOW()
-- WHERE id = ':business_id'
--   AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Public catalog check (what customers will see)
-- ---------------------------------------------------------------------------
SELECT id, business_name, listing_status, is_public
FROM businesses
WHERE deleted_at IS NULL
  AND is_public = true
  AND listing_status = 'approved'
ORDER BY created_at DESC;
