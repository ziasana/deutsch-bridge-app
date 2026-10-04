package com.deutschbridge.backend.model.entity;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.deutschbridge.backend.model.enums.BlogPostStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** An admin-written blog post (Markdown content) shown on the public home page and /blog pages once PUBLISHED. */
@Entity
@Table(name = "blog_posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogPost {
    @Id
    private String id;

    /** URL-safe, unique, generated from the title on create and never changed afterwards. */
    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    /** Short teaser for cards - optional; the public API derives one from the content when blank. */
    @Column(columnDefinition = "TEXT")
    private String excerpt;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    /** Free-text label ("Grammar", "Study Tips") used for the badge and the /blog filter. */
    private String category;

    private String authorName;

    /** Relative URL under /uploads - null until an admin uploads a cover. */
    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    /** Admin opt-in for the home page's blog section (newest 3 flagged posts; falls back to the latest posts if none). */
    @Column(nullable = false)
    private boolean showOnHome = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BlogPostStatus status = BlogPostStatus.DRAFT;

    /** Set the first time the post is published; drives ordering and the date shown to readers. */
    private LocalDateTime publishedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = NanoIdUtils.randomNanoId();
        }
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
