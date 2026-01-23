package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.NomenVerbConnection;
import com.deutschbridge.backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface LearningProgressRepository extends JpaRepository<LearningProgress,String> {

    Optional<LearningProgress> findByUserAndLesson(User user, GrammarLesson lesson);

    Optional<LearningProgress> findByUserAndNomenVerb(User user, NomenVerbConnection nomenVerb);
}
