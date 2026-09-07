package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.DictionaryMissingReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DictionaryMissingReportRepository extends JpaRepository<DictionaryMissingReport, String> {
}
