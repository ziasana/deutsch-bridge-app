export type BlogPostStatus = "DRAFT" | "PUBLISHED";

/** Card-sized view of a published post (home page, /blog index, related posts). */
export interface BlogPostSummary {
    slug: string;
    title: string;
    excerpt: string;
    category: string | null;
    authorName: string | null;
    imageUrl: string | null;
    publishedAt: string | null;
    readingMinutes: number;
}

export interface BlogPostDetail extends BlogPostSummary {
    content: string;
    related: BlogPostSummary[];
}

export interface BlogPostPage {
    posts: BlogPostSummary[];
    page: number;
    totalPages: number;
    totalElements: number;
}

export interface BlogPostAdminRow {
    id: string;
    slug: string;
    title: string;
    category: string | null;
    authorName: string | null;
    imageUrl: string | null;
    status: BlogPostStatus;
    showOnHome: boolean;
    publishedAt: string | null;
    updatedAt: string;
}

export interface BlogPostAdmin {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    category: string | null;
    authorName: string | null;
    imageUrl: string | null;
    status: BlogPostStatus;
    showOnHome: boolean;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface BlogPostRequest {
    title: string;
    excerpt: string | null;
    content: string;
    category: string | null;
    authorName: string | null;
    imageUrl: string | null;
    status: BlogPostStatus;
    showOnHome: boolean;
}
