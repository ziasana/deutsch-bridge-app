package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.RedemittelCollectionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RedemittelCollectionRepository extends JpaRepository<RedemittelCollectionItem, String> {

    Optional<RedemittelCollectionItem> findByUserIdAndPhraseId(String userId, String phraseId);

    List<RedemittelCollectionItem> findByUserIdAndPhraseIdIn(String userId, Collection<String> phraseIds);

    List<RedemittelCollectionItem> findByUserId(String userId);

    long countByUserId(String userId);

    void deleteByUserIdAndPhraseId(String userId, String phraseId);
}
