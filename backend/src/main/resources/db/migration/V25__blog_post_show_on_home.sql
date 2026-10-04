-- Lets an admin pick which published posts appear in the home page's blog section.
ALTER TABLE blog_posts ADD COLUMN show_on_home BOOLEAN NOT NULL DEFAULT FALSE;
