package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.entity.ExamGeneratorTopic;
import com.deutschbridge.backend.repository.ExamGeneratorTopicRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * The saved topic list of an exam part's content generator: topics the admin added and built-in topics the admin removed. The built-in
 * list itself stays in the code; this only records the differences, so the same list shows up after a reload and for every admin.
 */
@Service
public class ExamGeneratorTopicService {

    private static final Pattern PART_KEY = Pattern.compile("[A-Z0-9_]{1,40}");
    private static final Pattern TOKEN = Pattern.compile("[A-Z0-9_]{1,60}");

    private final ExamGeneratorTopicRepository repository;

    public ExamGeneratorTopicService(ExamGeneratorTopicRepository repository) {
        this.repository = repository;
    }

    /** {@code custom}: the added topics (oldest first); {@code hidden}: tokens of the built-in topics that were removed. */
    public record Topics(List<String> custom, List<String> hidden) {
    }

    @Transactional(readOnly = true)
    public Topics list(String partKey) {
        List<ExamGeneratorTopic> rows = repository.findByPartKeyOrderByCreatedAtAsc(requirePart(partKey));
        return new Topics(
                rows.stream().filter(r -> ExamGeneratorTopic.CUSTOM.equals(r.getKind())).map(ExamGeneratorTopic::getTopic).toList(),
                rows.stream().filter(r -> ExamGeneratorTopic.HIDDEN.equals(r.getKind())).map(ExamGeneratorTopic::getTopic).toList());
    }

    /** Saves a topic of the admin's own; adding one that already exists (ignoring case) changes nothing. */
    @Transactional
    public Topics add(String partKey, String topic) {
        String part = requirePart(partKey);
        String clean = ExamContentPromptBuilder.cleanTopic(topic);
        if (clean == null) throw new IllegalArgumentException("The topic must not be empty.");
        boolean exists = repository.findByPartKeyAndKind(part, ExamGeneratorTopic.CUSTOM).stream()
                .anyMatch(t -> t.getTopic().equalsIgnoreCase(clean));
        if (!exists) repository.save(new ExamGeneratorTopic(part, ExamGeneratorTopic.CUSTOM, clean));
        return list(part);
    }

    /** Removes a topic the admin added. */
    @Transactional
    public Topics remove(String partKey, String topic) {
        String part = requirePart(partKey);
        String clean = ExamContentPromptBuilder.cleanTopic(topic);
        repository.findByPartKeyAndKind(part, ExamGeneratorTopic.CUSTOM).stream()
                .filter(t -> t.getTopic().equalsIgnoreCase(clean))
                .forEach(repository::delete);
        return list(part);
    }

    /** Removes (hidden = true) or brings back (false) one built-in topic, given by its token. */
    @Transactional
    public Topics setHidden(String partKey, String token, boolean hidden) {
        String part = requirePart(partKey);
        String value = token == null ? "" : token.trim().toUpperCase(Locale.ROOT);
        if (!TOKEN.matcher(value).matches()) throw new IllegalArgumentException("Unknown topic.");
        List<ExamGeneratorTopic> existing = repository.findByPartKeyAndKind(part, ExamGeneratorTopic.HIDDEN).stream()
                .filter(t -> t.getTopic().equals(value)).toList();
        if (hidden && existing.isEmpty()) repository.save(new ExamGeneratorTopic(part, ExamGeneratorTopic.HIDDEN, value));
        if (!hidden) repository.deleteAll(existing);
        return list(part);
    }

    /** Brings back every removed built-in topic. */
    @Transactional
    public Topics restoreBuiltIn(String partKey) {
        String part = requirePart(partKey);
        repository.deleteByPartKeyAndKind(part, ExamGeneratorTopic.HIDDEN);
        return list(part);
    }

    private static String requirePart(String partKey) {
        if (partKey == null || !PART_KEY.matcher(partKey).matches()) throw new IllegalArgumentException("Unknown exam part.");
        return partKey;
    }
}
