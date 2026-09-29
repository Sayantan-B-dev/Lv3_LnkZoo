-- Associate tool output with its creator so logged-in users can list and
-- destroy their own short links / temp files / shared texts from their profile.
-- Guests leave user_id NULL and are never listed.
--
-- ON DELETE SET NULL (not CASCADE) so a deleted user never orphans a
-- Cloudinary asset: the temp_files row survives and its normal expiry path
-- still destroys the upload.

ALTER TABLE temp_files
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE shared_texts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_temp_files_user_id   ON temp_files(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_texts_user_id ON shared_texts(user_id);

-- shortened_links.user_id already exists (init.sql, ON DELETE SET NULL);
-- this index keeps the profile lookup off a sequential scan.
CREATE INDEX IF NOT EXISTS idx_shortened_links_user_id ON shortened_links(user_id);
