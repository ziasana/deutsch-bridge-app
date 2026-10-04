package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.BlogPost;
import com.deutschbridge.backend.model.enums.BlogPostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, String> {

    boolean existsBySlug(String slug);

    Optional<BlogPost> findBySlug(String slug);

    Optional<BlogPost> findBySlugAndStatus(String slug, BlogPostStatus status);

    List<BlogPost> findByStatusAndShowOnHomeTrueOrderByPublishedAtDesc(BlogPostStatus status, Pageable pageable);

    Page<BlogPost> findByStatus(BlogPostStatus status, Pageable pageable);

    Page<BlogPost> findByStatusAndCategoryIgnoreCase(BlogPostStatus status, String category, Pageable pageable);

    List<BlogPost> findByStatusAndIdNotAndCategoryIgnoreCaseOrderByPublishedAtDesc(
            BlogPostStatus status, String id, String category, Pageable pageable);

    List<BlogPost> findByStatusAndIdNotOrderByPublishedAtDesc(BlogPostStatus status, String id, Pageable pageable);

    @Query("select distinct b.category from BlogPost b where b.status = :status and b.category is not null and b.category <> '' order by b.category")
    List<String> findDistinctCategories(@Param("status") BlogPostStatus status);

    List<BlogPost> findAllByOrderByCreatedAtDesc();
}
