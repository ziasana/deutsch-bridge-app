"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { toast } from "@/lib/toast";
import {
    createBlogPost,
    deleteBlogPost,
    getAdminBlogPost,
    getAdminBlogPosts,
    updateBlogPost,
    uploadBlogImage,
} from "@/services/adminBlogService";
import type { BlogPostAdminRow, BlogPostRequest, BlogPostStatus } from "@/types/blog";
import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import ImageCropUpload from "@/componenets/admin/ImageCropUpload";
import MarkdownField from "@/componenets/admin/blog/MarkdownField";
import { formatBlogDate, getBlogImageSrc } from "@/componenets/blog/blogUtils";

const BLOG_KEY = ["admin", "blog"];
const CARD_CLASS =
    "bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6";
const FIELD_CLASS =
    "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none";
const LABEL_CLASS = "block text-gray-700 dark:text-gray-300 mb-2 text-sm";
const EXCERPT_MAX = 300;

interface BlogForm {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    authorName: string;
    imageUrl: string | null;
    status: BlogPostStatus;
    showOnHome: boolean;
}

const emptyForm: BlogForm = {
    title: "",
    excerpt: "",
    content: "",
    category: "",
    authorName: "",
    imageUrl: null,
    status: "DRAFT",
    showOnHome: false,
};

