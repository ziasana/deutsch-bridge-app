package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.dto.PublicLearnDtos.*;
import com.deutschbridge.backend.model.enums.ExpressionType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.PublicLearnService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Unauthenticated, read-only "try it free" area: the same lists the dashboard shows, with the first item of every category
 * open and the rest locked. A locked item's content is never served; asking for it answers 403.
 */
@RestController
@RequestMapping("/api/public/learn")
public class PublicLearnController {

    /**
     * The content changes rarely and is the same for every visitor, so browsers and any CDN may reuse an answer for a few minutes.
     * Redemittel glosses follow the Accept-Language header, so that header is part of the cache key.
     */
    private static final CacheControl CACHE = CacheControl.maxAge(5, TimeUnit.MINUTES).cachePublic();

    private final PublicLearnService service;

    public PublicLearnController(PublicLearnService service) {
        this.service = service;
    }

    @GetMapping("/overview")
    public ResponseEntity<Overview> overview() {
        return cached(service.overview());
    }

    @GetMapping("/grammar")
    public ResponseEntity<GrammarLevelView> grammar(@RequestParam LearningLevel level) {
        return cached(service.grammar(level));
    }

    @GetMapping("/grammar/{id}")
    public ResponseEntity<GrammarFull> grammarLesson(@PathVariable String id) {
        return open(service.grammarLesson(id));
    }

    @GetMapping("/redemittel")
    public ResponseEntity<PhrasePage> redemittel(@RequestParam(required = false) LearningLevel level, @RequestParam(required = false) String category,
                                                 @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size) {
        return cached(service.redemittel(level, category, page, size));
    }

    @GetMapping("/expressions")
    public ResponseEntity<ExpressionPage> expressions(@RequestParam ExpressionType type, @RequestParam LearningLevel level,
                                                      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size) {
        return cached(service.expressions(type, level, page, size));
    }

    @GetMapping("/expressions/{id}")
    public ResponseEntity<ExpressionFull> expression(@PathVariable String id) {
        return open(service.expression(id));
    }

    @GetMapping("/reading")
    public ResponseEntity<ArticlePage> reading(@RequestParam LearningLevel level, @RequestParam(required = false) String category,
                                               @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "8") int size) {
        return cached(service.reading(level, category, page, size));
    }

    @GetMapping("/reading/{id}")
    public ResponseEntity<ArticleFull> article(@PathVariable String id) {
        return open(service.article(id));
    }

    private static <T> ResponseEntity<T> cached(T body) {
        return ResponseEntity.ok().cacheControl(CACHE).varyBy("Accept-Language").body(body);
    }

    /** Free items are returned; a locked or unknown item answers 403 so the existence of locked content is not a secret but its text is. */
    private static <T> ResponseEntity<T> open(Optional<T> item) {
        return item.map(PublicLearnController::cached).orElseGet(() -> ResponseEntity.status(HttpStatus.FORBIDDEN).build());
    }
}
