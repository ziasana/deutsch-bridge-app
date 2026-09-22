package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.GrammarCategory;
import com.deutschbridge.backend.model.entity.GrammarCategoryTestAttempt;
import com.deutschbridge.backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GrammarCategoryTestAttemptRepository extends JpaRepository<GrammarCategoryTestAttempt, String> {

    Optional<GrammarCategoryTestAttempt> findByUserAndCategory(User user, GrammarCategory category);

    List<GrammarCategoryTestAttempt> findByUserAndCategoryIn(User user, List<GrammarCategory> categories);

    List<GrammarCategoryTestAttempt> findByUser(User user);

    @Modifying
    void deleteByCategory(GrammarCategory category);
}
