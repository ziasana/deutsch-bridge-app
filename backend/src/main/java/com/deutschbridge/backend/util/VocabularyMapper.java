package com.deutschbridge.backend.util;


import com.deutschbridge.backend.model.dto.UserVocabularyPracticeDTO;
import com.deutschbridge.backend.model.dto.VocabularyContentResponse;
import com.deutschbridge.backend.model.dto.VocabularyPracticeResponse;
import com.deutschbridge.backend.model.dto.VocabularyResponse;
import com.deutschbridge.backend.model.entity.UserVocabularyPractice;
import com.deutschbridge.backend.model.entity.Vocabulary;
import com.deutschbridge.backend.model.entity.VocabularyContent;

import java.util.List;
import java.util.Set;

public class VocabularyMapper {
    private VocabularyMapper() {
        throw new IllegalStateException("Mapper Utils class");
    }

    public static VocabularyResponse mapToVocabularyResponse(Vocabulary v) {
        return new VocabularyResponse(
                v.getId(),
                v.getWord(),
                v.getExample(),
                v.getSynonyms(),
                v.getUser().getEmail(),
                mapVocabularyContents(v.getVocabularyContents()),
                mapVocabularyPractices(v.getPractices())
        );
    }

    private static List<VocabularyContentResponse> mapVocabularyContents(Set<VocabularyContent> contents) {
        return contents.stream()
                .map(c -> new VocabularyContentResponse(
                        c.getMeaning(),
                        c.getLanguage()
                ))
                .toList();
    }

    private static List<UserVocabularyPracticeDTO> mapVocabularyPractices(Set<UserVocabularyPractice> practices) {
        return practices.stream()
                .map(p -> new UserVocabularyPracticeDTO(
                        p.getId(),
                        p.getSuccessRate(),
                        p.getLastPracticedAt()
                ))
                .toList();
    }

    public static VocabularyPracticeResponse mapVocabularyPracticeResponse(Vocabulary v) {
        return new VocabularyPracticeResponse(
                v.getId(),
                v.getWord(),
                v.getExample(),
                v.getSynonyms(),
                v.getVocabularyContents().stream().map(VocabularyContent::getMeaning).findFirst()
                );
    }

}
