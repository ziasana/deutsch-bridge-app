package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ReadingArticleNavigationResponse;
import com.deutschbridge.backend.model.dto.ReadingArticlePageResponse;
import com.deutschbridge.backend.model.dto.ReadingArticleResponse;
import com.deutschbridge.backend.model.dto.ReadingCategoryResponse;
import com.deutschbridge.backend.model.dto.ReadingLevelSummaryResponse;
import com.deutschbridge.backend.model.dto.ReadingPendingBookmarkResponse;
import com.deutschbridge.backend.model.dto.ReadingViewCountResponse;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.ReadingArticleService;
import com.deutschbridge.backend.service.ReadingCategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reading")
public class ReadingController {

    private final ReadingArticleService readingArticleService;
    private final ReadingCategoryService readingCategoryService;

    public ReadingController(ReadingArticleService readingArticleService, ReadingCategoryService readingCategoryService) {
        this.readingArticleService = readingArticleService;
        this.readingCategoryService = readingCategoryService;
    }

    /** One page of a single level's lightweight list (no content/tokens/annotations/quiz). page is zero-based. */
    @GetMapping
    public ResponseEntity<ReadingArticlePageResponse> getPage(
            @RequestParam LearningLevel level,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "false") boolean bookmarked,
            @RequestParam(required = false) String categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {
        return new ResponseEntity<>(
                readingArticleService.findPageWithLearningProgress(level, search, bookmarked, categoryId, page, size), HttpStatus.OK);
    }

    /** Per-level totals and the current user's learned counts, for the level selector. */
    @GetMapping("/level-summary")
    public ResponseEntity<List<ReadingLevelSummaryResponse>> getLevelSummary() {
        return new ResponseEntity<>(readingArticleService.getLevelSummary(), HttpStatus.OK);
    }

    /** Every category ("Thema"), for the reading list's filter dropdown. */
    @GetMapping("/categories")
    public ResponseEntity<List<ReadingCategoryResponse>> getCategories() {
        return new ResponseEntity<>(readingCategoryService.findAllPublic(), HttpStatus.OK);
    }

    /** Bookmarked articles the user hasn't learned yet, across all levels, oldest bookmark first. */
    @GetMapping("/bookmarks/pending")
    public ResponseEntity<List<ReadingPendingBookmarkResponse>> getPendingBookmarks() {
        return new ResponseEntity<>(readingArticleService.getPendingBookmarks(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReadingArticleResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(readingArticleService.findByIdWithLearningProgress(id), HttpStatus.OK);
    }

    /** The previous/next article in the same level's list order, for the reading page's Previous/Next controls. */
    @GetMapping("/{id}/navigation")
    public ResponseEntity<ReadingArticleNavigationResponse> getNavigation(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(readingArticleService.findNavigation(id), HttpStatus.OK);
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<ReadingViewCountResponse> recordView(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(readingArticleService.recordView(id), HttpStatus.OK);
    }

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<ReadingArticleResponse> addBookmark(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(readingArticleService.addBookmark(id), HttpStatus.OK);
    }

    @DeleteMapping("/{id}/bookmark")
    public ResponseEntity<ReadingArticleResponse> removeBookmark(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(readingArticleService.removeBookmark(id), HttpStatus.OK);
    }
}
