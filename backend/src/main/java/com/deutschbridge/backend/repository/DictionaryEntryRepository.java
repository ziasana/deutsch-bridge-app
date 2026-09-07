package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.DictionaryEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DictionaryEntryRepository extends JpaRepository<DictionaryEntry, String> {

    Optional<DictionaryEntry> findByLemmaIgnoreCase(String lemma);

    boolean existsByLemmaIgnoreCase(String lemma);

    @Query("select lower(d.lemma) from dictionary_entry d")
    List<String> findAllLemmasLowercase();
}
