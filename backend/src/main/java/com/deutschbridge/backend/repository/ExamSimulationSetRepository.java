package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamSimulationSet;
import com.deutschbridge.backend.model.enums.ExamSetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamSimulationSetRepository extends JpaRepository<ExamSimulationSet, String> {

    List<ExamSimulationSet> findByProfileCodeAndStatusOrderByNumberAsc(String profileCode, ExamSetStatus status);

    List<ExamSimulationSet> findByProfileCodeOrderByNumberAsc(String profileCode);

    @Query("SELECT COALESCE(MAX(s.number), 0) FROM ExamSimulationSet s WHERE s.profileCode = :code")
    int maxNumber(@Param("code") String profileCode);
}
