package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserWordProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserWordProgressRepository extends JpaRepository<UserWordProgress, String> {

    Optional<UserWordProgress> findByUserAndLemma(User user, String lemma);

    List<UserWordProgress> findByUserAndLemmaIn(User user, List<String> lemmas);

    List<UserWordProgress> findByUser(User user);
}
