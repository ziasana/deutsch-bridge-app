package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ReadingCategoryAdminResponse;
import com.deutschbridge.backend.model.dto.ReadingCategoryRequest;
import com.deutschbridge.backend.model.dto.ReadingCategoryResponse;
import com.deutschbridge.backend.model.entity.ReadingCategory;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.repository.ReadingCategoryRepository;
import com.deutschbridge.backend.service.cache.ContentCacheService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReadingCategoryService {

    private static final String NOT_FOUND_MSG = "Reading category not found!";

    private final ReadingCategoryRepository readingCategoryRepository;
    private final ReadingArticleRepository readingArticleRepository;
    private final ContentCacheService contentCacheService;

    public ReadingCategoryService(ReadingCategoryRepository readingCategoryRepository,
                                   ReadingArticleRepository readingArticleRepository,
                                   ContentCacheService contentCacheService) {
        this.readingCategoryRepository = readingCategoryRepository;
        this.readingArticleRepository = readingArticleRepository;
        this.contentCacheService = contentCacheService;
    }

    /** For the student-facing filter dropdown and the admin article form's category select. */
    public List<ReadingCategoryResponse> findAllPublic() {
        return readingCategoryRepository.findAllByOrderByTitleAsc().stream()
                .map(c -> new ReadingCategoryResponse(c.getId(), c.getTitle()))
                .toList();
    }

    /** Admin category table: same list, plus how many articles currently reference each one. */
    public List<ReadingCategoryAdminResponse> findAllForAdmin() {
        return readingCategoryRepository.findAllByOrderByTitleAsc().stream()
                .map(c -> new ReadingCategoryAdminResponse(c.getId(), c.getTitle(), readingArticleRepository.countByCategory(c)))
                .toList();
    }

    public ReadingCategoryAdminResponse createCategory(ReadingCategoryRequest request) {
        String title = validateTitle(request.title(), null);
        ReadingCategory category = new ReadingCategory();
        category.setTitle(title);
        category = readingCategoryRepository.save(category);
        return new ReadingCategoryAdminResponse(category.getId(), category.getTitle(), 0);
    }

    /** Renaming touches every cached list row that shows this category's title, across every level. */
    public ReadingCategoryAdminResponse updateCategory(String id, ReadingCategoryRequest request) throws DataNotFoundException {
        ReadingCategory category = readingCategoryRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        String title = validateTitle(request.title(), id);
        category.setTitle(title);
        category = readingCategoryRepository.save(category);
        contentCacheService.evictAllReadingArticleListPages();
        return new ReadingCategoryAdminResponse(category.getId(), category.getTitle(), readingArticleRepository.countByCategory(category));
    }

    /** Blocked while any article still references this category - reassign or clear them first. */
    public void deleteCategory(String id) throws DataNotFoundException {
        ReadingCategory category = readingCategoryRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        long articleCount = readingArticleRepository.countByCategory(category);
        if (articleCount > 0) {
            throw new IllegalArgumentException(
                    "This category is used by " + articleCount + " article(s). Reassign or remove them first.");
        }
        readingCategoryRepository.delete(category);
    }

    /** Bulk-import convenience: reuse an existing category by title (case-insensitive), or create one. */
    public ReadingCategory resolveOrCreateByTitle(String title) {
        String trimmed = title.trim();
        return readingCategoryRepository.findAllByOrderByTitleAsc().stream()
                .filter(c -> c.getTitle().equalsIgnoreCase(trimmed))
                .findFirst()
                .orElseGet(() -> {
                    ReadingCategory category = new ReadingCategory();
                    category.setTitle(trimmed);
                    return readingCategoryRepository.save(category);
                });
    }

    private String validateTitle(String title, String excludingId) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title is required.");
        }
        String trimmed = title.trim();
        boolean duplicate = excludingId == null
                ? readingCategoryRepository.existsByTitleIgnoreCase(trimmed)
                : readingCategoryRepository.existsByTitleIgnoreCaseAndIdNot(trimmed, excludingId);
        if (duplicate) {
            throw new IllegalArgumentException("A category with this title already exists.");
        }
        return trimmed;
    }
}
