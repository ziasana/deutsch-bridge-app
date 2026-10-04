import api from "./api";
import { BlogPostDetail, BlogPostPage, BlogPostSummary } from "@/types/blog";

/** Public (unauthenticated) blog API - published posts only. */
export const getPublishedBlogPosts = async (page = 0, size = 9, category?: string) => {
    return await api.get<BlogPostPage>("/public/blog", { params: { page, size, category } });
};

/** Posts for the home page section: those an admin flagged "show on home", or the latest ones if none are. */
export const getHomeBlogPosts = async (size = 3) => {
    return await api.get<BlogPostSummary[]>("/public/blog/home", { params: { size } });
};

export const getBlogCategories = async () => {
    return await api.get<string[]>("/public/blog/categories");
};

export const getBlogPostBySlug = async (slug: string) => {
    return await api.get<BlogPostDetail>(`/public/blog/${encodeURIComponent(slug)}`);
};
