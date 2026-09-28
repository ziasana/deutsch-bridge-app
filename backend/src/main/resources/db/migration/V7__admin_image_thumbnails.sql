-- Reading articles and expressions now store a separately-cropped thumbnail image alongside their
-- main (hero/banner) image, instead of deriving a thumbnail by resizing the same crop - see
-- FileStorageService/WebpEncoder. Nullable: existing rows keep using their imageUrl as a fallback
-- until an admin re-saves them with a dedicated thumbnail crop.
ALTER TABLE reading_articles ADD COLUMN thumbnail_url TEXT;
ALTER TABLE expressions ADD COLUMN thumbnail_url TEXT;
