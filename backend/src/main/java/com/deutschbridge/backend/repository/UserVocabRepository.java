package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.DictionaryEntry;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserVocab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserVocabRepository extends JpaRepository<UserVocab, String> {

    Optional<UserVocab> findByUserAndEntry(User user, DictionaryEntry entry);

    List<UserVocab> findByUserAndEntryIn(User user, List<DictionaryEntry> entries);

    List<UserVocab> findByUserOrderByAddedAtDesc(User user);

    void deleteByUserAndEntry_Id(User user, String entryId);
}