export default function AdminBlogPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { userProfile, hasHydrated } = useAuthStore();
    const isAdmin = hasHydrated && userProfile?.role === "ADMIN";

    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<BlogForm>(emptyForm);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingPost, setIsLoadingPost] = useState(false);
    const [postToDelete, setPostToDelete] = useState<BlogPostAdminRow | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (hasHydrated && userProfile?.role !== "ADMIN") router.push("/dashboard");
    }, [hasHydrated, userProfile, router]);

    const { data: posts = [], isPending, error } = useQuery({
        queryKey: [...BLOG_KEY, statusFilter, debouncedSearch],
        queryFn: () =>
            getAdminBlogPosts({ status: statusFilter || undefined, search: debouncedSearch || undefined }).then(
                (res) => res.data,
            ),
        enabled: isAdmin,
    });

    useEffect(() => {
        if (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load blog posts.");
        }
    }, [error]);

    // Existing categories offered as suggestions in the form (free text is still allowed).
    const categorySuggestions = useMemo(
        () => Array.from(new Set(posts.map((p) => p.category).filter((c): c is string => Boolean(c)))).sort(),
        [posts],
    );

    if (!isAdmin) return <Loading />;

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: BLOG_KEY });
        // Also drop the public caches in this browser so the home page / blog pages reflect the change.
        queryClient.invalidateQueries({ queryKey: ["blog"] });
    };

    const openNew = () => {
        setEditingId(null);
        setForm(emptyForm);
        setFormOpen(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditingId(null);
        setForm(emptyForm);
    };

    const startEdit = async (row: BlogPostAdminRow) => {
        setEditingId(row.id);
        setFormOpen(true);
        setIsLoadingPost(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        try {
            const { data: post } = await getAdminBlogPost(row.id);
            setForm({
                title: post.title,
                excerpt: post.excerpt ?? "",
                content: post.content,
                category: post.category ?? "",
                authorName: post.authorName ?? "",
                imageUrl: post.imageUrl,
                status: post.status,
                showOnHome: post.showOnHome,
            });
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e?.response?.data?.message ?? "Failed to load the post.");
            closeForm();
        } finally {
            setIsLoadingPost(false);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return toast.error("Title is required.");
        if (!form.content.trim()) return toast.error("Content is required.");

        const payload: BlogPostRequest = {
            title: form.title.trim(),
            excerpt: form.excerpt.trim() || null,
            content: form.content,
            category: form.category.trim() || null,
            authorName: form.authorName.trim() || null,
            imageUrl: form.imageUrl,
            status: form.status,
            showOnHome: form.showOnHome,
        };

        setIsSaving(true);
        (editingId ? updateBlogPost(editingId, payload) : createBlogPost(payload))
            .then(() => {
                toast.success(editingId ? "Post updated." : "Post created.");
                closeForm();
                invalidate();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save the post."))
            .finally(() => setIsSaving(false));
    };

    const confirmDelete = () => {
        const post = postToDelete;
        if (!post) return;
        setPostToDelete(null);
        deleteBlogPost(post.id)
            .then(() => {
                toast.success("Post deleted.");
                if (editingId === post.id) closeForm();
                invalidate();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to delete the post."));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Blog</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Write and publish the articles shown on the home page and the public blog.
                        </p>
                    </div>
                    {!formOpen && (
                        <Button variant="primary" onClick={openNew} className="flex items-center gap-2 px-4 py-3">
                            <Plus className="size-4" />
                            New post
                        </Button>
                    )}
                </div>

                {formOpen && (
                    <form onSubmit={submit} className={`${CARD_CLASS} mt-8 space-y-5`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {editingId ? "Edit post" : "New post"}
                            </h2>
                            <button type="button" onClick={closeForm} className="text-sm underline text-gray-500 dark:text-gray-400">
                                Cancel
                            </button>
                        </div>

                        {isLoadingPost ? (
                            <p className="py-10 text-center text-gray-500 dark:text-gray-400">Loading post…</p>
                        ) : (
                            <>
                                <div>
                                    <label className={LABEL_CLASS}>Title</label>
                                    <Input
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        placeholder="e.g. 5 Common Mistakes German Learners Make"
                                        maxLength={255}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <label className={LABEL_CLASS}>Category</label>
                                        <input
                                            list="blog-category-options"
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            placeholder="e.g. Grammar"
                                            maxLength={100}
                                            className={FIELD_CLASS}
                                        />
                                        <datalist id="blog-category-options">
                                            {categorySuggestions.map((c) => (
                                                <option key={c} value={c} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Author</label>
                                        <input
                                            value={form.authorName}
                                            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                                            placeholder="Shown on the post (default: DeutschBridge)"
                                            maxLength={100}
                                            className={FIELD_CLASS}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Status</label>
                                        <select
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value as BlogPostStatus })}
                                            className={FIELD_CLASS}
                                        >
                                            <option value="DRAFT">Draft — only visible here</option>
                                            <option value="PUBLISHED">Published — visible to everyone</option>
                                        </select>
                                    </div>
                                </div>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.showOnHome}
                                        onChange={(e) => setForm({ ...form, showOnHome: e.target.checked })}
                                        className="mt-1 size-4 accent-blue-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Show on the home page</span>
                                        <span className="block text-gray-500 dark:text-gray-400">
                                            The home page shows the 3 newest published posts with this ticked. If none are ticked, it
                                            shows the 3 latest posts. Drafts are never shown.
                                        </span>
                                    </span>
                                </label>

                                <div>
                                    <label className={LABEL_CLASS}>Cover image (16:9)</label>
                                    <ImageCropUpload
                                        previewSrc={getBlogImageSrc(form.imageUrl)}
                                        hasImage={Boolean(form.imageUrl)}
                                        aspectRatio={16 / 9}
                                        onUpload={uploadBlogImage}
                                        onUploaded={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                                        onRemove={() => setForm((f) => ({ ...f, imageUrl: null }))}
                                        previewClassName="w-40 h-[90px] object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                                    />
                                </div>

                                <div>
                                    <label className={LABEL_CLASS}>
                                        Excerpt{" "}
                                        <span className="text-gray-400">
                                            (optional teaser for cards — {form.excerpt.length}/{EXCERPT_MAX}; generated from the content when empty)
                                        </span>
                                    </label>
                                    <textarea
                                        value={form.excerpt}
                                        onChange={(e) => setForm({ ...form, excerpt: e.target.value.slice(0, EXCERPT_MAX) })}
                                        rows={2}
                                        className={FIELD_CLASS}
                                    />
                                </div>

                                <div>
                                    <label className={LABEL_CLASS}>Content</label>
                                    <MarkdownField value={form.content} onChange={(content) => setForm({ ...form, content })} />
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button variant="primary" type="submit" disabled={isSaving} className="px-5 py-3">
                                        {isSaving ? "Saving..." : editingId ? "Save changes" : "Create post"}
                                    </Button>
                                    <Button variant="secondary" type="button" onClick={closeForm} className="px-5 py-3">
                                        Cancel
                                    </Button>
                                </div>
                            </>
                        )}
                    </form>
                )}

                <div className={`${CARD_CLASS} mt-8`}>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All posts</h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">All statuses</option>
                                <option value="PUBLISHED">Published</option>
                                <option value="DRAFT">Draft</option>
                            </select>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search title or category…"
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                                <tr>
                                    <th className="px-4 py-2 font-semibold">Post</th>
                                    <th className="px-4 py-2 font-semibold">Category</th>
                                    <th className="px-4 py-2 font-semibold">Status</th>
                                    <th className="px-4 py-2 font-semibold">Published</th>
                                    <th className="px-4 py-2 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {posts.map((post) => {
                                    const image = getBlogImageSrc(post.imageUrl);
                                    return (
                                        <tr key={post.id}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {image ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={image} alt="" className="h-10 w-[72px] shrink-0 rounded-md object-cover" />
                                                    ) : (
                                                        <div className="h-10 w-[72px] shrink-0 rounded-md bg-gray-200 dark:bg-gray-700" />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
                                                        <code className="text-xs text-gray-500 dark:text-gray-400">/{post.slug}</code>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{post.category ?? "—"}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                                                        {post.status === "PUBLISHED" ? "Published" : "Draft"}
                                                    </Badge>
                                                    {post.showOnHome && <Badge variant="outline">Home</Badge>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                {post.publishedAt ? formatBlogDate(post.publishedAt, "en") : "—"}
                                            </td>
                                            <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                                                {post.status === "PUBLISHED" && (
                                                    <Link
                                                        href={`/blog/post?slug=${encodeURIComponent(post.slug)}`}
                                                        target="_blank"
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-lg border border-border text-foreground hover:bg-accent"
                                                    >
                                                        View <ExternalLink className="size-3.5" />
                                                    </Link>
                                                )}
                                                <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => startEdit(post)}>
                                                    Edit
                                                </Button>
                                                <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => setPostToDelete(post)}>
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!isPending && posts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                                            {statusFilter || debouncedSearch
                                                ? "No posts match your filters."
                                                : "No posts yet — create your first one."}
                                        </td>
                                    </tr>
                                )}
                                {isPending && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                                            Loading…
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={Boolean(postToDelete)}
                title="Delete this post?"
                message={`Delete "${postToDelete?.title}"? This also removes its cover image and cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setPostToDelete(null)}
            />
        </div>
    );
}
