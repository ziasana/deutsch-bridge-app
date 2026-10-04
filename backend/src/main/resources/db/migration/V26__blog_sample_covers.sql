-- Switch the two starter posts that had a test-uploaded cover over to the bundled illustrations
-- (frontend/public/blog-covers), matching the other starter posts. One-time; later uploads are untouched.
UPDATE blog_posts SET image_url = '/blog-covers/telc-b1-exam-strategies.svg' WHERE slug = 'telc-b1-exam-strategies';
UPDATE blog_posts SET image_url = '/blog-covers/how-to-learn-german-effectively.svg' WHERE slug = 'how-to-learn-german-effectively';
