import api from "./api";
import { BlogPostAdmin, BlogPostAdminRow, BlogPostRequest } from "@/types/blog";

export interface BlogPostFilters {
    status?: string;
    search?: string;
}

export const getAdminBlogPosts = async (filters: BlogPostFilters = {}) => {
    return await api.get<BlogPostAdminRow[]>("/admin/blog", { params: filters });
};

export const getAdminBlogPost = async (id: string) => {
    return await api.get<BlogPostAdmin>(`/admin/blog/${id}`);
};

export const uploadBlogImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return await api.post<{ url: string }>("/admin/blog/upload-image", formData, {
        headers: { "Content-Type": undefined },
    });
};

export const createBlogPost = async (request: BlogPostRequest) => {
    return await api.post<BlogPostAdmin>("/admin/blog", request);
};

export const updateBlogPost = async (id: string, request: BlogPostRequest) => {
    return await api.put<BlogPostAdmin>(`/admin/blog/${id}`, request);
};

export const deleteBlogPost = async (id: string) => {
    return await api.delete(`/admin/blog/${id}`);
};
