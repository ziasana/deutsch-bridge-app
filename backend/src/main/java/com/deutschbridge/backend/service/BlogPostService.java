package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.BlogPostAdminRow;
import com.deutschbridge.backend.model.dto.BlogPostDetailResponse;
import com.deutschbridge.backend.model.dto.BlogPostPageResponse;
import com.deutschbridge.backend.model.dto.BlogPostRequest;
import com.deutschbridge.backend.model.dto.BlogPostResponse;
import com.deutschbridge.backend.model.dto.BlogPostSummaryResponse;
import com.deutschbridge.backend.model.entity.BlogPost;
import com.deutschbridge.backend.model.enums.BlogPostStatus;
import com.deutschbridge.backend.repository.BlogPostRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class BlogPostService {

    private static final String NOT_FOUND_MSG = "Blog post not found!";
    private static final int MAX_SLUG_LENGTH = 80;
    /** Public API sub-paths that must not be shadowed by a post slug. */
    private static final java.util.Set<String> RESERVED_SLUGS = java.util.Set.of("home", "categories");
    private static final int MAX_PAGE_SIZE = 24;
    private static final int RELATED_COUNT = 3;
    private static final int EXCERPT_FALLBACK_LENGTH = 160;
    private static final int WORDS_PER_MINUTE = 200;

    private final BlogPostRepository blogPostRepository;
    private final FileStorageService fileStorageService;

    public BlogPostService(BlogPostRepository blogPostRepository, FileStorageService fileStorageService) {
        this.blogPostRepository = blogPostRepository;
        this.fileStorageService = fileStorageService;
    }

    // ---- Admin ----

    public List<BlogPostAdminRow> findAdminRows(String status, String search) {
        BlogPostStatus parsedStatus = status == null || status.isBlank() ? null : parseStatus(status);
        String needle = search == null || search.isBlank() ? null : search.trim().toLowerCase(Locale.ROOT);
        // Filtered in memory rather than in JPQL: a nullable search parameter inside lower(...) makes
        // PostgreSQL fail with "function lower(bytea) does not exist", and the table is small.
        return blogPostRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(p -> parsedStatus == null || p.getStatus() == parsedStatus)
                .filter(p -> needle == null
                        || p.getTitle().toLowerCase(Locale.ROOT).contains(needle)
                        || (p.getCategory() != null && p.getCategory().toLowerCase(Locale.ROOT).contains(needle)))
                .map(p -> new BlogPostAdminRow(p.getId(), p.getSlug(), p.getTitle(), p.getCategory(), p.getAuthorName(),
                        p.getImageUrl(), p.getStatus().name(), p.isShowOnHome(), p.getPublishedAt(), p.getUpdatedAt()))
                .toList();
    }

    public BlogPostResponse findByIdForAdmin(String id) throws DataNotFoundException {
        return toAdminResponse(find(id));
    }

    @Transactional
    public BlogPostResponse create(BlogPostRequest request) {
        BlogPost post = new BlogPost();
        apply(post, request);
        post.setSlug(uniqueSlug(post.getTitle()));
        return toAdminResponse(blogPostRepository.save(post));
    }

    @Transactional
    public BlogPostResponse update(String id, BlogPostRequest request) throws DataNotFoundException {
        BlogPost post = find(id);
        String oldImageUrl = post.getImageUrl();
        apply(post, request);
        BlogPost saved = blogPostRepository.save(post);
        if (oldImageUrl != null && !oldImageUrl.equals(saved.getImageUrl())) {
            fileStorageService.deleteFile(oldImageUrl);
        }
        return toAdminResponse(saved);
    }

    @Transactional
    public void delete(String id) throws DataNotFoundException {
        BlogPost post = find(id);
        blogPostRepository.delete(post);
        fileStorageService.deleteFile(post.getImageUrl());
    }

    // ---- Public (published posts only) ----

    public BlogPostPageResponse findPublished(int page, int size, String category) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "publishedAt"));
        Page<BlogPost> result = category == null || category.isBlank()
                ? blogPostRepository.findByStatus(BlogPostStatus.PUBLISHED, pageable)
                : blogPostRepository.findByStatusAndCategoryIgnoreCase(BlogPostStatus.PUBLISHED, category.trim(), pageable);
        return new BlogPostPageResponse(result.map(this::toSummary).getContent(), result.getNumber(),
                result.getTotalPages(), result.getTotalElements());
    }

    /** Home page section: the newest posts an admin flagged "show on home", or just the latest posts if none are flagged. */
    public List<BlogPostSummaryResponse> findForHome(int size) {
        PageRequest limit = PageRequest.of(0, Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        List<BlogPost> featured = blogPostRepository.findByStatusAndShowOnHomeTrueOrderByPublishedAtDesc(BlogPostStatus.PUBLISHED, limit);
        if (featured.isEmpty()) {
            featured = blogPostRepository.findByStatus(BlogPostStatus.PUBLISHED,
                    PageRequest.of(0, limit.getPageSize(), Sort.by(Sort.Direction.DESC, "publishedAt"))).getContent();
        }
        return featured.stream().map(this::toSummary).toList();
    }

    public List<String> findPublishedCategories() {
        return blogPostRepository.findDistinctCategories(BlogPostStatus.PUBLISHED);
    }

    public BlogPostDetailResponse findPublishedBySlug(String slug) throws DataNotFoundException {
        BlogPost post = blogPostRepository.findBySlugAndStatus(slug, BlogPostStatus.PUBLISHED)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        return new BlogPostDetailResponse(post.getSlug(), post.getTitle(), summaryText(post), post.getContent(),
                post.getCategory(), post.getAuthorName(), post.getImageUrl(), post.getPublishedAt(),
                readingMinutes(post.getContent()), findRelated(post).stream().map(this::toSummary).toList());
    }

    /** Same-category posts first; topped up with the newest others so the strip is never needlessly empty. */
    private List<BlogPost> findRelated(BlogPost post) {
        PageRequest limit = PageRequest.of(0, RELATED_COUNT);
        List<BlogPost> related = post.getCategory() == null || post.getCategory().isBlank()
                ? List.of()
                : blogPostRepository.findByStatusAndIdNotAndCategoryIgnoreCaseOrderByPublishedAtDesc(
                        BlogPostStatus.PUBLISHED, post.getId(), post.getCategory(), limit);
        if (related.size() >= RELATED_COUNT) return related;

        List<BlogPost> merged = new java.util.ArrayList<>(related);
        for (BlogPost other : blogPostRepository.findByStatusAndIdNotOrderByPublishedAtDesc(
                BlogPostStatus.PUBLISHED, post.getId(), PageRequest.of(0, RELATED_COUNT + related.size()))) {
            if (merged.size() >= RELATED_COUNT) break;
            if (merged.stream().noneMatch(m -> m.getId().equals(other.getId()))) merged.add(other);
        }
        return merged;
    }

    // ---- Helpers ----

    private BlogPost find(String id) throws DataNotFoundException {
        return blogPostRepository.findById(id).orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
    }

    private void apply(BlogPost post, BlogPostRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw new IllegalArgumentException("Title is required.");
        }
        if (request.content() == null || request.content().isBlank()) {
            throw new IllegalArgumentException("Content is required.");
        }
        BlogPostStatus status = parseStatus(request.status());

        post.setTitle(request.title().trim());
        post.setExcerpt(blankToNull(request.excerpt()));
        post.setContent(request.content().trim());
        post.setCategory(blankToNull(request.category()));
        post.setAuthorName(blankToNull(request.authorName()));
        post.setImageUrl(blankToNull(request.imageUrl()));
        post.setStatus(status);
        post.setShowOnHome(Boolean.TRUE.equals(request.showOnHome()));
        if (status == BlogPostStatus.PUBLISHED && post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }
    }

    private BlogPostStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return BlogPostStatus.DRAFT;
        try {
            return BlogPostStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Status must be DRAFT or PUBLISHED.");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String uniqueSlug(String title) {
        String base = slugify(title);
        String candidate = base;
        for (int suffix = 2; RESERVED_SLUGS.contains(candidate) || blogPostRepository.existsBySlug(candidate); suffix++) {
            candidate = base + "-" + suffix;
        }
        return candidate;
    }

    static String slugify(String title) {
        String slug = title.toLowerCase(Locale.GERMAN)
                .replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss");
        slug = Normalizer.normalize(slug, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        slug = slug.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+|-+$)", "");
        if (slug.length() > MAX_SLUG_LENGTH) {
            slug = slug.substring(0, MAX_SLUG_LENGTH).replaceAll("-+$", "");
        }
        return slug.isEmpty() ? "post" : slug;
    }

    static int readingMinutes(String content) {
        if (content == null || content.isBlank()) return 1;
        int words = content.trim().split("\\s+").length;
        return Math.max(1, (int) Math.ceil(words / (double) WORDS_PER_MINUTE));
    }

    /** The admin-written excerpt, or the first ~160 characters of the Markdown content with formatting stripped. */
    private String summaryText(BlogPost post) {
        if (post.getExcerpt() != null && !post.getExcerpt().isBlank()) return post.getExcerpt();
        String plain = post.getContent()
                .replaceAll("!\\[[^]]*]\\([^)]*\\)", " ")
                .replaceAll("\\[([^]]*)]\\([^)]*\\)", "$1")
                .replaceAll("(?m)^\\s{0,3}(#{1,6}|>|[-*+]|\\d+\\.)\\s+", "")
                .replaceAll("[*_`~]", "")
                .replaceAll("\\s+", " ")
                .trim();
        if (plain.length() <= EXCERPT_FALLBACK_LENGTH) return plain;
        return plain.substring(0, EXCERPT_FALLBACK_LENGTH).replaceAll("\\s+\\S*$", "") + "…";
    }

    private BlogPostSummaryResponse toSummary(BlogPost p) {
        return new BlogPostSummaryResponse(p.getSlug(), p.getTitle(), summaryText(p), p.getCategory(), p.getAuthorName(),
                p.getImageUrl(), p.getPublishedAt(), readingMinutes(p.getContent()));
    }

    private BlogPostResponse toAdminResponse(BlogPost p) {
        return new BlogPostResponse(p.getId(), p.getSlug(), p.getTitle(), p.getExcerpt(), p.getContent(), p.getCategory(),
                p.getAuthorName(), p.getImageUrl(), p.getStatus().name(), p.isShowOnHome(), p.getPublishedAt(), p.getCreatedAt(), p.getUpdatedAt());
    }
}
