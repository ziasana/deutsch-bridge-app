package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.enums.ExamProfileStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamProfileRepository extends JpaRepository<ExamProfile, String> {

    List<ExamProfile> findByStatusOrderByTitleAscVersionDesc(ExamProfileStatus status);

    List<ExamProfile> findAllByOrderByCodeAscVersionDesc();

    Optional<ExamProfile> findByCodeAndVersion(String code, int version);

    boolean existsByCode(String code);

    @Query("SELECT COALESCE(MAX(p.version), 0) FROM ExamProfile p WHERE p.code = :code")
    int maxVersion(@Param("code") String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM ExamProfile p WHERE p.id = :id")
    Optional<ExamProfile> findByIdForUpdate(@Param("id") String id);
}
