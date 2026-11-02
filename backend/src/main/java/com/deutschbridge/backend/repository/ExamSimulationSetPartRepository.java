package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamSimulationSetPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ExamSimulationSetPartRepository extends JpaRepository<ExamSimulationSetPart, String> {

    List<ExamSimulationSetPart> findBySetIdOrderByPartKeyAscOrdinalAsc(String setId);

    List<ExamSimulationSetPart> findBySetIdIn(Collection<String> setIds);

    /** In how many non-archived sets of the profile each exercise is used (exercises in no set are absent). */
    @Query("SELECT p.exerciseId AS exerciseId, COUNT(p) AS uses FROM ExamSimulationSetPart p, ExamSimulationSet s "
            + "WHERE p.setId = s.id AND s.profileCode = :code AND s.status <> com.deutschbridge.backend.model.enums.ExamSetStatus.ARCHIVED "
            + "GROUP BY p.exerciseId")
    List<ExerciseUse> countUses(@Param("code") String profileCode);

    interface ExerciseUse {
        String getExerciseId();

        long getUses();
    }

    void deleteBySetId(String setId);
}
