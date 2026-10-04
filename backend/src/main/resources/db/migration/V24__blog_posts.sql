-- Admin-managed blog posts shown on the public home page (latest three) and the /blog pages.
-- Content is Markdown. Only PUBLISHED posts are exposed by the unauthenticated public API; the
-- slug is generated once from the title on create and stays stable afterwards so shared links keep working.
CREATE TABLE blog_posts (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    category VARCHAR(100),
    author_name VARCHAR(100),
    image_url TEXT,
    status VARCHAR(20) NOT NULL,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_blog_posts_status_published_at ON blog_posts (status, published_at DESC);
